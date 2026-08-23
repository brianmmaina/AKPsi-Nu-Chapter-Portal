// The Network — native Professional Network: Firebase Google sign-in,
// Firestore alumni directory with filter tabs, mentor requests, personal
// card matched to the roster by email, and photo sync on sign-in.
// Mentorship pairing admin remains in the /portal app (linked below).

import { useMemo, useState, useEffect } from 'react';
import { SAMPLE_ALUMNI } from './sampleData';

// Firebase is heavy — load it only when the Network is actually used.
const svc = () => import('./networkService');
import { initials, hexA } from './palette';

const IND_COLOR = { Finance: '#3b6fb0', Consulting: '#8a4fb0', Technology: '#0f766e', Accounting: '#9a6040' };
const IND_FALLBACK = '#46392a';

// Deployed portal (mentorship workspace, pairings admin, DEI, messages).
const PORTAL_URL = 'https://nu-chapter-connect-portal.web.app';

const MENTOR_STEPS = [
  { no: 'I', title: 'Submit Interests', desc: 'Note target industries, companies, and goals for the term.', current: false },
  { no: 'II', title: 'VPAR Review', desc: 'The VP of Alumni Relations pairs you with a fitting alumnus mentor.', current: false },
  { no: 'III', title: 'Shared Workspace', desc: 'Meet for referrals, mock interviews, and resume reviews.', current: true },
];

