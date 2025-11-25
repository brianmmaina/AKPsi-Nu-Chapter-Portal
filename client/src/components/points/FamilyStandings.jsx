const FamilyStandings = ({ families = [], loading }) => {
  if (loading) {
    return (
      <div className="family-standings-grid">
        <div className="family-card family-card--empty">Loading families…</div>
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="family-standings-grid">
        <div className="family-card family-card--empty">No families have points yet.</div>
      </div>
    );
  }

  return (
    <div className="family-standings-grid">
      {families.map((family) => (
        <div key={family.familyId} className="family-card">
          <div className="family-card__name">{family.familyName}</div>
          <div className="family-card__metric">
            <span>Total</span>
            <strong>{family.totalPoints} pts</strong>
          </div>
          <div className="family-card__metric">
            <span>Avg / member</span>
            <strong>{family.averagePointsPerMember.toFixed(1)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FamilyStandings;

