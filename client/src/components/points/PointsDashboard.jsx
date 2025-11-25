import LeaderboardTable from './LeaderboardTable';
import FamilyStandings from './FamilyStandings';
import PointsRulesPanel from './PointsRulesPanel';
import TimeframeSelector from './TimeframeSelector';
import { usePoints } from '../../context/PointsContext';

const PointsDashboard = () => {
  const { pointsData, timeframe, setTimeframe, loading, error, refresh, openMemberPoints } = usePoints();

  const members = pointsData?.members || [];
  const families = pointsData?.families || [];

  return (
    <div className="points-dashboard">
      <div className="points-dashboard__header">
        <div>
          <p className="eyebrow">AKPsi Nu Chapter</p>
          <h1>Live Points Dashboard</h1>
          <p className="subtitle">Celebrate wins, track the Family Cup, and keep everything transparent.</p>
        </div>
        <div className="points-dashboard__actions">
          <TimeframeSelector value={timeframe} onChange={setTimeframe} disabled={loading} />
          <button type="button" className="points-refresh" onClick={() => refresh()} disabled={loading}>
            Refresh data
          </button>
        </div>
      </div>
      {error && (
        <div className="points-alert">
          <strong>Something went wrong.</strong> Please try refreshing.
        </div>
      )}

      <div className="points-dashboard__grid">
        <section className="points-panel">
          <div className="panel-header">
            <div>
              <h2>Chapter leaderboard</h2>
              <p>Top 10 brothers with a scrollable full list.</p>
            </div>
          </div>
          <LeaderboardTable
            members={members}
            loading={loading}
            onSelectMember={(memberId) => openMemberPoints(memberId)}
          />
        </section>

        <aside className="points-stack">
          <section className="points-panel">
            <div className="panel-header">
              <div>
                <h2>Family Cup standings</h2>
                <p>Total + average points per family.</p>
              </div>
            </div>
            <FamilyStandings families={families} loading={loading} />
          </section>
          <PointsRulesPanel />
        </aside>
      </div>
    </div>
  );
};

export default PointsDashboard;

