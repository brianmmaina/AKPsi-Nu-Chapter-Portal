// Network Admin · Directory tab — CRUD for the Firestore alumni/brothers
// profiles that power The Network's directory (Slice 1), distinct from this
// app's own Postgres brothers roster (Roster & Trees admin tab).

import { useState, useMemo } from 'react';

const svc = () => import('./networkService');

const BLANK = { name: '', company: '', role: '', field: '', location: '', gradYear: '', linkedin: '', email: '', mentor: false };

export default function NetworkDirectory({ directory, run }) {
  const [kind, setKind] = useState('alumni');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // { fbId, ...form } or null; fbId absent = new
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (directory[kind] || [])
      .filter((r) => !q || (r.name || '').toLowerCase().includes(q) || (r.company || '').toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [directory, kind, query]);

  const openNew = () => setEditing({ ...BLANK });
  const openEdit = (row) => setEditing({ ...BLANK, ...row });

  const save = async () => {
    if (!editing.name.trim()) return;
    setBusy(true);
    try {
      const api = await svc();
      const data = {
        name: editing.name.trim(),
        company: editing.company.trim(),
        role: editing.role.trim(),
        field: editing.field.trim(),
        location: editing.location.trim(),
        gradYear: editing.gradYear.trim(),
        linkedin: editing.linkedin.trim(),
        email: editing.email.trim().toLowerCase(),
        mentor: !!editing.mentor,
      };
      if (editing.fbId) {
        await run(() => api.updateDirectoryProfile(kind, editing.fbId, data), `${data.name} updated.`);
      } else {
        await run(() => api.createDirectoryProfile(kind, data), `${data.name} added to the ${kind} directory.`);
      }
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.name} from the ${kind} directory?`)) return;
    const api = await svc();
    await run(() => api.deleteDirectoryProfile(kind, row.fbId), `${row.name} removed.`);
  };

  if (editing) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="nd-name">Name</label>
            <input id="nd-name" className="ncr-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nd-company">Company</label>
            <input id="nd-company" className="ncr-input" value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nd-role">Role / Title</label>
            <input id="nd-role" className="ncr-input" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nd-field">Field / Industry</label>
            <input id="nd-field" className="ncr-input" value={editing.field} onChange={(e) => setEditing({ ...editing, field: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nd-location">Location</label>
            <input id="nd-location" className="ncr-input" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nd-grad">Grad Year</label>
            <input id="nd-grad" className="ncr-input" value={editing.gradYear} onChange={(e) => setEditing({ ...editing, gradYear: e.target.value })} />
          </div>
          <div>
            <label className="ncr-field-label" htmlFor="nd-linkedin">LinkedIn</label>
            <input id="nd-linkedin" className="ncr-input" value={editing.linkedin} onChange={(e) => setEditing({ ...editing, linkedin: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ncr-field-label" htmlFor="nd-email">Email</label>
            <input id="nd-email" className="ncr-input" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
          </div>
          {kind === 'alumni' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  className="ncr-checkbox"
                  checked={!!editing.mentor}
                  onChange={(e) => setEditing({ ...editing, mentor: e.target.checked })}
                />
                Available as a mentor
              </label>
            </div>
          )}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14, marginTop: 6 }}>
            <button className="ncr-btn" onClick={save} disabled={busy || !editing.name.trim()}>
              {busy ? 'Saving…' : editing.fbId ? 'Save Changes' : 'Add to Directory'}
            </button>
            <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={() => setEditing(null)} style={{ height: 48, padding: '0 24px', fontSize: 11, letterSpacing: '.22em' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={kind === 'alumni' ? 'ncr-btn' : 'ncr-btn-ghost'} onClick={() => setKind('alumni')} style={{ height: 38, padding: '0 16px' }}>
          Alumni ({directory.alumni.length})
        </button>
        <button className={kind === 'brothers' ? 'ncr-btn' : 'ncr-btn-ghost'} onClick={() => setKind('brothers')} style={{ height: 38, padding: '0 16px' }}>
          Brothers ({directory.brothers.length})
        </button>
        <span style={{ flex: 1 }} />
        <button className="ncr-btn-ghost" onClick={openNew} style={{ height: 38 }}>
          + Add Profile
        </button>
      </div>

      <input
        className="ncr-input"
        style={{ maxWidth: 320, marginBottom: 18 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or company…"
      />

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--ncr-ink)' }}>
            <th style={{ padding: '8px 10px', fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>Name</th>
            <th style={{ padding: '8px 10px', fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>Company</th>
            <th style={{ padding: '8px 10px' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fbId} style={{ borderBottom: '1px solid var(--ncr-rule)' }}>
              <td style={{ padding: '10px' }}>{row.name}</td>
              <td style={{ padding: '10px', color: 'var(--ncr-ink-mid)' }}>{row.company || '—'}</td>
              <td style={{ padding: '10px', textAlign: 'right', display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
                <button className="ncr-link-btn" onClick={() => openEdit(row)} style={{ fontSize: 11 }}>Edit</button>
                <button className="ncr-link-btn" onClick={() => remove(row)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>Remove</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: '18px 10px', color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5 }}>
                No {kind} profiles match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
