import { useMemo, useState } from 'react';

const FAMILY_STYLES = {
  empire:   { bg: 'rgba(194,158,80,0.13)',  color: '#7a5a14', border: 'rgba(194,158,80,0.30)' },
  greed:    { bg: 'rgba(34,100,50,0.12)',   color: '#1a5228', border: 'rgba(34,100,50,0.26)' },
  wolfpack: { bg: 'rgba(80,120,188,0.11)',  color: '#2a4e80', border: 'rgba(80,120,188,0.24)' },
  power:    { bg: 'rgba(18,44,90,0.11)',    color: '#12305a', border: 'rgba(18,44,90,0.22)' },
  pride:    { bg: 'rgba(52,22,6,0.09)',     color: '#3a1a06', border: 'rgba(194,158,80,0.34)' },
};

const FAMILY_ACCENT_COLORS = {
  empire:   '#c9a857',
  greed:    '#2d6a3f',
  wolfpack: '#7aa0d4',
  power:    '#1e3f6f',
  pride:    '#c9a857',
};

const PODIUM_RANK = [
  { rankColor: '#8a6520' },
  { rankColor: '#5a6a7a' },
  { rankColor: '#7a4e28' },
];

const StreakText = ({ member, compact = false }) => {
  if (!member.streak || member.streak === 0) return <span className="lb-table__no-streak">·</span>;
  return (
    <span className="lb-streak-text">
      {member.streak}-event streak
      {member.streakKey === 'goat' && <span className="lb-streak-goat">G.O.A.T.</span>}
    </span>
  );
};

const LeaderboardTable = ({ members = [], loading, onSelectMember }) => {
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...members].sort((a, b) => b.totalPoints - a.totalPoints || a.memberName.localeCompare(b.memberName)),
    [members],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? sorted.filter((m) => `${m.memberName} ${m.familyName}`.toLowerCase().includes(q))
      : sorted;
    return base.slice(0, 23);
  }, [sorted, query]);

  const rankMap = useMemo(
    () => new Map(sorted.map((m, i) => [m.memberId, i + 1])),
    [sorted],
  );

  const highlight = sorted.slice(0, 3);

  return (
    <div className="leaderboard">
      {/* ── Podium ── */}
      <div className="lb-podium">
        {highlight.length === 0 ? (
          <div className="lb-podium__empty">
            {loading ? 'Loading leaderboard…' : 'No points recorded yet.'}
          </div>
        ) : (
          highlight.map((member, i) => {
            const pod = PODIUM_RANK[i];
            const famKey = (member.familyName || '').toLowerCase();
            const famAccent = FAMILY_ACCENT_COLORS[famKey] || '#c9a857';
            return (
              <button
                key={member.memberId}
                type="button"
                className={`lb-podium-card lb-podium-card--${i + 1}`}
                style={{
                  borderTop: `3px solid ${famAccent}`,
                  borderRight: '1px solid rgba(122,98,68,0.13)',
                  borderBottom: '1px solid rgba(122,98,68,0.13)',
                  borderLeft: '1px solid rgba(122,98,68,0.13)',
                }}
                onClick={() => onSelectMember?.(member.memberId)}
              >
                {i === 0 && <span className="lb-podium-card__leader-label">Current Leader</span>}
                <div className="lb-podium-card__rank" style={{ color: pod.rankColor }}>#{i + 1}</div>
                <div className="lb-podium-card__name">{member.memberName}</div>
                <div className="lb-podium-card__family">{member.familyName}</div>
                <div className="lb-podium-card__points" style={{ color: pod.rankColor }}>
                  {member.totalPoints} pts
                </div>
                {member.streak > 0 && (
                  <span className="lb-podium-card__streak">
                    {member.streak}-event streak
                    {member.streakKey === 'goat' && <span className="lb-streak-goat">G.O.A.T.</span>}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* ── Search row ── */}
      <div className="lb-controls">
        <div className="lb-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0.45, flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search brothers or family…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <p className="lb-count">
          {query.trim()
            ? <><strong>{filtered.length}</strong> of {sorted.length} matched</>
            : <><strong>{sorted.length}</strong> {sorted.length === 1 ? 'brother' : 'brothers'}</>
          }
        </p>
      </div>

      {/* ── Table ── */}
      <div className="lb-table-wrap">
        <table className="lb-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Brother</th>
              <th>Family</th>
              <th>Points</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const rank = rankMap.get(member.memberId);
              const famKey = (member.familyName || '').toLowerCase();
              const fam = FAMILY_STYLES[famKey];
              return (
                <tr
                  key={member.memberId}
                  onClick={() => onSelectMember?.(member.memberId)}
                  className={rank <= 3 ? `lb-table__row--top${rank}` : ''}
                >
                  <td>
                    <span className={`lb-rank lb-rank--${rank <= 3 ? rank : 'default'}`}>
                      #{rank}
                    </span>
                  </td>
                  <td className="lb-table__name">{member.memberName}</td>
                  <td>
                    <span
                      className="lb-family-pill"
                      style={fam ? { background: fam.bg, color: fam.color, border: `1px solid ${fam.border}` } : undefined}
                    >
                      {member.familyName}
                    </span>
                  </td>
                  <td className="lb-table__pts">{member.totalPoints}</td>
                  <td><StreakText member={member} /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="lb-table__empty">
                  {loading ? 'Loading…' : 'No matches found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
