import { useMemo, useState } from 'react';
import LeaderboardTable from './LeaderboardTable';
import FamilyStandings from './FamilyStandings';
import PointsRulesPanel from './PointsRulesPanel';
import TimeframeSelector from './TimeframeSelector';
import PointsAdminLauncher from './admin/PointsAdminLauncher.jsx';
import { usePoints } from '../../context/PointsContext';
import { pointSystemConfig } from '../../config/pointSystemConfig';

const STREAK_LABELS = {
  'on-fire': 'On Fire',
  'locked':  'Hot Streak',
  'goat':    'G.O.A.T.',
};

const SnapshotCard = ({ label, value, sub }) => (
  <div className="pd-stat">
    <div className="pd-stat__accent" />
    <span className="pd-stat__label">{label}</span>
    <span className="pd-stat__value">{value}</span>
    {sub && <span className="pd-stat__sub">{sub}</span>}
  </div>
);

const PointsDashboard = ({ onBack, onBackToHome, canGoBack }) => {
  const { pointsData, timeframe, setTimeframe, loading, error, refresh, lastSynced, openMemberPoints } =
    usePoints();
  const [showAdmin, setShowAdmin] = useState(false);

  const members = pointsData?.members || [];
  const families = pointsData?.families || [];

  const sorted = useMemo(
    () => [...members].sort((a, b) => b.totalPoints - a.totalPoints || a.memberName.localeCompare(b.memberName)),
    [members],
  );

  const sortedFamilies = useMemo(
    () => [...families].sort((a, b) => b.averagePointsPerMember - a.averagePointsPerMember),
    [families],
  );

  const topMember = sorted[0];
  const leadingFamily = sortedFamilies[0];
  const longestStreak = members.reduce((max, m) => Math.max(max, m.streak || 0), 0);

  const streakLeaders = useMemo(
    () =>
      [...members]
        .filter((m) => (m.streak || 0) > 0)
        .sort((a, b) => (b.streak || 0) - (a.streak || 0))
        .slice(0, 5),
    [members],
  );

  const showSnapshot = !loading && members.length > 0;

  return (
    <div className="points-dashboard">
      {/* ── Header ── */}
      <header className="pd-hero">
        <div className="pd-hero__top">
          <div className="pd-hero__text">
            <p className="pd-eyebrow">Nu Chapter · {pointSystemConfig.semester}</p>
            <h1 className="pd-title">Live Points Dashboard</h1>
            <p className="pd-subtitle">
              Track brother points, family standings, and attendance streaks for {pointSystemConfig.semester}.
            </p>
          </div>
          <div className="pd-nav">
            <button
              type="button"
              className="pd-btn"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f0f' }}
              onClick={onBackToHome}
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="pd-divider" />

        <div className="pd-controls">
          <div className="pd-controls__left">
            <TimeframeSelector value={timeframe} onChange={setTimeframe} disabled={loading} />
          </div>
          <div className="pd-controls__right">
            {lastSynced && !loading && (
              <span className="pd-sync-time">
                Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              className="pd-refresh"
              onClick={() => refresh()}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="pd-alert">
          <strong>Something went wrong.</strong> Please try refreshing.
        </div>
      )}

      {/* ── Live Snapshot ── */}
      {showSnapshot && (
        <div className="pd-snapshot">
          <SnapshotCard label="Active Brothers" value={members.length} />
          {topMember && (
            <SnapshotCard
              label="Current Leader"
              value={topMember.memberName}
              sub={`${topMember.totalPoints} pts`}
            />
          )}
          {leadingFamily && (
            <SnapshotCard
              label="Family Cup Leader"
              value={leadingFamily.familyName}
              sub={`${leadingFamily.averagePointsPerMember.toFixed(1)} avg / member`}
            />
          )}
          {longestStreak > 0 && (
            <SnapshotCard label="Longest Streak" value={`${longestStreak} events`} />
          )}
          <SnapshotCard label="Current Term" value={pointSystemConfig.semester} />
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="pd-grid">
        {/* Left: Leaderboard */}
        <section className="pd-card pd-card--leaderboard">
          <div className="pd-card__header">
            <h2 className="pd-card__title">Chapter Leaderboard</h2>
            <p className="pd-card__sub">Tap any brother to view their event log.</p>
          </div>
          <LeaderboardTable
            members={members}
            loading={loading}
            onSelectMember={(memberId) => openMemberPoints(memberId)}
          />
        </section>

        {/* Right: Side panels */}
        <div className="pd-side">
          <section className="pd-card pd-card--families">
            <div className="pd-card__header">
              <h2 className="pd-card__title">Family Cup</h2>
              <p className="pd-card__sub">Ranked by avg pts per member.</p>
            </div>
            <FamilyStandings families={sortedFamilies} loading={loading} />
          </section>

          {streakLeaders.length > 0 && (
            <section className="pd-card pd-card--streaks">
              <div className="pd-card__header">
                <h2 className="pd-card__title">Streak Leaders</h2>
                <p className="pd-card__sub">Top 5 by consecutive meetings attended.</p>
              </div>
              <div className="pd-streak-list">
                {streakLeaders.map((m, i) => (
                  <div key={m.memberId} className="pd-streak-row">
                    <span className="pd-streak-row__rank">#{i + 1}</span>
                    <div className="pd-streak-row__info">
                      <span className="pd-streak-row__name">{m.memberName}</span>
                      <span className="pd-streak-row__family">{m.familyName}</span>
                    </div>
                    {m.streakKey ? (
                      <span className={`streak-badge streak-badge--${m.streakKey}`}>
                        {STREAK_LABELS[m.streakKey]} · ×{m.streak}
                      </span>
                    ) : (
                      <span className="streak-badge">Streak · ×{m.streak}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="pd-card pd-card--checkpoints">
            <div className="pd-card__header">
              <h2 className="pd-card__title">Checkpoints</h2>
              <p className="pd-card__sub">{pointSystemConfig.semester} milestones.</p>
            </div>
            <div className="pd-checkpoints">
              {pointSystemConfig.checkpoints.map((cp) => {
                const topPts = topMember?.totalPoints || 0;
                const pct = topPts > 0
                  ? Math.min(Math.round((topPts / cp.minimumPoints) * 100), 100)
                  : 0;
                return (
                  <div key={cp.id} className="pd-checkpoint">
                    <div className="pd-checkpoint__header">
                      <span className="pd-checkpoint__label">{cp.label}</span>
                      <span className="pd-checkpoint__pts">{cp.minimumPoints} pts min</span>
                    </div>
                    {cp.description && (
                      <p className="pd-checkpoint__desc">{cp.description}</p>
                    )}
                    <div className="pd-checkpoint__bar-wrap">
                      <div className="pd-checkpoint__bar" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="pd-checkpoint__note">Top scorer at {pct}% of target</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ── Rules ── */}
      <section className="pd-card pd-card--rules pd-full-width">
        <PointsRulesPanel />
      </section>

      {showAdmin && (
        <div className="points-admin-overlay">
          <PointsAdminLauncher onClose={() => setShowAdmin(false)} />
        </div>
      )}
    </div>
  );
};

export default PointsDashboard;
