import { useMemo, useState } from 'react';
import PointsAdminPanel from './PointsAdminPanel.jsx';
import { usePoints } from '../../../context/PointsContext.jsx';

const MAX_RESULTS = 30;

const PointsAdminLauncher = ({ onClose }) => {
  const { pointsData, loading } = usePoints();
  const members = pointsData?.members ?? [];

  const [query, setQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const selectedMember =
    members.find((member) => member.memberId === selectedMemberId) || null;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    if (!normalizedQuery) {
      return members.slice(0, MAX_RESULTS);
    }
    return members
      .filter((member) => {
        const haystack = `${member.memberName} ${member.familyName}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, MAX_RESULTS);
  }, [members, normalizedQuery]);

  const handleSelectMember = (memberId) => {
    setSelectedMemberId(memberId);
  };

  const handleChangeMember = () => {
    setSelectedMemberId(null);
    setQuery('');
  };

  if (loading) {
    return (
      <div className="points-admin-modal">
        <div className="points-admin-search">
          <p className="admin-hint">Loading roster…</p>
        </div>
      </div>
    );
  }

  if (selectedMember) {
    return (
      <div className="points-admin-modal">
        <PointsAdminPanel
          onClose={onClose}
          initialMember={selectedMember}
          onChangeMember={handleChangeMember}
        />
      </div>
    );
  }

  return (
    <div className="points-admin-modal">
      <div className="points-admin-search">
        <div className="points-admin-search__head">
          <div>
            <p className="eyebrow">VPAA Admin</p>
            <h2>Who are you managing?</h2>
            <p className="admin-hint">
              Start by searching for a brother. Selecting them unlocks attendance, adjustments, and
              other admin actions.
            </p>
          </div>
          <button type="button" className="points-admin-close" onClick={onClose}>
            ×
          </button>
        </div>
        <label className="admin-label">
          Search roster
          <input
            className="admin-input"
            autoFocus
            placeholder="Type a name or family…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="points-admin-search-list">
          {filteredMembers.length === 0 && (
            <p className="admin-hint">No matches yet. Try another name or family.</p>
          )}
          {filteredMembers.map((member) => (
            <button
              key={member.memberId}
              type="button"
              className="points-admin-search-item"
              onClick={() => handleSelectMember(member.memberId)}
            >
              <div>
                <strong>{member.memberName}</strong>
                <p>{member.familyName}</p>
              </div>
              <span>{member.totalPoints} pts</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PointsAdminLauncher;

