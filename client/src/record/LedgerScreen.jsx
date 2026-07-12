// Life Points Ledger — snapshot, podium, leaderboard, Family Cup,
// streak leaders, checkpoint progress, and the rules ledger.
// Rules content derives from pointSystemConfig (single source of truth).

import { useMemo } from 'react';
import { pointSystemConfig } from '../config/pointSystemConfig';
import { STREAK_META, STREAK_TIER_LIST } from './palette';

const CATEGORY_ORDER = [
  'PROFESSIONAL',
  'DEI',
  'RECRUITMENT',
  'SOCIAL',
  'RITUAL',
  'CHAPTER',
  'COMMITTEE',
  'COMPETITION',
  'SERVICE',
  'OTHER',
];

const AUTO_KEYS = new Set(['pledge_meeting_attendance', 'pledge_meeting_participation']);

const sectionLabel = { fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--ncr-ink-mid)' };
const serif = (extra) => ({ fontFamily: 'var(--ncr-serif)', color: 'var(--ncr-ink)', ...extra });

export default function LedgerScreen({
  M,
  term,
  pointsSource,
  lastSynced,
  timeframe,
  onTimeframe,
  onRefresh,
  onOpenBrother,
  onOpenAdmin,
  tfLabel,
}) {
  const brothersAll = useMemo(() => Object.values(M.brothers), [M]);
  const sortedAll = useMemo(
    () => brothersAll.slice().sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
    [brothersAll],
  );
  const memberCount = brothersAll.length;

  const streakText = (b) =>
    b.streak > 0 ? `${b.streak}-event${b.streakKey === 'goat' ? ' · G.O.A.T' : ''}` : '—';

  // Podium
  const podiumMeta = [
    { label: 'Current Leader', accent: '#9a7327', rankLabel: '1st', rankSize: 44, pad: 24 },
    { label: 'Second Place', accent: '#7a8a98', rankLabel: '2nd', rankSize: 36, pad: 18 },
    { label: 'Third Place', accent: '#9a6040', rankLabel: '3rd', rankSize: 36, pad: 18 },
  ];
  const podium = sortedAll.slice(0, 3);

  // Family Cup (avg points / member)
  const cup = useMemo(() => {
    const rows = M.famOrder.map((fid) => {
      const list = M.byFamily[fid] || [];
      const total = list.reduce((sum, id) => sum + (M.brothers[id] ? M.brothers[id].points : 0), 0);
      return {
        fid,
        name: M.FAM[fid].name,
        accent: M.FAM[fid].accent,
        total,
        avg: list.length ? +(total / list.length).toFixed(1) : 0,
      };
    });
    return rows.sort((a, b) => b.avg - a.avg);
  }, [M]);
  const maxAvg = (cup[0] && cup[0].avg) || 1;

  const streakLeaders = brothersAll
    .filter((b) => b.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  const topMember = sortedAll[0] || { name: '—', points: 0 };
  const cupLeader = cup[0] || { name: '—', avg: 0 };
  const longest = brothersAll.reduce((m, b) => Math.max(m, b.streak), 0);
  const snapshot = [
    { label: 'Active Brothers', value: String(memberCount), accent: '#5f6f86' },
    { label: 'Current Leader', value: topMember.name, sub: `${topMember.points} pts`, accent: '#9a7327' },
    { label: 'Family Cup Leader', value: cupLeader.name, sub: `${Number(cupLeader.avg).toFixed(1)} avg / member`, accent: '#7a3b2e' },
    { label: 'Longest Streak', value: `${longest} events`, accent: '#b5651d' },
    { label: 'Current Term', value: term, accent: '#6b6f3a' },
  ];

  const checkpoints = pointSystemConfig.checkpoints.map((cp) => ({
    label: cp.label,
    min: cp.minimumPoints,
    desc: cp.description || '',
    pct: memberCount
      ? Math.round((brothersAll.filter((b) => b.points >= cp.minimumPoints).length / memberCount) * 100)
      : 0,
  }));

  // Rules ledger from config
  const pointEvents = useMemo(() => {
    const rows = pointSystemConfig.pointEvents.map((e) => {
      const pts = e.variants
        ? `${Math.min(...e.variants.map((v) => v.points))}–${Math.max(...e.variants.map((v) => v.points))}`
        : String(e.points ?? 0);
      const note = [e.notes, e.maxPerCheckpoint ? `Max ${e.maxPerCheckpoint} pts / checkpoint` : null]
        .filter(Boolean)
        .join(' · ');
      const auto = AUTO_KEYS.has(e.key);
      return {
        key: e.key,
        name: e.name,
        unit: e.perUnit,
        cat: e.category,
        pts,
        note,
        auto,
        sortPts: e.variants ? Math.max(...e.variants.map((v) => v.points)) : e.points ?? 0,
      };
    });
    return rows.sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat) ||
        b.sortPts - a.sortPts ||
        a.name.localeCompare(b.name),
    );
  }, []);

  const syncLabelTime = lastSynced
    ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const syncLabel =
    pointsSource === 'sheets'
      ? `Synced · Google Sheets · ${syncLabelTime}`
      : pointsSource === 'supabase'
        ? `Synced · Points DB · ${syncLabelTime}`
        : 'Sample points · sources offline';
  const syncDotColor = pointsSource === 'local' ? 'var(--ncr-warn)' : 'var(--ncr-green)';

  const tfBtn = (key, label) => (
    <button
      onClick={() => onTimeframe(key)}
      style={{
        background: timeframe === key ? 'var(--ncr-ink)' : 'transparent',
        color: timeframe === key ? 'var(--ncr-paper-text)' : 'var(--ncr-ink)',
        border: 'none',
        borderLeft: key === 'YEAR' ? '1px solid var(--ncr-ink)' : 'none',
        padding: '9px 15px',
        cursor: 'pointer',
        fontFamily: 'var(--ncr-ui)',
        fontSize: 10,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="ncr-shell">
      <div className="ncr-hero" style={{ marginBottom: 26 }}>
      <div className="ncr-folio-row">
        <span className="ncr-folio-no">No. 01</span>
        <span className="ncr-folio-line" />
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'var(--ncr-ui)',
            fontSize: 11,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--ncr-green)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: syncDotColor }} />
          {syncLabel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginTop: 14 }}>
        <div>
          <h1 className="ncr-display-1">Life Points Ledger</h1>
          <div className="ncr-italic" style={{ fontSize: 15, color: 'var(--ncr-muted)', marginTop: 8 }}>
            Official live record · {tfLabel}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid var(--ncr-ink)' }}>
            {tfBtn('SEMESTER', 'Semester')}
            {tfBtn('YEAR', 'Year')}
          </div>
          <button className="ncr-btn-ghost" onClick={onRefresh}>↻ Refresh</button>
          <button
            className="ncr-btn ncr-btn--crimson"
            onClick={onOpenAdmin}
            style={{ height: 'auto', padding: '10px 16px', fontSize: 10, letterSpacing: '.16em' }}
          >
            Officer Tools
          </button>
        </div>
      </div>
      </div>

      {/* Snapshot */}
      <div className="ncr-snapshot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 38 }}>
        {snapshot.map((c) => (
          <div key={c.label} className="ncr-card" style={{ borderTop: `3px solid ${c.accent}`, padding: '16px 16px 18px' }}>
            <div className="ncr-label" style={{ fontSize: 9.5, letterSpacing: '.16em', marginBottom: 10 }}>{c.label}</div>
            <div style={{ fontFamily: 'var(--ncr-display)', fontSize: 26, lineHeight: 1.05, color: 'var(--ncr-ink)' }}>{c.value}</div>
            {c.sub && <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, color: c.accent, marginTop: 5 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Podium */}
      <div style={{ ...sectionLabel, marginBottom: 14 }}>The Podium</div>
      <div className="ncr-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 42, alignItems: 'end' }}>
        {podium.map((b, i) => {
          const meta = podiumMeta[i];
          const sk = b.streakKey ? STREAK_META[b.streakKey] : null;
          return (
            <button
              key={b.id}
              className="ncr-card ncr-lift"
              onClick={() => onOpenBrother(b.id)}
              style={{ textAlign: 'center', borderTop: `4px solid ${meta.accent}`, padding: `${meta.pad}px 18px 22px`, cursor: 'pointer' }}
            >
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 9.5, letterSpacing: '.2em', textTransform: 'uppercase', color: meta.accent }}>
                {meta.label}
              </div>
              <div style={{ fontFamily: 'var(--ncr-display)', fontSize: meta.rankSize, lineHeight: 1, color: meta.accent, margin: '8px 0' }}>
                {meta.rankLabel}
              </div>
              <div style={serif({ fontSize: 20, fontWeight: 700 })}>{b.name}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-ink-mid)', marginTop: 4 }}>
                <span style={{ width: 9, height: 9, background: b.accent }} />
                {b.family}
              </div>
              <div style={{ borderTop: '1px solid rgba(43,35,24,.2)', margin: '14px 0 10px' }} />
              <div className="ncr-fig" style={{ fontFamily: 'var(--ncr-display)', fontSize: 34, color: 'var(--ncr-ink)' }}>
                {b.points}
                <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-muted)', letterSpacing: '.1em' }}> PTS</span>
              </div>
              {b.streak > 0 && (
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: sk ? sk.color : 'var(--ncr-muted)', marginTop: 8, letterSpacing: '.06em' }}>
                  {streakText(b)} streak
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 48, alignItems: 'start' }}>
        {/* Leaderboard */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
            <span style={sectionLabel}>Chapter Leaderboard</span>
            <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>
              <span style={serif({ fontSize: 12 })}>{memberCount}</span> brothers
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 120px 64px 76px',
              padding: '0 4px 9px',
              borderBottom: '1.5px solid var(--ncr-ink)',
              fontFamily: 'var(--ncr-ui)',
              fontSize: 10,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--ncr-muted)',
            }}
          >
            <span>Rank</span>
            <span>Brother</span>
            <span>Family</span>
            <span style={{ textAlign: 'center' }}>Streak</span>
            <span style={{ textAlign: 'right' }}>Points</span>
          </div>
          {sortedAll.slice(0, 14).map((b, i) => (
            <button
              key={b.id}
              className="ncr-row-btn"
              onClick={() => onOpenBrother(b.id)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '48px 1fr 120px 64px 76px',
                alignItems: 'center',
                padding: '13px 4px',
                borderBottom: '1px solid var(--ncr-rule-faint)',
                background: i < 3 ? 'rgba(154,115,39,.05)' : 'transparent',
              }}
            >
              <span
                className="ncr-fig"
                style={{ fontFamily: 'var(--ncr-display)', fontSize: 20, color: i < 3 ? ['#9a7327', '#7a8a98', '#9a6040'][i] : 'var(--ncr-muted)' }}
              >
                #{i + 1}
              </span>
              <span style={serif({ fontSize: 17 })}>{b.name}</span>
              <span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    fontFamily: 'var(--ncr-ui)',
                    fontSize: 11.5,
                    color: b.accent,
                    background: b.soft,
                    border: `1px solid ${b.softBorder}`,
                    padding: '3px 9px',
                  }}
                >
                  {b.family}
                </span>
              </span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-ink-mid)' }}>{streakText(b)}</span>
              <span className="ncr-tab-fig" style={serif({ fontSize: 19, fontWeight: 700, textAlign: 'right' })}>{b.points}</span>
            </button>
          ))}
          <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', padding: '14px 4px 0' }}>
            Select any brother to open their record and full event log.
          </div>
        </div>

        {/* Side column */}
        <div>
          <div style={{ ...sectionLabel, marginBottom: 6 }}>Family Cup</div>
          <div className="ncr-italic" style={{ fontSize: 12.5, color: 'var(--ncr-muted)', marginBottom: 14 }}>
            Ranked by avg points / member.
          </div>
          {cup.map((f, i) => (
            <div key={f.fid} style={{ borderLeft: `4px solid ${f.accent}`, padding: '9px 0 9px 12px', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={serif({ fontSize: 16 })}>
                  <span style={{ color: 'var(--ncr-muted)', fontSize: 13 }}>#{i + 1}</span> {f.name}
                </span>
                <span className="ncr-tab-fig" style={serif({ fontSize: 16, fontWeight: 700 })}>
                  {f.avg.toFixed(1)}
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, color: 'var(--ncr-muted)', letterSpacing: '.08em' }}> AVG</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(43,35,24,.1)', marginTop: 7 }}>
                <div style={{ height: '100%', width: `${Math.round((f.avg / maxAvg) * 100)}%`, background: f.accent }} />
              </div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10.5, color: 'var(--ncr-muted)', marginTop: 5 }}>{f.total} total pts</div>
            </div>
          ))}

          <div style={{ ...sectionLabel, margin: '30px 0 14px' }}>Streak Leaders</div>
          <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
            {streakLeaders.length === 0 && (
              <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', padding: '12px 2px' }}>
                No active streaks yet this term.
              </div>
            )}
            {streakLeaders.map((b, i) => {
              const sk = b.streakKey ? STREAK_META[b.streakKey] : null;
              const color = sk ? sk.color : 'var(--ncr-muted)';
              return (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 2px', borderBottom: '1px solid rgba(43,35,24,.12)' }}>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-muted)', width: 22 }}>#{i + 1}</span>
                  <span style={{ flex: 1, ...serif({ fontSize: 15 }) }}>{b.name}</span>
                  <span
                    style={{
                      fontFamily: 'var(--ncr-ui)',
                      fontSize: 10,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color,
                      border: `1px solid ${color}`,
                      padding: '3px 8px',
                    }}
                  >
                    {sk ? `${sk.badge} ×${b.streak}` : `×${b.streak}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ ...sectionLabel, margin: '30px 0 14px' }}>Checkpoints</div>
          {checkpoints.map((cp) => (
            <div key={cp.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={serif({ fontSize: 15 })}>{cp.label}</span>
                <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>{cp.min} pts</span>
              </div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, color: 'var(--ncr-muted)', margin: '3px 0 7px', lineHeight: 1.4 }}>{cp.desc}</div>
              <div style={{ height: 6, background: 'rgba(43,35,24,.1)' }}>
                <div style={{ height: '100%', width: `${cp.pct}%`, background: 'var(--ncr-crimson)' }} />
              </div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10.5, color: 'var(--ncr-muted)', marginTop: 5 }}>
                {cp.pct}% of brothers have met it
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules ledger */}
      <div style={{ marginTop: 48, borderTop: '3px double var(--ncr-ink)', paddingTop: 28 }}>
        <div className="ncr-label ncr-label--gold" style={{ marginBottom: 18 }}>Point Schedule · Rules Ledger</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={serif({ fontSize: 18, fontWeight: 700 })}>Earning Points</div>
          <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.04em', color: 'var(--ncr-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ncr-green)' }} />
              Auto-synced from Google Sheets
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ncr-warn)' }} />
              Entered via Officer Tools
            </span>
          </div>
        </div>
        <div className="ncr-rules-cols" style={{ borderTop: '1px solid var(--ncr-rule)', columnCount: 3, columnGap: 44 }}>
          {pointEvents.map((e) => (
            <div
              key={e.key}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
                padding: '8px 2px',
                borderBottom: '1px solid rgba(43,35,24,.1)',
                breakInside: 'avoid',
                WebkitColumnBreakInside: 'avoid',
              }}
            >
              <span style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: e.auto ? 'var(--ncr-green)' : 'var(--ncr-warn)', transform: 'translateY(-1px)' }} />
                <span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-soft)' }}>
                    {e.name} <span style={{ color: 'var(--ncr-faint)', fontSize: 11 }}>/ {e.unit}</span>
                  </span>
                  {e.note && (
                    <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontStyle: 'italic', fontSize: 10, color: 'var(--ncr-faint)', marginTop: 2 }}>
                      {e.note}
                    </span>
                  )}
                </span>
              </span>
              <span className="ncr-fig" style={serif({ fontSize: 15, minWidth: 30, textAlign: 'right', flex: 'none' })}>{e.pts}</span>
            </div>
          ))}
        </div>

        <div className="ncr-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 44, marginTop: 36 }}>
          <div>
            <div style={serif({ fontSize: 18, fontWeight: 700, marginBottom: 10 })}>Required Events</div>
            <div style={{ borderTop: '1px solid var(--ncr-rule)' }}>
              {pointSystemConfig.requiredEvents.map((r) => (
                <div key={r.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '8px 2px', borderBottom: '1px solid rgba(43,35,24,.1)' }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: 'var(--ncr-green)', transform: 'translateY(-1px)' }} />
                    <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-soft)' }}>{r.label}</span>
                  </span>
                  <span className="ncr-fig" style={serif({ fontSize: 15, flex: 'none' })}>+{r.points}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--ncr-ui)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--ncr-faint)', marginTop: 8, lineHeight: 1.4 }}>
              Meetings, rituals & pledge meetings auto-sync from attendance in Google Sheets.
            </div>
          </div>
          <div>
            <div style={serif({ fontSize: 18, fontWeight: 700, marginBottom: 10 })}>Deductions</div>
            <div style={{ borderTop: '1px solid var(--ncr-rule)' }}>
              {pointSystemConfig.deductions.map((d) => (
                <div key={d.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '8px 2px', borderBottom: '1px solid rgba(43,35,24,.1)' }}>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-soft)' }}>
                    {d.label}{' '}
                    <span style={{ color: 'var(--ncr-faint)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      · {d.appliesTo === 'FAMILY' ? 'Family' : 'Member'}
                    </span>
                  </span>
                  <span className="ncr-fig" style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, color: 'var(--ncr-neg)', flex: 'none' }}>{d.points}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={serif({ fontSize: 18, fontWeight: 700, marginBottom: 10 })}>Streak Multipliers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STREAK_TIER_LIST.map((t) => (
                <span
                  key={t.badge}
                  style={{
                    fontFamily: 'var(--ncr-ui)',
                    fontSize: 11,
                    color: t.color,
                    border: `1px solid ${t.color}`,
                    padding: '6px 11px',
                    alignSelf: 'flex-start',
                  }}
                >
                  {t.badge} · ×{t.mult} <span style={{ color: 'var(--ncr-muted)' }}>({t.threshold}+ chapter meetings)</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30, borderTop: '1px solid var(--ncr-rule-soft)', paddingTop: 22 }}>
          <div className="ncr-label" style={{ fontSize: 11, letterSpacing: '.16em', marginBottom: 14 }}>Special Requirements</div>
          <div className="ncr-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {pointSystemConfig.specialRequirements.map((sr) => (
              <div key={sr.key} style={{ borderLeft: '3px solid var(--ncr-gold)', padding: '2px 0 2px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={serif({ fontSize: 16, fontWeight: 700 })}>{sr.label}</span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ncr-gold)', whiteSpace: 'nowrap' }}>
                    {sr.owner}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12.5, color: 'var(--ncr-ink-mid)', lineHeight: 1.5, marginTop: 6 }}>{sr.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
