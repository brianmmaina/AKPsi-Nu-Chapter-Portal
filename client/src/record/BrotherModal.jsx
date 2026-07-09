// Brother record modal — bio, socials, live per-event point history grouped
// by category, streak progress, correction request, and the officer-gated
// Edit Record form (profile fields + Big change + photo upload).

import { useState, useMemo } from 'react';
import { brothers as brothersApi, relationships as relationshipsApi } from '../api';
import { getSupabaseClient } from '../services/supabaseClient';
import { CAT_COLOR, CAT_SOFT, CAT_LABEL, STREAK_META } from './palette';

const PHOTO_BUCKET = 'profile-photos';
const VPAA_EMAIL = 'akpsinuvpaa@gmail.com';

const fieldRow = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(43,35,24,.12)' };
const fieldKey = { fontFamily: 'var(--ncr-ui)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ncr-muted)' };
const fieldVal = { fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink)', textAlign: 'right' };

export default function BrotherModal({ M, brotherId, pointsData, tfLabel, canEdit, onClose, onSaved, notify }) {
  const sb = M.brothers[brotherId];

  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionEvent, setCorrectionEvent] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [edBusy, setEdBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Real per-event breakdown when live points data is available (matched by roster name).
  const groups = useMemo(() => {
    if (!sb) return [];
    let entries = [];
    const pm = pointsData
      ? (pointsData.members || []).find((m) => String(m.memberName || '').toLowerCase() === sb.name.toLowerCase())
      : null;
    if (pm) {
      const evMap = new Map((pointsData.events || []).map((ev) => [ev.id, ev]));
      const fmt = (d) => {
        const dt = new Date(d);
        return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString([], { month: 'short', day: '2-digit' });
      };
      entries = (pointsData.awards || [])
        .filter((a) => a.memberId === pm.memberId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((a) => {
          const ev = evMap.get(a.eventId);
          return {
            date: fmt(ev && ev.date ? ev.date : a.createdAt),
            eventName: ev ? ev.name : a.isAdjustment ? 'Manual adjustment' : 'Award',
            category: a.isAdjustment ? 'ADJUSTMENT' : ev ? ev.category : 'OTHER',
            points: a.points,
            isAdjustment: !!a.isAdjustment,
            note: a.note,
          };
        });
    }
    const byCat = {};
    entries.forEach((e) => {
      if (!byCat[e.category]) byCat[e.category] = { category: e.category, total: 0, events: [] };
      byCat[e.category].events.push(e);
      byCat[e.category].total += e.points;
    });
    return Object.values(byCat);
  }, [sb, pointsData]);

  if (!sb) return null;

  const sk = sb.streakKey ? STREAK_META[sb.streakKey] : null;
  const tiers = [
    { t: 3, l: 'On Fire' },
    { t: 5, l: 'Locked' },
    { t: 8, l: 'G.O.A.T' },
  ];
  const next = tiers.find((x) => x.t > sb.streak);
  const prevT = [...tiers].reverse().find((x) => x.t <= sb.streak)?.t || 0;
  const streakPct = next
    ? Math.round(((sb.streak - prevT) / (next.t - prevT)) * 100)
    : sb.streak > 0
      ? 100
      : 0;

  const openEdit = () => {
    setForm({
      name: sb.name,
      pledge_class: sb.pledgeClass === '—' ? '' : sb.pledgeClass,
      major: sb.major === '—' ? '' : sb.major,
      graduation_year: sb.gradYear === '—' ? '' : sb.gradYear,
      fun_facts: sb.bio || '',
      linkedin_url: sb.linkedin || '',
      instagram_url: sb.instagram || '',
      email: sb.email || '',
      status: sb.status || 'studying',
      big_id: M.bigOf[sb.id] || '',
    });
    setPhotoFile(null);
    setEditOpen(true);
  };

  const uploadPhoto = async () => {
    if (!photoFile) return sb.photo || null;
    const supabase = getSupabaseClient();
    if (!supabase) return sb.photo || null;
    try {
      const ext = photoFile.name.split('.').pop();
      const path = `brothers/${sb.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photoFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch {
      notify('Photo upload failed — record saved without a new image.', 'error');
      return sb.photo || null;
    }
  };

  const saveEdit = async () => {
    if (!form) return;
    setEdBusy(true);
    try {
      const photoUrl = await uploadPhoto();
      await brothersApi.update(sb.id, {
        name: form.name.trim() || sb.name,
        pledge_class: form.pledge_class.trim() || null,
        major: form.major.trim() || null,
        graduation_year: parseInt(form.graduation_year, 10) || null,
        career_aspirations: sb.career || null,
        fun_facts: form.fun_facts.trim() || null,
        status: form.status === 'graduated' ? 'graduated' : 'studying',
        is_transfer: sb.isTransfer ? 1 : 0,
        profile_image_url: photoUrl,
        linkedin_url: form.linkedin_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        personal_website_url: sb.website || null,
        email: form.email.trim() || null,
      });
      const prevBig = M.bigOf[sb.id] || '';
      if (String(form.big_id) !== String(prevBig)) {
        await relationshipsApi.create({
          family_id: parseInt(sb.familyId, 10),
          big_id: form.big_id ? parseInt(form.big_id, 10) : null,
          little_id: parseInt(sb.id, 10),
        });
      }
      setEditOpen(false);
      notify('Record updated.');
      await onSaved();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not save.';
      notify(`Could not save: ${msg}`, 'error');
    } finally {
      setEdBusy(false);
    }
  };

  const submitCorrection = () => {
    if (!correctionReason.trim()) {
      notify('Describe the correction first.', 'error');
      return;
    }
    const subject = encodeURIComponent(`Point Correction Request — ${sb.name}`);
    const body = `Brother: ${sb.name}\nEvent: ${correctionEvent || '(not specified)'}\n\nRequested correction:\n${correctionReason.trim()}`;
    try {
      window.location.href = `mailto:${VPAA_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
    } catch {
      /* mail client unavailable */
    }
    setCorrectionOpen(false);
    setCorrectionEvent('');
    setCorrectionReason('');
    notify('Correction request routed to the VPAA.');
  };

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const edBigOptions = [
    { value: '', label: '— (no big / root)' },
    ...(M.byFamily[sb.familyId] || [])
      .filter((id) => id !== sb.id)
      .map((id) => ({ value: id, label: M.brothers[id].name })),
  ];

  return (
    <div className="ncr-modal-backdrop" onClick={onClose}>
      <div
        className="ncr-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(760px, 100%)', borderTop: `5px solid ${sb.accent}`, padding: '40px 44px 38px' }}
      >
        <button className="ncr-modal-x" onClick={onClose} aria-label="Close">×</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 11, height: 11, background: sb.accent }} />
          <span className="ncr-label" style={{ letterSpacing: '.22em' }}>{sb.family} Family · Record</span>
        </div>
        <h2 style={{ fontFamily: 'var(--ncr-display)', fontWeight: 400, fontSize: 40, lineHeight: 1, margin: '0 0 8px', color: 'var(--ncr-ink)' }}>
          {sb.name}
        </h2>
        <div className="ncr-italic" style={{ fontSize: 16, marginBottom: 22 }}>
          {sb.role} · {sb.pledgeClass}
        </div>

        <div className="ncr-side-grid" style={{ borderTop: '1.5px solid var(--ncr-ink)', paddingTop: 22, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 30, alignItems: 'start' }}>
          {/* Left: photo + facts + socials + edit */}
          <div>
            <div
              style={{
                width: '100%',
                aspectRatio: '1/1',
                border: '1px solid var(--ncr-rule)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundImage: sb.photo ? 'none' : 'repeating-linear-gradient(45deg, rgba(43,35,24,.05) 0 9px, transparent 9px 18px)',
              }}
            >
              {sb.photo ? (
                <img src={sb.photo} alt={sb.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'var(--ncr-display)', fontSize: 46, color: 'var(--ncr-ink-mid)' }}>{sb.initials}</span>
              )}
            </div>
            <div style={{ marginTop: 16, borderTop: '1px solid var(--ncr-rule-soft)' }}>
              <div style={fieldRow}><span style={fieldKey}>Major</span><span style={fieldVal}>{sb.major}</span></div>
              <div style={fieldRow}><span style={fieldKey}>Class of</span><span style={fieldVal}>{sb.gradYear}</span></div>
              <div style={{ ...fieldRow, borderBottom: 'none' }}><span style={fieldKey}>Big</span><span style={fieldVal}>{sb.bigName}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
              {sb.linkedin && (
                <a className="ncr-out-link" href={sb.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              )}
              {sb.instagram && (
                <a className="ncr-out-link" href={sb.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
              )}
              {sb.website && (
                <a className="ncr-out-link" href={sb.website} target="_blank" rel="noopener noreferrer">Website ↗</a>
              )}
            </div>
            {canEdit && !editOpen && (
              <button
                className="ncr-btn-ghost"
                onClick={openEdit}
                style={{ marginTop: 14, width: '100%', height: 38, fontSize: 10, letterSpacing: '.18em' }}
              >
                Edit Record
              </button>
            )}
          </div>

          {/* Right: bio + points + history */}
          <div>
            {sb.bio && (
              <p style={{ fontFamily: 'var(--ncr-serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--ncr-ink-soft)', margin: '0 0 18px' }}>{sb.bio}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>
                  Life Points · {tfLabel}
                </div>
                <div className="ncr-fig" style={{ fontFamily: 'var(--ncr-display)', fontSize: 40, lineHeight: 1, color: 'var(--ncr-ink)' }}>{sb.points}</div>
              </div>
              {sb.streak > 0 && (
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-ink-mid)' }}>
                      {sb.streak}-event attendance streak
                    </span>
                    <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, color: 'var(--ncr-muted)' }}>
                      {next ? `${next.t - sb.streak} to ${next.l}` : 'Max tier'}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(43,35,24,.1)' }}>
                    <div style={{ height: '100%', width: `${streakPct}%`, background: sk ? sk.color : '#b5651d' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--ncr-muted)', marginBottom: 8 }}>
              Point History · by category
            </div>
            {groups.length === 0 && (
              <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', margin: '6px 0 12px' }}>
                No recorded events for this brother yet this term.
              </div>
            )}
            {groups.map((g) => (
              <div key={g.category} style={{ border: '1px solid var(--ncr-rule-soft)', marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderBottom: '1px solid rgba(43,35,24,.12)',
                    background: CAT_SOFT[g.category] || CAT_SOFT.OTHER,
                  }}
                >
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: CAT_COLOR[g.category] || CAT_COLOR.OTHER }}>
                    {CAT_LABEL[g.category] || g.category}
                  </span>
                  <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, color: 'var(--ncr-ink)' }}>{g.total} pts</span>
                </div>
                {g.events.map((e, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid rgba(43,35,24,.07)' }}>
                    <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>{e.date}</span>
                    <span>
                      <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink)' }}>{e.eventName}</span>
                      {e.isAdjustment && (
                        <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 8.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ncr-neg)', border: '1px solid rgba(140,74,58,.45)', padding: '1px 6px', marginLeft: 8 }}>
                          Adjustment
                        </span>
                      )}
                      {e.note && (
                        <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)', marginTop: 2 }}>{e.note}</span>
                      )}
                    </span>
                    <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 14, color: e.points >= 0 ? 'var(--ncr-green)' : 'var(--ncr-neg)' }}>
                      {e.points >= 0 ? '+' : ''}
                      {e.points}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', marginTop: 10 }}>
              Think something's off?{' '}
              <button
                onClick={() => setCorrectionOpen((v) => !v)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--ncr-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ncr-crimson)' }}
              >
                Request a correction
              </button>{' '}
              — routed to the VPAA.
            </div>
            {correctionOpen && (
              <div style={{ marginTop: 14, border: '1px solid rgba(43,35,24,.3)', background: 'var(--ncr-card-alt)', padding: 18 }}>
                <div className="ncr-field-label" style={{ letterSpacing: '.18em' }}>Event in question</div>
                <input
                  className="ncr-input"
                  value={correctionEvent}
                  onChange={(e) => setCorrectionEvent(e.target.value)}
                  placeholder="e.g. Service Saturday · Feb 04"
                  style={{ height: 40, fontSize: 14, marginBottom: 16 }}
                />
                <div className="ncr-field-label" style={{ letterSpacing: '.18em' }}>What should change?</div>
                <textarea
                  className="ncr-textarea"
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Describe the correction…"
                  style={{ fontSize: 14 }}
                />
                <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                  <button className="ncr-btn" onClick={submitCorrection} style={{ height: 42, padding: '0 22px', fontSize: 10.5, letterSpacing: '.2em' }}>
                    Send Request
                  </button>
                  <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={() => setCorrectionOpen(false)} style={{ height: 42, padding: '0 18px', fontSize: 10.5, letterSpacing: '.2em' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit record (officers · PUT /api/brothers/:id + relationship upsert) */}
        {editOpen && form && (
          <div style={{ marginTop: 26, borderTop: '3px double var(--ncr-ink)', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
              <span className="ncr-label ncr-label--gold" style={{ letterSpacing: '.22em' }}>Edit Record · saved to the chapter database</span>
              <button className="ncr-link-btn" onClick={() => setEditOpen(false)} style={{ fontSize: 11 }}>Cancel</button>
            </div>
            <div className="ncr-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Full Name</label>
                <input className="ncr-input" style={{ height: 40 }} value={form.name} onChange={setF('name')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Pledge Class</label>
                <input className="ncr-input" style={{ height: 40, fontSize: 14 }} value={form.pledge_class} onChange={setF('pledge_class')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Major</label>
                <input className="ncr-input" style={{ height: 40, fontSize: 14 }} value={form.major} onChange={setF('major')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Grad Year</label>
                <input className="ncr-input" style={{ height: 40, fontSize: 14 }} value={form.graduation_year} onChange={setF('graduation_year')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Status</label>
                <select className="ncr-select" style={{ height: 40, fontSize: 13 }} value={form.status} onChange={setF('status')}>
                  <option value="studying">Studying</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Big (mentor)</label>
                <select className="ncr-select" style={{ height: 40, fontSize: 13 }} value={form.big_id} onChange={setF('big_id')}>
                  {edBigOptions.map((o) => (
                    <option key={o.value || 'none'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Email</label>
                <input className="ncr-input" style={{ height: 40, fontSize: 14 }} value={form.email} onChange={setF('email')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>LinkedIn</label>
                <input className="ncr-input" style={{ height: 40, fontSize: 14 }} value={form.linkedin_url} onChange={setF('linkedin_url')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Instagram</label>
                <input className="ncr-input" style={{ height: 40, fontSize: 14 }} value={form.instagram_url} onChange={setF('instagram_url')} />
              </div>
              <div>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Photograph</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-ink-mid)', width: '100%' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="ncr-field-label" style={{ letterSpacing: '.18em', marginBottom: 6 }}>Fun Facts / Bio</label>
                <textarea className="ncr-textarea" rows={2} style={{ fontSize: 14 }} value={form.fun_facts} onChange={setF('fun_facts')} />
              </div>
            </div>
            <button className="ncr-btn" onClick={saveEdit} disabled={edBusy} style={{ marginTop: 18, height: 44, padding: '0 26px', fontSize: 10.5 }}>
              {edBusy ? 'Saving…' : 'Save Record'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
