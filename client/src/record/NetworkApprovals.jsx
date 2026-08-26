// Network Admin · Approvals tab — grant/revoke approvedUsers docs, which
// gate roster/mentorship read access (see NetworkAdminScreen).

import { useState, useMemo } from 'react';

const svc = () => import('./networkService');

export default function NetworkApprovals({ approvedUsers, run }) {
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('brother');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return approvedUsers
      .filter((u) => !q || (u.email || '').toLowerCase().includes(q))
      .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }, [approvedUsers, query]);

  const submit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    const api = await svc();
    const ok = await run(() => api.upsertApprovedUser(trimmed, role), `${trimmed} approved as ${role}.`);
    if (ok) setEmail('');
    setBusy(false);
  };

  const revoke = async (u) => {
    if (!window.confirm(`Revoke approval for ${u.email}? This also removes any admin/family-head/eboard/DEI roles they have.`)) return;
    const api = await svc();
    await run(() => api.revokeApprovedUser(u.email), `${u.email} revoked.`);
  };

  return (
    <div>
      <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 14, alignItems: 'end', maxWidth: 640, marginBottom: 34 }}>
        <div>
          <label className="ncr-field-label" htmlFor="na-email">Email</label>
          <input id="na-email" className="ncr-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bu.edu" />
        </div>
        <div>
          <label className="ncr-field-label" htmlFor="na-role">Role</label>
          <select id="na-role" className="ncr-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="brother">Brother</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>
        <button className="ncr-btn" onClick={submit} disabled={busy || !email.trim()} style={{ height: 44 }}>
          {busy ? 'Saving…' : 'Approve'}
        </button>
      </div>

      <input
        className="ncr-input"
        style={{ maxWidth: 320, marginBottom: 18 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search approved emails…"
      />

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--ncr-ink)' }}>
            <th style={{ padding: '8px 10px', fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>Email</th>
            <th style={{ padding: '8px 10px', fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>Role</th>
            <th style={{ padding: '8px 10px' }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid var(--ncr-rule)' }}>
              <td style={{ padding: '10px' }}>{u.email}</td>
              <td style={{ padding: '10px', textTransform: 'capitalize' }}>{u.role || '—'}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                <button className="ncr-link-btn" onClick={() => revoke(u)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>
                  Revoke
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: '18px 10px', color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5 }}>
                No approved accounts match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
