const medalColors = ['#facc15', '#94a3b8', '#c084fc'];

const LeaderboardTable = ({ members = [], loading, onSelectMember }) => {
  const sorted = [...members].sort((a, b) => b.totalPoints - a.totalPoints);
  const highlight = sorted.slice(0, 3);

  const handleSelect = (memberId) => {
    if (!memberId) return;
    onSelectMember?.(memberId);
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard__highlights">
        {highlight.map((member, index) => (
          <button
            key={member.memberId}
            type="button"
            className="leaderboard-card"
            onClick={() => handleSelect(member.memberId)}
          >
            <div
              className="leaderboard-card__medal"
              style={{ background: `${medalColors[index]}33`, color: medalColors[index] }}
            >
              #{index + 1}
            </div>
            <div className="leaderboard-card__name">{member.memberName}</div>
            <div className="leaderboard-card__family">{member.familyName}</div>
            <div className="leaderboard-card__points">{member.totalPoints} pts</div>
          </button>
        ))}
        {highlight.length === 0 && (
          <div className="leaderboard-card leaderboard-card--empty">
            {loading ? 'Loading leaderboard…' : 'No points yet. Check back soon!'}
          </div>
        )}
      </div>

      <div className="leaderboard__table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Family</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((member, index) => (
              <tr key={member.memberId} onClick={() => handleSelect(member.memberId)}>
                <td>#{index + 1}</td>
                <td>{member.memberName}</td>
                <td>{member.familyName}</td>
                <td>{member.totalPoints}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '24px 12px' }}>
                  {loading ? 'Loading leaderboard…' : 'No points data found for this timeframe.'}
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

