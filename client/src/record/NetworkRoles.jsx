// Network Admin · Roles tab — grant/revoke the four elevated-privilege
// collections (admins, familyHeads, eboardMembers, deiEditors). Each is its
// own collection keyed by the same email doc-id scheme; doc existence is
// the grant (eboardMembers/deiEditors also carry an `active` flag).

import { useState, useMemo } from 'react';

const svc = () => import('./networkService');

const th = { padding: '8px 10px', fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ncr-muted)' };
const td = { padding: '10px', verticalAlign: 'top' };

export default function NetworkRoles({ approvedUsers, roles, run }) {
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState({});

  // Union of everyone with an approvedUsers doc OR any elevated role, so a
  // role granted directly (bypassing Approvals) still shows up here.
  const emails = useMemo(() => {
    const byId = new Map();
    approvedUsers.forEach((u) => byId.set(u.id, u.email));
    Object.entries(roles).forEach(([id, grants]) => {
      if (!byId.has(id)) {
        const anyGrant = grants.admins || grants.familyHeads || grants.eboardMembers || grants.deiEditors;
        byId.set(id, anyGrant?.email || id.replace(/_/g, '.'));
      }
    });
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [approvedUsers, roles]);

  const toggle = (email, setter, on, extra) => run(async () => {
    const api = await svc();
    await setter(api, email, on, extra);
  });

  const categoriesFor = (id) => {
    const existing = roles[id]?.deiEditors?.categories || {};
    return { ...existing, ...(newCategory[id] ? { [newCategory[id]]: true } : {}) };
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end', maxWidth: 460, marginBottom: 30 }}>
        <div style={{ flex: 1 }}>
          <label className="ncr-field-label" htmlFor="nr-email">Grant a role to a new email</label>
          <input id="nr-email" className="ncr-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@bu.edu" />
        </div>
        <button
          className="ncr-btn-ghost"
          disabled={!newEmail.trim()}
          onClick={async () => {
            const email = newEmail.trim();
            const api = await svc();
            await run(() => api.setAdmin(email, true), `${email} granted admin.`);
            setNewEmail('');
          }}
          style={{ height: 44 }}
        >
          + Admin
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1.5px solid var(--ncr-ink)' }}>
            <th style={th}>Email</th>
            <th style={th}>Admin</th>
            <th style={th}>Family Head</th>
            <th style={th}>Eboard</th>
            <th style={th}>DEI Editor</th>
          </tr>
        </thead>
        <tbody>
          {emails.map(([id, email]) => {
            const grants = roles[id] || {};
            const isAdmin = !!grants.admins;
            const isFamilyHead = !!grants.familyHeads;
            const eboardActive = !!grants.eboardMembers?.active;
            const deiActive = !!grants.deiEditors?.active;
            const cats = categoriesFor(id);

            return (
              <tr key={id} style={{ borderBottom: '1px solid var(--ncr-rule)' }}>
                <td style={td}>{email}</td>
                <td style={td}>
                  <input
                    type="checkbox"
                    className="ncr-checkbox"
                    checked={isAdmin}
                    onChange={(e) => toggle(email, (api, em, on) => api.setAdmin(em, on), e.target.checked)}
                  />
                </td>
                <td style={td}>
                  <input
                    type="checkbox"
                    className="ncr-checkbox"
                    checked={isFamilyHead}
                    onChange={(e) => toggle(email, (api, em, on) => api.setFamilyHead(em, on), e.target.checked)}
                  />
                </td>
                <td style={td}>
                  <input
                    type="checkbox"
                    className="ncr-checkbox"
                    checked={eboardActive}
                    onChange={(e) => toggle(email, (api, em, on) => api.setEboardMember(em, { active: on }), e.target.checked)}
                  />
                </td>
                <td style={td}>
                  <input
                    type="checkbox"
                    className="ncr-checkbox"
                    checked={deiActive}
                    onChange={(e) => toggle(email, (api, em, on) => api.setDeiEditor(em, { active: on, categories: cats }), e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  {deiActive && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {Object.keys(cats).map((cat) => (
                        <label key={cat} style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="checkbox"
                            className="ncr-checkbox"
                            checked={!!cats[cat]}
                            onChange={(e) => {
                              const next = { ...cats, [cat]: e.target.checked };
                              run(async () => {
                                const api = await svc();
                                await api.setDeiEditor(email, { active: true, categories: next });
                              });
                            }}
                          />
                          {cat}
                        </label>
                      ))}
                      <input
                        className="ncr-input"
                        style={{ width: 110, height: 28, fontSize: 11 }}
                        placeholder="+ category"
                        value={newCategory[id] || ''}
                        onChange={(e) => setNewCategory((m) => ({ ...m, [id]: e.target.value }))}
                        onKeyDown={async (e) => {
                          if (e.key !== 'Enter' || !newCategory[id]?.trim()) return;
                          const cat = newCategory[id].trim();
                          const next = { ...cats, [cat]: true };
                          await run(async () => {
                            const api = await svc();
                            await api.setDeiEditor(email, { active: true, categories: next });
                          });
                          setNewCategory((m) => ({ ...m, [id]: '' }));
                        }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {emails.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '18px 10px', color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5 }}>
                No approved accounts yet — add one from the Approvals tab first.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
