// The Network — native Professional Network: Firebase Google sign-in,
// Firestore alumni directory with filter tabs, mentor requests, personal
// card matched to the roster by email, and photo sync on sign-in.
// Mentorship pairing admin remains in the /portal app (linked below).

import { useMemo, useState } from 'react';
import { SAMPLE_ALUMNI } from './sampleData';

// Firebase is heavy — load it only when the Network is actually used.
const svc = () => import('./networkService');
import { initials, hexA } from './palette';

const IND_COLOR = { Finance: '#3b6fb0', Consulting: '#8a4fb0', Technology: '#0f766e', Accounting: '#9a6040' };
const FILTERS = ['All', 'Mentors', 'Finance', 'Technology', 'Consulting'];

const MENTOR_STEPS = [
  { no: 'I', title: 'Submit Interests', desc: 'Note target industries, companies, and goals for the term.', current: false },
  { no: 'II', title: 'VPAR Review', desc: 'The VP of Alumni Relations pairs you with a fitting alumnus mentor.', current: false },
  { no: 'III', title: 'Shared Workspace', desc: 'Meet for referrals, mock interviews, and resume reviews.', current: true },
];

export default function NetworkScreen({ M, netUser, netAlumni, onSignedIn, onSignedOut, onOpenBrother, notify }) {
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('All');
  const signedIn = !!netUser;

  const meBro = useMemo(() => {
    if (!netUser || !netUser.email) return null;
    return Object.values(M.brothers).find((b) => (b.email || '').toLowerCase() === netUser.email) || null;
  }, [M, netUser]);

  const alumniSource = useMemo(() => {
    if (netAlumni && netAlumni.length) {
      return netAlumni.map((a) => ({
        name: a.name || '—',
        year: String(a.gradYear || a.year || ''),
        company: a.company || '—',
        role: a.role || '',
        industry: a.field || a.industry || 'Other',
        mentor: !!a.mentor,
        linkedin: a.linkedin || '',
        email: (a.email || '').toLowerCase(),
      }));
    }
    return SAMPLE_ALUMNI;
  }, [netAlumni]);

  const alumni = alumniSource.filter((a) =>
    filter === 'All' ? true : filter === 'Mentors' ? a.mentor : a.industry === filter,
  );

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const api = await svc();
      const user = await api.netSignIn();
      let dir = null;
      try {
        dir = await api.loadAlumniDirectory();
      } catch {
        dir = null;
      }
      onSignedIn(user, dir);
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

  const sendMentorRequest = async (a) => {
    try {
      const api = await svc();
      await api.requestMentor({ name: a.name, email: a.email }, netUser || {});
      notify(`Mentor request for ${a.name} sent to the VPAR.`);
    } catch (err) {
      notify(`Could not send the request: ${err.message || err}`, 'error');
    }
  };

  return (
    <div className="ncr-shell">
      <div className="ncr-folio-row">
        <span className="ncr-folio-no">No. 04</span>
        <span className="ncr-folio-line" />
        <span className="ncr-folio-note">Alumni & Active Brothers</span>
      </div>
      <h1 className="ncr-display-1" style={{ margin: '14px 0 28px' }}>The Network</h1>

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
              {netUser.photo ? (
                <img src={netUser.photo} alt="" style={{ width: 44, height: 44, objectFit: 'cover', border: '1px solid var(--ncr-crimson)' }} />
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
              <div className="ncr-label ncr-label--sm" style={{ fontSize: 10, letterSpacing: '.18em', marginBottom: 12 }}>Your Mentor</div>
              <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>—</div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', marginTop: 4 }}>
                Pairings are managed by the VPAR
              </div>
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
              href="/portal/index.html"
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

          {/* Alumni directory */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
            <span className="ncr-label">
              Alumni Directory
              {!netAlumni || !netAlumni.length ? ' · preview data' : ''}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILTERS.map((t) => (
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
            </div>
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
          {alumni.map((a, i) => {
            const indColor = IND_COLOR[a.industry] || '#5c4f3c';
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
                <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink)' }}>
                  {[a.role, a.company].filter(Boolean).join(' · ')}
                </span>
                <span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, color: indColor, background: hexA(indColor, 0.1), padding: '3px 9px' }}>
                    {a.mentor ? `Mentor · ${a.industry}` : a.industry}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    className="ncr-btn-ghost"
                    onClick={() => sendMentorRequest(a)}
                    style={{ padding: '4px 10px', fontSize: 9.5, letterSpacing: '.1em' }}
                  >
                    Request Mentor
                  </button>
                  {a.linkedin && (
                    <a className="ncr-out-link" href={a.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn ↗
                    </a>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
