// Network Admin · Mentorship tab — pairing creation, per-brother progress,
// and the check-in approval queue.

import { useState } from 'react';

const svc = () => import('./networkService');

const BLANK_PAIRING = {
  alumniName: '', alumniEmail: '', alumniCompany: '', alumniRole: '',
  brothers: [{ name: '', email: '' }],
};

export default function NetworkMentorship({ pairings, checkIns, netUser, run }) {
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const openNew = () => setEditing({ ...BLANK_PAIRING, brothers: [{ name: '', email: '' }] });
  const openEdit = (p) => setEditing({ ...p, brothers: p.brothers?.length ? p.brothers : [{ name: '', email: '' }] });

  const setBrother = (i, field, value) => {
    const brothers = editing.brothers.map((b, idx) => (idx === i ? { ...b, [field]: value } : b));
    setEditing({ ...editing, brothers });
  };

  const addBrotherRow = () => {
    if (editing.brothers.length >= 2) return;
    setEditing({ ...editing, brothers: [...editing.brothers, { name: '', email: '' }] });
  };

  const removeBrotherRow = (i) => setEditing({ ...editing, brothers: editing.brothers.filter((_, idx) => idx !== i) });

  const save = async () => {
    setBusy(true);
    const api = await svc();
    const ok = await run(() => api.savePairing(editing), `Pairing saved for ${editing.alumniName || editing.alumniEmail}.`);
    setBusy(false);
    if (ok) setEditing(null);
  };

  const removePairing = async (p) => {
    if (!window.confirm(`Delete the pairing for ${p.alumniName || p.alumniEmail}?`)) return;
    const api = await svc();
    await run(() => api.deletePairing(p.id), 'Pairing deleted.');
  };

  const review = async (req, approved) => {
    const api = await svc();
    await run(
      () => api.reviewCheckInRequest(req.id, approved, netUser?.email),
      approved ? `Check-in approved for ${req.brotherName || req.brotherEmail}.` : 'Check-in rejected.',
    );
  };

  if (editing) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="nm-alumni-name">Alumni Mentor Name</label>
            <input id="nm-alumni-name" className="ncr-input" value={editing.alumniName} onChange={(e) => setEditing({ ...editing, alumniName: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nm-alumni-email">Alumni Email</label>
            <input id="nm-alumni-email" className="ncr-input" value={editing.alumniEmail} onChange={(e) => setEditing({ ...editing, alumniEmail: e.target.value })} disabled={!!editing.id} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nm-alumni-company">Company</label>
            <input id="nm-alumni-company" className="ncr-input" value={editing.alumniCompany} onChange={(e) => setEditing({ ...editing, alumniCompany: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="nm-alumni-role">Role / Title</label>
            <input id="nm-alumni-role" className="ncr-input" value={editing.alumniRole} onChange={(e) => setEditing({ ...editing, alumniRole: e.target.value })} />
          </div>

          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--ncr-rule)', paddingTop: 16, marginTop: 6 }}>
            <div className="ncr-field-label" style={{ marginBottom: 10 }}>Brothers (up to 2)</div>
            {editing.brothers.map((b, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10 }}>
                <input className="ncr-input" placeholder="Name" value={b.name} onChange={(e) => setBrother(i, 'name', e.target.value)} />
                <input className="ncr-input" placeholder="Email" value={b.email} onChange={(e) => setBrother(i, 'email', e.target.value)} />
                {editing.brothers.length > 1 && (
                  <button className="ncr-link-btn" onClick={() => removeBrotherRow(i)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>Remove</button>
                )}
              </div>
            ))}
            {editing.brothers.length < 2 && (
              <button className="ncr-link-btn" onClick={addBrotherRow} style={{ fontSize: 11 }}>+ Add a second brother</button>
            )}
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14, marginTop: 6 }}>
            <button className="ncr-btn" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : editing.id ? 'Save Changes' : 'Create Pairing'}
            </button>
            <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={() => setEditing(null)} style={{ height: 48, padding: '0 24px', fontSize: 11, letterSpacing: '.22em' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingCheckIns = checkIns.filter((c) => c.status === 'pending');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="ncr-field-label" style={{ fontSize: 12 }}>Pairings</div>
        <button className="ncr-btn-ghost" onClick={openNew} style={{ height: 38 }}>+ New Pairing</button>
      </div>

      {pairings.map((p) => (
        <div key={p.id} className="ncr-card" style={{ padding: '16px 20px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 17, fontWeight: 700, color: 'var(--ncr-ink)' }}>
                {p.alumniName || p.alumniEmail} <span style={{ fontWeight: 400, color: 'var(--ncr-muted)', fontSize: 13 }}>· mentor</span>
              </div>
              {(p.brothers || []).map((b) => (
                <div key={b.email} style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12.5, color: 'var(--ncr-ink-mid)', marginTop: 4 }}>
                  {b.name} — {b.completedCheckIns || 0}/{b.totalCheckIns || 0} check-ins
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="ncr-link-btn" onClick={() => openEdit(p)} style={{ fontSize: 11 }}>Edit</button>
              <button className="ncr-link-btn" onClick={() => removePairing(p)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>Delete</button>
            </div>
          </div>
        </div>
      ))}
      {pairings.length === 0 && (
        <div style={{ color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5, marginBottom: 30 }}>No pairings yet.</div>
      )}

      <div className="ncr-field-label" style={{ fontSize: 12, margin: '30px 0 14px' }}>
        Check-in Requests {pendingCheckIns.length > 0 && `(${pendingCheckIns.length} pending)`}
      </div>
      {checkIns.map((c) => (
        <div key={c.id} className="ncr-card" style={{ padding: '14px 20px', marginBottom: 10, opacity: c.status === 'pending' ? 1 : 0.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink)' }}>
              {c.brotherName || c.brotherEmail} × {c.alumniName || c.alumniEmail}
              <span style={{ color: 'var(--ncr-muted)', marginLeft: 8, textTransform: 'capitalize' }}>· {c.status}</span>
            </div>
            {c.status === 'pending' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="ncr-link-btn" onClick={() => review(c, true)} style={{ fontSize: 11 }}>Approve</button>
                <button className="ncr-link-btn" onClick={() => review(c, false)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>Reject</button>
              </div>
            )}
          </div>
        </div>
      ))}
      {checkIns.length === 0 && (
        <div style={{ color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5 }}>No check-in requests yet.</div>
      )}
    </div>
  );
}
