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

const StatIcons = {
  brothers: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  leader: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  family: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  streak: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  term: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
    </svg>
  ),
};

const SnapshotCard = ({ label, value, sub, icon }) => (
  <div className="pd-stat">
    <div className="pd-stat__accent" />
    <div className="pd-stat__head">
      {icon && <span className="pd-stat__icon">{icon}</span>}
      <span className="pd-stat__label">{label}</span>
    </div>
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

        {/* Nav row: back + refresh */}
        <div className="pd-hero__nav">
          <button type="button" className="pd-btn" onClick={onBackToHome}>
            ← Archive Home
          </button>
          <div className="pd-hero__nav-right">
            {lastSynced && !loading && (
              <span className="pd-sync-time">
                Updated {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {/* Title block */}
        <div className="pd-hero__title-block">
          <p className="pd-eyebrow">Nu Chapter · {pointSystemConfig.semester}</p>
          <h1 className="pd-title">Chapter Points Ledger</h1>
          <p className="pd-subtitle">
            Official live record of brother points, family standings, and attendance streaks.
          </p>
        </div>

        <div className="pd-divider" />

        {/* Timeframe selector */}
        <div className="pd-controls">
          <TimeframeSelector value={timeframe} onChange={setTimeframe} disabled={loading} />
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
          <SnapshotCard label="Active Brothers" value={members.length} icon={StatIcons.brothers} />
          {topMember && (
            <SnapshotCard
              label="Current Leader"
              value={topMember.memberName}
              sub={`${topMember.totalPoints} pts`}
              icon={StatIcons.leader}
            />
          )}
          {leadingFamily && (
            <SnapshotCard
              label="Family Cup Leader"
              value={leadingFamily.familyName}
              sub={`${leadingFamily.averagePointsPerMember.toFixed(1)} avg / member`}
              icon={StatIcons.family}
            />
          )}
          {longestStreak > 0 && (
            <SnapshotCard
              label="Longest Streak"
              value={`${longestStreak} events`}
              icon={StatIcons.streak}
            />
          )}
          <SnapshotCard label="Current Term" value={pointSystemConfig.semester} icon={StatIcons.term} />
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="pd-grid">

        {/* Left: Leaderboard */}
        <section className="pd-card pd-card--leaderboard">
          <div className="pd-card__header">
            <span className="pd-card__label">Standings</span>
          </div>
          <div className="pd-card__body">
            <h2 className="pd-card__title">Chapter Leaderboard</h2>
            <p className="pd-card__sub">Select any brother to view their full event log.</p>
            <LeaderboardTable
              members={members}
              loading={loading}
              onSelectMember={(memberId) => openMemberPoints(memberId)}
            />
          </div>
        </section>

        {/* Right: Side panels */}
        <div className="pd-side">

          <section className="pd-card pd-card--families">
            <div className="pd-card__header">
              <span className="pd-card__label">Cup</span>
            </div>
            <div className="pd-card__body">
              <h2 className="pd-card__title">Family Cup</h2>
              <p className="pd-card__sub">Ranked by avg points per member.</p>
              <FamilyStandings families={sortedFamilies} loading={loading} />
            </div>
          </section>

          {streakLeaders.length > 0 && (
            <section className="pd-card pd-card--streaks">
              <div className="pd-card__header">
                <span className="pd-card__label">Attendance</span>
              </div>
              <div className="pd-card__body">
                <h2 className="pd-card__title">Streak Leaders</h2>
                <p className="pd-card__sub">Top 5 by consecutive meetings attended.</p>
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
                        <span className="streak-badge">×{m.streak}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="pd-card pd-card--checkpoints">
            <div className="pd-card__header">
              <span className="pd-card__label">Progress</span>
            </div>
            <div className="pd-card__body">
              <h2 className="pd-card__title">Checkpoints</h2>
              <p className="pd-card__sub">{pointSystemConfig.semester} milestones.</p>
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
                        <span className="pd-checkpoint__pts">{cp.minimumPoints} pts</span>
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
            </div>
          </section>

        </div>
      </div>

      {/* ── Rules Ledger ── */}
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
