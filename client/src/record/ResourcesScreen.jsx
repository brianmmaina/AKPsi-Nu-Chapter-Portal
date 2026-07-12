// Resources & Records — live Google Drive embed, plus announcements,
// newsletters, and deadlines published from the admin Hub Posts tab.

import { useState, useEffect } from 'react';
import { posts as postsApi } from '../api';

const DRIVE_FOLDER = '1_FMR0XyMjn7TzCZ_PZA-b2GdMfIFGCPY';

const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ResourcesScreen() {
  const [hubPosts, setHubPosts] = useState(null);

  useEffect(() => {
    let alive = true;
    postsApi
      .getActive()
      .then((res) => {
        if (alive) setHubPosts(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (alive) setHubPosts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const byType = (t) => (hubPosts || []).filter((p) => p.type === t);
  const announcements = byType('announcement');
  const newsletters = byType('newsletter');
  const deadlines = byType('deadline');
  const latestNewsletter = newsletters[0];

  const resourceCards = [
    {
      title: 'Academic Resources',
      desc: 'Study guides, course archives, and shared coursework in the chapter Drive.',
      status: 'Open in Drive →',
      statusColor: 'var(--ncr-crimson)',
      color: '#6f2b26',
      href: `https://drive.google.com/drive/folders/${DRIVE_FOLDER}?usp=drive_link`,
    },
    {
      title: 'Chapter Newsletter',
      desc: 'The latest dispatch from the Nu Chapter Secretariat.',
      status: latestNewsletter ? fmtDate(latestNewsletter.posted_at) : 'None Posted',
      statusColor: latestNewsletter ? 'var(--ncr-gold)' : 'var(--ncr-faint)',
      color: '#9a7327',
      href: latestNewsletter?.link_url || undefined,
    },
    {
      title: 'Updates & Deadlines',
      desc: 'Active requirements, dues windows, and submission dates.',
      status: deadlines.length ? `${deadlines.length} Active` : 'No Active Items',
      statusColor: deadlines.length ? 'var(--ncr-green)' : 'var(--ncr-faint)',
      color: '#6b6f3a',
    },
    {
      title: 'Forms & Submissions',
      desc: 'Point correction requests, excuse forms, and reimbursements.',
      status: 'Via Brother Records',
      statusColor: 'var(--ncr-ink-mid)',
      color: '#5f6f86',
    },
  ];

  return (
    <div className="ncr-shell">
      <div className="ncr-hero" style={{ marginBottom: 30 }}>
        <div className="ncr-folio-row">
          <span className="ncr-folio-no">No. 03</span>
          <span className="ncr-folio-line" />
          <span className="ncr-folio-note">Working Papers</span>
        </div>
        <h1 className="ncr-display-1" style={{ margin: '14px 0 0' }}>Resources & Records</h1>
      </div>

      {announcements.length > 0 && (
        <div style={{ marginBottom: 42 }}>
          <div className="ncr-label" style={{ color: 'var(--ncr-crimson)', marginBottom: 14 }}>
            Chapter Announcements
          </div>
          <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
            {announcements.map((p) => (
              <div key={p.id} className="ncr-band" style={{ padding: '16px 18px', borderBottom: '1px solid var(--ncr-rule-faint)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>{p.title}</span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(p.posted_at)}
                  </span>
                </div>
                {p.body && (
                  <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', marginTop: 6, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {p.body}
                  </div>
                )}
                {p.link_url && (
                  <a className="ncr-out-link" href={p.link_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8 }}>
                    Open Link ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 42 }}>
        {resourceCards.map((r) => {
          const inner = (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 21, fontWeight: 700, color: 'var(--ncr-ink)' }}>{r.title}</div>
                <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: r.statusColor, whiteSpace: 'nowrap' }}>
                  {r.status}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', marginTop: 7, lineHeight: 1.5 }}>{r.desc}</div>
            </>
          );
          const style = { display: 'block', background: 'var(--ncr-card-raised)', border: '1px solid var(--ncr-rule)', borderLeft: `5px solid ${r.color}`, padding: '22px 24px', textDecoration: 'none' };
          return r.href ? (
            <a key={r.title} href={r.href} target="_blank" rel="noopener noreferrer" className="ncr-lift" style={style}>
              {inner}
            </a>
          ) : (
            <div key={r.title} style={style}>{inner}</div>
          );
        })}
      </div>

      <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 42 }}>
        <div className="ncr-card" style={{ borderTop: '3px solid var(--ncr-crimson)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, padding: '16px 20px 12px' }}>
            <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 20, fontWeight: 700, color: 'var(--ncr-ink)' }}>Academic Resources</div>
            <a
              className="ncr-out-link"
              href={`https://drive.google.com/drive/folders/${DRIVE_FOLDER}?usp=drive_link`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ whiteSpace: 'nowrap', fontSize: 10.5 }}
            >
              Open in Drive ↗
            </a>
          </div>
          <iframe
            src={`https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER}#grid`}
            title="Academic Resources — Google Drive"
            style={{ width: '100%', height: 360, border: 'none', borderTop: '1px solid var(--ncr-rule-soft)', background: '#fff', display: 'block' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="ncr-card" style={{ borderTop: '3px solid #9a7327', padding: 20 }}>
            <div className="ncr-label ncr-label--sm" style={{ fontSize: 10, letterSpacing: '.18em', marginBottom: 10 }}>Newsletter</div>
            {latestNewsletter ? (
              <>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, color: 'var(--ncr-ink)', marginBottom: 6 }}>{latestNewsletter.title}</div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-muted)', marginBottom: 8 }}>
                  Posted {fmtDate(latestNewsletter.posted_at)}
                </div>
                {latestNewsletter.body && (
                  <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', lineHeight: 1.5, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                    {latestNewsletter.body}
                  </div>
                )}
                {latestNewsletter.link_url && (
                  <a className="ncr-out-link" href={latestNewsletter.link_url} target="_blank" rel="noopener noreferrer">
                    Read the Newsletter ↗
                  </a>
                )}
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, color: 'var(--ncr-ink)', marginBottom: 6 }}>No newsletter posted yet</div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-muted)', lineHeight: 1.5 }}>
                  The latest chapter newsletter will appear here when available.
                </div>
              </>
            )}
          </div>
          <div className="ncr-card" style={{ borderTop: '3px solid #6b6f3a', padding: 20 }}>
            <div className="ncr-label ncr-label--sm" style={{ fontSize: 10, letterSpacing: '.18em', marginBottom: 10 }}>Updates & Deadlines</div>
            {deadlines.length ? (
              <div>
                {deadlines.map((p) => (
                  <div key={p.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--ncr-rule-faint)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, color: 'var(--ncr-ink)' }}>{p.title}</span>
                      {p.expires_at && (
                        <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-crimson)', whiteSpace: 'nowrap' }}>
                          Due {fmtDate(p.expires_at)}
                        </span>
                      )}
                    </div>
                    {p.body && (
                      <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12.5, color: 'var(--ncr-ink-mid)', marginTop: 3, lineHeight: 1.5 }}>{p.body}</div>
                    )}
                    {p.link_url && (
                      <a className="ncr-out-link" href={p.link_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10.5 }}>
                        Open ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, color: 'var(--ncr-ink)', marginBottom: 6 }}>No active deadlines yet</div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-muted)', lineHeight: 1.5 }}>
                  New reminders and requirements will appear here when posted.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
