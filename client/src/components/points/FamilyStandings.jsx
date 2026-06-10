const FAMILY_STYLES = {
  empire:   { border: '#c9a857', bar: '#c9a857' },
  greed:    { border: '#2d6a3f', bar: '#3a8a50' },
  wolfpack: { border: '#7aa0d4', bar: '#7aa0d4' },
  power:    { border: '#1e3f6f', bar: '#2a5298' },
  pride:    { border: '#3a1a06', bar: '#c9a857' },
};

const FamilyStandings = ({ families = [], loading }) => {
  if (loading) {
    return (
      <div className="pd-family-list">
        <div className="pd-family-list__empty">Loading families…</div>
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="pd-family-list">
        <div className="pd-family-list__empty">No families have points yet.</div>
      </div>
    );
  }

  const maxAvg = families[0]?.averagePointsPerMember || 1;

  return (
    <div className="pd-family-list">
      {families.map((family, i) => {
        const key = (family.familyName || '').toLowerCase();
        const style = FAMILY_STYLES[key] || { border: '#c9a857', bar: '#c9a857' };
        const pct = Math.round((family.averagePointsPerMember / maxAvg) * 100);

        return (
          <div
            key={family.familyId}
            className="pd-family-row"
            style={{ borderLeftColor: style.border }}
          >
            <span className="pd-family-row__rank">#{i + 1}</span>
            <div className="pd-family-row__body">
              <div className="pd-family-row__top">
                <span className="pd-family-row__name">{family.familyName}</span>
                <span className="pd-family-row__pts">
                  {family.averagePointsPerMember.toFixed(1)}
                  <span className="pd-family-row__pts-unit">avg</span>
                </span>
              </div>
              <div className="pd-family-row__bar-wrap">
                <div
                  className="pd-family-row__bar"
                  style={{ width: `${pct}%`, background: style.bar }}
                />
              </div>
              <p className="pd-family-row__avg">{family.totalPoints} total pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FamilyStandings;