export default function NetworkScreen({
  M,
  netUser,
  netAlumni,
  netBrothers,
  netApprovedUser,
  netMyPairing,
  netMyRequests,
  onSignedIn,
  onSignedOut,
  onOpenBrother,
  notify,
}) {
  const [busy, setBusy] = useState(false);
  const [netPhotoBroken, setNetPhotoBroken] = useState(false);
  useEffect(() => setNetPhotoBroken(false), [netUser?.photo]);
  const [filter, setFilter] = useState('All');
  const [dirSource, setDirSource] = useState('All'); // 'All' | 'Alumni' | 'Brothers'
  const [dirQuery, setDirQuery] = useState('');
  const [dirField, setDirField] = useState('All');
  const [dirLocation, setDirLocation] = useState('All');
  const [dirYear, setDirYear] = useState('All');
  const signedIn = !!netUser;
  // Signed in with Google, but no approvedUsers doc — the roster/mentorship
  // reads are gated to approved accounts server-side, so there's nothing to
  // fetch or show beyond this state.
  const pendingApproval = signedIn && !netApprovedUser;

  const meBro = useMemo(() => {
    if (!netUser || !netUser.email) return null;
    return Object.values(M.brothers).find((b) => (b.email || '').toLowerCase() === netUser.email) || null;
  }, [M, netUser]);

  const alumniSource = useMemo(() => {
    const alumniRows = (netAlumni || []).map((a) => ({
      kind: 'alumni',
      name: a.name || '—',
      year: String(a.gradYear || a.year || ''),
      company: a.company || '—',
      role: a.role || '',
      industry: a.field || a.industry || 'Other',
      location: a.location || '',
      mentor: !!a.mentor,
      linkedin: a.linkedin || '',
      email: (a.email || '').toLowerCase(),
    }));
    const brotherRows = (netBrothers || []).map((b) => ({
      kind: 'brother',
      name: b.name || '—',
      year: String(b.gradYear || b.year || ''),
      company: b.company || b.major || '—',
      role: b.role || b.pledgeClass || '',
      industry: b.field || b.industry || b.major || 'Other',
      location: b.location || '',
      mentor: false,
      linkedin: b.linkedin || '',
      email: (b.email || '').toLowerCase(),
    }));
    if (!alumniRows.length && !brotherRows.length) return SAMPLE_ALUMNI.map((a) => ({ kind: 'alumni', ...a }));
    if (dirSource === 'Alumni') return alumniRows;
    if (dirSource === 'Brothers') return brotherRows;
    return [...alumniRows, ...brotherRows];
  }, [netAlumni, netBrothers, dirSource]);

  // Dynamic filter options derived from the loaded directory.
  const dirFields = useMemo(
    () => [...new Set(alumniSource.map((a) => a.industry).filter(Boolean))].sort(),
    [alumniSource],
  );
  const dirLocations = useMemo(
    () => [...new Set(alumniSource.map((a) => a.location).filter(Boolean))].sort(),
    [alumniSource],
  );
  const dirYears = useMemo(
    () => [...new Set(alumniSource.map((a) => a.year).filter(Boolean))].sort((a, b) => b.localeCompare(a)),
    [alumniSource],
  );

  const dq = dirQuery.trim().toLowerCase();
  const alumni = alumniSource.filter((a) => {
    if (filter === 'Mentors' && !a.mentor) return false;
    if (dirField !== 'All' && a.industry !== dirField) return false;
    if (dirLocation !== 'All' && a.location !== dirLocation) return false;
    if (dirYear !== 'All' && a.year !== dirYear) return false;
    if (dq) {
      const hay = `${a.name} ${a.company} ${a.role} ${a.location} ${a.year}`.toLowerCase();
      if (!hay.includes(dq)) return false;
    }
    return true;
  });

  const dirFiltered =
    dq || filter !== 'All' || dirField !== 'All' || dirLocation !== 'All' || dirYear !== 'All';
  const resetDirectory = () => {
    setFilter('All');
    setDirQuery('');
    setDirField('All');
    setDirLocation('All');
    setDirYear('All');
  };

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const api = await svc();
      const user = await api.netSignIn();

      // Approval gates the roster/mentorship reads server-side (Firestore
      // rules) — check it first so an unapproved account gets a designed
      // "pending" state instead of a raw permission error from the reads
      // below.
      const logAndNull = (label) => (err) => {
        console.error(`Network: ${label} failed —`, err);
        return null;
      };

      const approvedUser = await api.loadApprovedUser(user.email).catch(logAndNull('loadApprovedUser'));

      if (!approvedUser) {
        onSignedIn(user, {});
        notify(`Signed in as ${user.name || user.email}. Waiting on officer approval.`);
        return;
      }

      const [alumniDir, brotherDir, pairing, myRequests] = await Promise.all([
        api.loadAlumniDirectory().catch(logAndNull('loadAlumniDirectory')),
        api.loadBrotherDirectory().catch(logAndNull('loadBrotherDirectory')),
        api.loadMyPairing(user.email).catch(logAndNull('loadMyPairing')),
        api.loadMyRequests(user.email).catch(logAndNull('loadMyRequests')),
      ]);

      onSignedIn(user, { alumniDir, brotherDir, approvedUser, pairing, myRequests });
      notify(`Signed in as ${user.name || user.email}.`);
    } catch (err) {
      notify(`Google sign-in failed: ${err.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      const api = await svc();
      await api.netSignOut();
    } catch {
      /* already signed out */
    }
    onSignedOut();
  };

  // Matches the portal's canRequestMentorshipType: brothers may request a
  // mentor from an alumni row, alumni may offer to mentor a brother row.
  const myRole = (netApprovedUser?.role || '').toLowerCase();
  const isAdminRole = !!netApprovedUser?.role && netApprovedUser.role.toLowerCase() === 'admin';
  const requestTypeFor = (row) => {
    if (row.kind === 'alumni') return 'mentor';
    if (row.kind === 'brother') return 'mentee';
    return null;
  };
  const canRequest = (row) => {
    const type = requestTypeFor(row);
    if (!type) return false;
    if (isAdminRole) return true;
    if (type === 'mentor') return myRole === 'brother';
    if (type === 'mentee') return myRole === 'alumni';
    return false;
  };
  const alreadyRequested = (row) =>
    (netMyRequests || []).some((r) => (r.email || '').toLowerCase() === row.email && r.status !== 'declined');

  const sendMentorRequest = async (row) => {
    const type = requestTypeFor(row);
    if (!type) return;
    try {
      const api = await svc();
      await api.submitMentorshipRequest({
        type,
        targetName: row.name,
        targetEmail: row.email,
        requester: netUser || {},
      });
      notify(type === 'mentor' ? `Mentor request for ${row.name} sent to the VPAR.` : `Offer to mentor ${row.name} sent to the VPAR.`);
    } catch (err) {
      notify(`Could not send the request: ${err.message || err}`, 'error');
    }
  };

  return (
    <div className="ncr-shell">
      <div className="ncr-hero" style={{ marginBottom: 28 }}>
        <div className="ncr-folio-row">
          <span className="ncr-folio-no">No. 04</span>
          <span className="ncr-folio-line" />
          <span className="ncr-folio-note">Alumni & Active Brothers</span>
        </div>
        <h1 className="ncr-display-1" style={{ margin: '14px 0 0' }}>The Network</h1>
      </div>

      {!signedIn && (
        <div className="ncr-card" style={{ maxWidth: 440, margin: '30px auto 60px', textAlign: 'center', padding: '44px 40px' }}>
          <img src="/akpsi-seal.png" alt="" style={{ width: 62, height: 62, objectFit: 'contain', opacity: 0.85, marginBottom: 20 }} />
          <div style={{ fontFamily: 'var(--ncr-display)', fontSize: 26, color: 'var(--ncr-ink)', marginBottom: 10 }}>Sign in to the Network</div>
          <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', lineHeight: 1.55, margin: '0 0 26px' }}>
            Use your Boston University Google account to view the alumni directory and your personal mentorship dashboard.
          </p>
          <button
            onClick={signIn}
            disabled={busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: '#fff',
              border: '1px solid rgba(43,35,24,.5)',
              padding: '13px 22px',
              cursor: 'pointer',
              fontFamily: 'var(--ncr-ui)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ncr-ink)',
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'conic-gradient(#4285F4 0 25%, #EA4335 25% 50%, #FBBC05 50% 75%, #34A853 75% 100%)',
                display: 'inline-block',
              }}
            />
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>
        </div>
      )}

      {signedIn && (
        <div>
          {/* Signed-in banner */}
          <div
            className="ncr-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              borderLeft: '5px solid var(--ncr-crimson)',
              padding: '16px 20px',
              marginBottom: 30,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {netUser.photo && !netPhotoBroken ? (
                <img
                  src={netUser.photo}
                  alt=""
                  onError={() => setNetPhotoBroken(true)}
                  style={{ width: 44, height: 44, objectFit: 'cover', border: '1px solid var(--ncr-crimson)' }}
                />
              ) : (
                <span
                  style={{
                    width: 44,
                    height: 44,
                    border: '1px solid var(--ncr-crimson)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--ncr-serif)',
                    fontSize: 16,
                    color: 'var(--ncr-crimson)',
                  }}
                >
                  {initials(netUser.name || netUser.email)}
                </span>
              )}
              <div>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>
                  Signed in as {netUser.name || netUser.email}
                </div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, letterSpacing: '.06em', color: 'var(--ncr-muted)' }}>
                  {meBro ? `${meBro.role} · ${meBro.family} Family · ` : ''}{netUser.email}
                </div>
              </div>
            </div>
            <button className="ncr-btn-ghost" onClick={signOut} style={{ padding: '8px 16px', fontSize: 10.5 }}>Sign out</button>
          </div>

          {pendingApproval && (
            <div className="ncr-card" style={{ maxWidth: 520, margin: '0 auto 60px', textAlign: 'center', padding: '36px 32px' }}>
              <div style={{ fontFamily: 'var(--ncr-display)', fontSize: 22, color: 'var(--ncr-ink)', marginBottom: 10 }}>
                Waiting on approval
              </div>
              <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', lineHeight: 1.55, margin: 0 }}>
                Your Google account isn't approved for the directory or mentorship program yet. Ask an officer (VPAR)
                to approve <strong>{netUser.email}</strong>, then sign in again.
              </p>
            </div>
          )}

          {!pendingApproval && (
          <>
          {/* Personal cards */}
          <div className="ncr-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 42 }}>
            <div className="ncr-card" style={{ borderTop: '3px solid #9a7327', padding: 20 }}>
              <div className="ncr-label ncr-label--sm" style={{ fontSize: 10, letterSpacing: '.18em', marginBottom: 12 }}>Your Profile</div>
              {meBro ? (
                <>
                  <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 17, color: 'var(--ncr-ink)', lineHeight: 1.7 }}>
                    {meBro.major}
                    <br />
                    Class of {meBro.gradYear}
                    <br />
                    {meBro.pledgeClass}
                  </div>
                  <button
                    onClick={() => onOpenBrother(meBro.id)}
                    style={{ marginTop: 14, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ncr-crimson)' }}
                  >
                    View full record →
                  </button>
                </>
              ) : (
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-muted)', lineHeight: 1.6 }}>
                  Your Google email isn't matched to a roster record yet. Ask an officer to add your email to your record.
                </div>
              )}
            </div>
            <div className="ncr-card" style={{ borderTop: '3px solid #5f6f86', padding: 20 }}>
              <div className="ncr-label ncr-label--sm" style={{ fontSize: 10, letterSpacing: '.18em', marginBottom: 12 }}>
                {netMyPairing && netMyPairing.alumniEmail === netUser.email ? 'Your Mentees' : 'Your Mentor'}
              </div>
              {netMyPairing ? (
                netMyPairing.alumniEmail === netUser.email ? (
                  (netMyPairing.brothers || []).map((b) => (
                    <div key={b.email} style={{ marginBottom: 8 }}>
                      <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 17, fontWeight: 700, color: 'var(--ncr-ink)' }}>{b.name}</div>
                      <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-ink-mid)' }}>
                        {b.completedCheckIns || 0} of {b.totalCheckIns || 0} check-ins
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>
                      {netMyPairing.alumniName}
                    </div>
                    <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', marginTop: 4 }}>
                      {[netMyPairing.alumniRole, netMyPairing.alumniCompany].filter(Boolean).join(' · ')}
                    </div>
                  </>
                )
              ) : (netMyRequests || []).some((r) => r.status !== 'declined') ? (
                <>
                  <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>Request pending</div>
                  <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', marginTop: 4 }}>
                    The VPAR reviews requests before confirming a pairing.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>—</div>
                  <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', marginTop: 4 }}>
                    Pairings are managed by the VPAR
                  </div>
                </>
              )}
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ncr-green)', marginTop: 12 }}>
                ● Shared workspace in the portal
              </div>
            </div>
            <div className="ncr-card" style={{ borderTop: '3px solid #6b6f3a', padding: 20 }}>
              <div className="ncr-label ncr-label--sm" style={{ fontSize: 10, letterSpacing: '.18em', marginBottom: 12 }}>Request a Mentor</div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', lineHeight: 1.6 }}>
                Find an alumnus below and send a mentor request — the VPAR reviews each one and confirms the pairing.
              </div>
            </div>
          </div>

          {/* Mentorship process */}
          <div className="ncr-label" style={{ marginBottom: 16 }}>Mentorship Process</div>
          <div
            className="ncr-grid-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: '1.5px solid var(--ncr-ink)',
              borderBottom: '1px solid var(--ncr-rule-soft)',
              marginBottom: 44,
            }}
          >
            {MENTOR_STEPS.map((st) => (
              <div
                key={st.no}
                style={{
                  padding: 20,
                  borderRight: '1px solid rgba(43,35,24,.14)',
                  background: st.current ? 'rgba(111,43,38,.08)' : 'rgba(43,35,24,.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--ncr-display)', fontSize: 26, color: st.current ? 'var(--ncr-crimson)' : 'var(--ncr-muted)' }}>{st.no}</span>
                  <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 17, fontWeight: 700, color: 'var(--ncr-ink)' }}>{st.title}</span>
                </div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', lineHeight: 1.5, marginTop: 8 }}>{st.desc}</div>
                {st.current && (
                  <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ncr-crimson)', marginTop: 10 }}>
                    ● Your current step
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Portal link (mentorship admin / DEI / articles remain there) */}
          <div
            className="ncr-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
              borderLeft: '5px solid #5f6f86',
              padding: '18px 22px',
              marginBottom: 42,
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 19, fontWeight: 700, color: 'var(--ncr-ink)' }}>Professional Network Portal</div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', marginTop: 4, maxWidth: 560, lineHeight: 1.5 }}>
                The full alumni & active-brother portal — mentorship workspace, pairings, DEI posts, and chapter articles.
              </div>
            </div>
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                whiteSpace: 'nowrap',
                background: 'var(--ncr-ink)',
                color: 'var(--ncr-paper-text)',
                padding: '11px 20px',
                fontFamily: 'var(--ncr-ui)',
                fontSize: 10.5,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Open Portal ↗
            </a>
          </div>

          {/* Directory */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
            <span className="ncr-label">
              Directory
              {!(netAlumni || []).length && !(netBrothers || []).length ? ' · preview data' : ''}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['All', 'Alumni', 'Brothers'].map((t) => (
                <button
                  key={t}
                  onClick={() => setDirSource(t)}
                  style={{
                    background: t === dirSource ? 'var(--ncr-ink)' : 'transparent',
                    color: t === dirSource ? 'var(--ncr-paper-text)' : 'var(--ncr-ink)',
                    border: '1px solid rgba(43,35,24,.5)',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontFamily: 'var(--ncr-ui)',
                    fontSize: 10.5,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t}
                </button>
              ))}
              <span style={{ width: 1, height: 18, background: 'var(--ncr-rule)' }} />
              {['All', 'Mentors'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{
                    background: t === filter ? 'var(--ncr-ink)' : 'transparent',
                    color: t === filter ? 'var(--ncr-paper-text)' : 'var(--ncr-ink)',
                    border: '1px solid rgba(43,35,24,.5)',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontFamily: 'var(--ncr-ui)',
                    fontSize: 10.5,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t}
                </button>
              ))}
              <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>
                {alumni.length} of {alumniSource.length} {alumniSource.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          </div>

          {/* Search + dynamic filters (company / role / field / location / class year) */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <input
              value={dirQuery}
              onChange={(e) => setDirQuery(e.target.value)}
              placeholder="Search name, company, role, location…"
              aria-label="Search alumni"
              style={{
                flex: '1 1 260px',
                minWidth: 220,
                boxSizing: 'border-box',
                height: 38,
                padding: '0 14px',
                background: '#f2ebdb',
                border: '1px solid var(--ncr-rule)',
                borderRadius: 0,
                fontFamily: 'var(--ncr-ui)',
                fontSize: 13,
                color: 'var(--ncr-ink)',
                outline: 'none',
              }}
            />
            <select
              className="ncr-select"
              value={dirField}
              onChange={(e) => setDirField(e.target.value)}
              aria-label="Filter by field"
              style={{ width: 'auto', height: 38, fontSize: 12.5 }}
            >
              <option value="All">All Fields</option>
              {dirFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            {dirLocations.length > 0 && (
              <select
                className="ncr-select"
                value={dirLocation}
                onChange={(e) => setDirLocation(e.target.value)}
                aria-label="Filter by location"
                style={{ width: 'auto', height: 38, fontSize: 12.5 }}
              >
                <option value="All">All Locations</option>
                {dirLocations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            )}
            {dirYears.length > 0 && (
              <select
                className="ncr-select"
                value={dirYear}
                onChange={(e) => setDirYear(e.target.value)}
                aria-label="Filter by class year"
                style={{ width: 'auto', height: 38, fontSize: 12.5 }}
              >
                <option value="All">All Years</option>
                {dirYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
            {dirFiltered && (
              <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={resetDirectory} style={{ height: 38, padding: '0 14px' }}>
                Reset
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '38px 1.4fr 1.6fr 1fr auto',
              padding: '0 4px 9px',
              borderBottom: '1.5px solid var(--ncr-ink)',
              fontFamily: 'var(--ncr-ui)',
              fontSize: 10,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--ncr-muted)',
              gap: 16,
            }}
          >
            <span />
            <span>Brother</span>
            <span>Company</span>
            <span>Industry</span>
            <span style={{ textAlign: 'right' }}>Link</span>
          </div>
          {alumni.length === 0 && (
            <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', padding: '16px 4px' }}>
              No alumni match these filters.
            </div>
          )}
          {alumni.map((a, i) => {
            const indColor = IND_COLOR[a.industry] || IND_FALLBACK;
            return (
              <div
                key={`${a.name}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '38px 1.4fr 1.6fr 1fr auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '13px 4px',
                  borderBottom: '1px solid var(--ncr-rule-faint)',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    border: '1px solid var(--ncr-rule)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--ncr-serif)',
                    fontSize: 11,
                    color: 'var(--ncr-ink-mid)',
                  }}
                >
                  {initials(a.name)}
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: 'var(--ncr-serif)', fontSize: 16, color: 'var(--ncr-ink)' }}>{a.name}</span>
                  <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>
                    {a.year ? `Class of ${a.year}` : 'Alumnus'}
                  </span>
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink)' }}>
                    {[a.role, a.company].filter(Boolean).join(' · ')}
                  </span>
                  {a.location && (
                    <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)', marginTop: 2 }}>
                      {a.location}
                    </span>
                  )}
                </span>
                <span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, color: indColor, background: hexA(indColor, 0.1), padding: '3px 9px' }}>
                    {a.mentor ? `Mentor · ${a.industry}` : a.industry}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {canRequest(a) && (
                    alreadyRequested(a) ? (
                      <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ncr-muted)' }}>
                        Pending
                      </span>
                    ) : (
                      <button
                        className="ncr-btn-ghost"
                        onClick={() => sendMentorRequest(a)}
                        style={{ padding: '4px 10px', fontSize: 9.5, letterSpacing: '.1em' }}
                      >
                        {a.kind === 'alumni' ? 'Request Mentor' : 'Offer to Mentor'}
                      </button>
                    )
                  )}
                  {a.linkedin && (
                    <a className="ncr-out-link" href={a.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn ↗
                    </a>
                  )}
                </span>
              </div>
            );
          })}
          </>
          )}
        </div>
      )}
    </div>
  );
}
