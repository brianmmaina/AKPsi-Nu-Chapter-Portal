// Network Admin — Firestore-backed RBAC + directory maintenance for the
// alumni/mentorship system (Slice 2 of the portal port). Gated by an actual
// `admins` Firestore doc for the signed-in Google account, not this app's
// own officer password — Firestore rules are the real boundary here (a
// client SDK app has no server of its own to trust), so the UI gate mirrors
// that instead of layering in an unrelated JWT check.

import { useState, useEffect, useCallback } from 'react';
import NetworkApprovals from './NetworkApprovals';
import NetworkRoles from './NetworkRoles';
import NetworkDirectory from './NetworkDirectory';

const svc = () => import('./networkService');

export default function NetworkAdminScreen({ netUser, onBack, notify }) {
  const [tab, setTab] = useState('approvals');
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [approvedUsers, setApprovedUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [directory, setDirectory] = useState({ alumni: [], brothers: [] });
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const api = await svc();
      const [users, roleMap, alumniSnap, brothersSnap] = await Promise.all([
        api.loadApprovedUsers(),
        api.loadRoleCollections(),
        api.loadAlumniDirectory(),
        api.loadBrotherDirectory(),
      ]);
      setApprovedUsers(users);
      setRoles(roleMap);
      setDirectory({ alumni: alumniSnap, brothers: brothersSnap });
    } catch (err) {
      notify(`Could not load network admin data: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!netUser?.email) {
        setChecking(false);
        return;
      }
      try {
        const api = await svc();
        const admin = await api.checkIsAdmin(netUser.email);
        if (cancelled) return;
        setIsAdmin(admin);
        if (admin) await loadAll();
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [netUser, loadAll]);

  const run = async (fn, successMsg) => {
    try {
      await fn();
      await loadAll();
      if (successMsg) notify(successMsg);
    } catch (err) {
      notify(`Save failed: ${err.message || err}`, 'error');
    }
  };

  const tabBtn = (key, name) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        background: 'none',
        border: 'none',
        padding: '12px 22px',
        cursor: 'pointer',
        fontFamily: 'var(--ncr-ui)',
        fontSize: 11.5,
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: tab === key ? 'var(--ncr-ink)' : 'var(--ncr-muted)',
        borderBottom: `2px solid ${tab === key ? 'var(--ncr-crimson)' : 'transparent'}`,
        marginBottom: -1.5,
      }}
    >
      {name}
    </button>
  );

  return (
    <div className="ncr-shell">
      <div className="ncr-hero" style={{ marginBottom: 26 }}>
        <div className="ncr-folio-row">
          <button className="ncr-link-btn" onClick={onBack} style={{ fontSize: 11, letterSpacing: '.2em' }}>
            ← Network
          </button>
          <span className="ncr-folio-line" />
          <span className="ncr-folio-note">Firestore Admins Only · Approvals, Roles &amp; Directory</span>
        </div>
        <h1 className="ncr-display-1" style={{ margin: '14px 0 0' }}>Network Admin</h1>
      </div>

      {checking && (
        <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)' }}>Checking access…</div>
      )}

      {!checking && !netUser?.email && (
        <div className="ncr-card" style={{ maxWidth: 460, padding: '32px 34px' }}>
          <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', lineHeight: 1.55, margin: 0 }}>
            Sign in to The Network with the Google account that has admin access before opening this screen.
          </p>
        </div>
      )}

      {!checking && netUser?.email && !isAdmin && (
        <div className="ncr-card" style={{ maxWidth: 460, borderTop: '4px solid var(--ncr-crimson)', padding: '32px 34px' }}>
          <div className="ncr-label ncr-label--gold" style={{ fontSize: 10.5, letterSpacing: '.22em', marginBottom: 10 }}>
            Not Authorized
          </div>
          <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', lineHeight: 1.55, margin: 0 }}>
            {netUser.email} isn't a Firestore admin for the network. Ask an existing admin to grant access from this
            same screen.
          </p>
        </div>
      )}

      {!checking && isAdmin && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottom: '1.5px solid var(--ncr-ink)', marginBottom: 34, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {tabBtn('approvals', 'Approvals')}
              {tabBtn('roles', 'Roles')}
              {tabBtn('directory', 'Directory')}
            </div>
            {loading && (
              <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ncr-faint)' }}>
                Loading…
              </span>
            )}
          </div>

          {tab === 'approvals' && <NetworkApprovals approvedUsers={approvedUsers} run={run} />}
          {tab === 'roles' && <NetworkRoles approvedUsers={approvedUsers} roles={roles} run={run} />}
          {tab === 'directory' && <NetworkDirectory directory={directory} run={run} />}
        </>
      )}
    </div>
  );
}
