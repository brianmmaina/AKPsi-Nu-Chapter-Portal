// Add a Brother — officer roster entry. POST /api/brothers
// (auto-creates the big→little relationship when a Big is chosen).

import { useState } from 'react';
import { brothers as brothersApi } from '../api';

export default function AddBrotherScreen({ M, defaultFamily, canWrite, onDone, onCancel, notify }) {
  const [form, setForm] = useState({
    name: '',
    family: M.FAM[defaultFamily] ? defaultFamily : M.famOrder[0] || '',
    pledge: '',
    major: '',
    grad: '',
    big: '',
    linkedin: '',
    email: '',
    bio: '',
  });
  const [busy, setBusy] = useState(false);

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'family' ? { big: '' } : {}) }));

  const bigOptions = [
    { value: '', label: '—' },
    ...(M.byFamily[form.family] || []).map((id) => ({ value: id, label: M.brothers[id].name })),
  ];

  const submit = async () => {
    const name = form.name.trim();
    if (!name) {
      notify('Enter the brother’s full name.', 'error');
      return;
    }
    if (!canWrite) {
      notify('Sign in while connected to the chapter server to add brothers.', 'error');
      return;
    }
    setBusy(true);
    try {
      await brothersApi.create({
        family_id: parseInt(form.family, 10),
        name,
        pledge_class: form.pledge.trim() || null,
        major: form.major.trim() || null,
        graduation_year: parseInt(form.grad, 10) || null,
        fun_facts: form.bio.trim() || null,
        career_aspirations: null,
        status: 'studying',
        is_transfer: 0,
        big_id: form.big ? parseInt(form.big, 10) : null,
        linkedin_url: form.linkedin.trim() || null,
        email: form.email.trim() || null,
      });
      notify(`${name} added to the roster.`);
      await onDone(form.family);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Create failed';
      notify(`Could not add brother: ${msg}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ncr-shell">
      <div className="ncr-folio-row">
        <button className="ncr-link-btn" onClick={onCancel} style={{ fontSize: 11, letterSpacing: '.2em' }}>
          ← Lineage
        </button>
        <span className="ncr-folio-line" />
        <span className="ncr-folio-note">New Roster Entry</span>
      </div>
      <h1 className="ncr-display-1" style={{ margin: '14px 0 30px' }}>Add a Brother</h1>
      <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 44, alignItems: 'start', maxWidth: 760 }}>
        <div>
          <div className="ncr-field-label" style={{ marginBottom: 10 }}>Photograph</div>
          <div
            style={{
              width: '100%',
              aspectRatio: '1/1',
              border: '1.5px dashed var(--ncr-rule)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(43,35,24,.04) 0 8px, transparent 8px 16px)',
            }}
          >
            <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>
              Photo pending
            </span>
            <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, color: 'var(--ncr-faint)', marginTop: 5, textAlign: 'center', padding: '0 10px' }}>
              Auto-syncs from Google login
            </span>
          </div>
        </div>
        <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="ab-name">Full Name</label>
            <input id="ab-name" className="ncr-input" value={form.name} onChange={setF('name')} placeholder="First Last" />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="ab-family">Family</label>
            <select id="ab-family" className="ncr-select" value={form.family} onChange={setF('family')}>
              {M.famOrder.map((fidOpt) => (
                <option key={fidOpt} value={fidOpt}>{M.FAM[fidOpt].name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="ab-pledge">Pledge Class</label>
            <input id="ab-pledge" className="ncr-input" value={form.pledge} onChange={setF('pledge')} placeholder="e.g. Chi ’25" />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="ab-major">Major</label>
            <input id="ab-major" className="ncr-input" value={form.major} onChange={setF('major')} placeholder="e.g. Finance" />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="ab-grad">Grad Year</label>
            <input id="ab-grad" className="ncr-input" value={form.grad} onChange={setF('grad')} placeholder="2027" />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="ab-big">Big (mentor)</label>
            <select id="ab-big" className="ncr-select" value={form.big} onChange={setF('big')}>
              {bigOptions.map((o) => (
                <option key={o.value || 'none'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="ab-linkedin">LinkedIn</label>
            <input id="ab-linkedin" className="ncr-input" value={form.linkedin} onChange={setF('linkedin')} placeholder="linkedin.com/in/…" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="ab-email">Email (used for Google photo sync)</label>
            <input id="ab-email" className="ncr-input" value={form.email} onChange={setF('email')} placeholder="name@bu.edu" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="ab-bio">Biography</label>
            <textarea id="ab-bio" className="ncr-textarea" rows={3} value={form.bio} onChange={setF('bio')} placeholder="A sentence or two…" />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14, marginTop: 6 }}>
            <button className="ncr-btn" onClick={submit} disabled={busy}>
              {busy ? 'Saving…' : 'Add to Roster'}
            </button>
            <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={onCancel} style={{ height: 48, padding: '0 24px', fontSize: 11, letterSpacing: '.22em' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
