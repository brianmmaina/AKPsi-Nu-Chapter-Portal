import { useMemo, useState } from 'react';
import CorrectionRequestForm from './CorrectionRequestForm';
import FlameIcon from '../FlameIcon';

const CATEGORY_META = {
  CHAPTER: { label: 'Chapter', color: '#1f2937' },
  PROFESSIONAL: { label: 'Professional', color: '#0f766e' },
  DEI: { label: 'DEI', color: '#9333ea' },
  SERVICE: { label: 'Service', color: '#2563eb' },
  SOCIAL: { label: 'Social', color: '#a21caf' },
  RECRUITMENT: { label: 'Recruitment', color: '#c026d3' },
  RITUAL: { label: 'Ritual', color: '#b45309' },
  COMMITTEE: { label: 'Committee', color: '#0ea5e9' },
  COMPETITION: { label: 'Competition', color: '#16a34a' },
  OTHER: { label: 'Other', color: '#92400e' },
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date TBC';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const formatCategoryPill = (category) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.OTHER;
  return {
    label: meta.label,
    style: {
      backgroundColor: `${meta.color}1a`,
      color: meta.color,
      border: `1px solid ${meta.color}33`,
    },
  };
};

const STREAK_TIER_THRESHOLDS = [
  { threshold: 3, key: 'on-fire', label: 'On Fire' },
  { threshold: 5, key: 'locked', label: 'Locked' },
  { threshold: 8, key: 'goat', label: 'G.O.A.T' },
];

const StreakProgress = ({ member }) => {
  const streak = member?.streak ?? 0;
  const nextTier = STREAK_TIER_THRESHOLDS.find((t) => t.threshold > streak);
  const prevThreshold = [...STREAK_TIER_THRESHOLDS].reverse().find((t) => t.threshold <= streak)?.threshold ?? 0;
  const nextThreshold = nextTier?.threshold ?? prevThreshold;
  const progress = nextTier && nextThreshold > prevThreshold
    ? (streak - prevThreshold) / (nextThreshold - prevThreshold)
    : streak > 0 ? 1 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: 'rgba(15,23,42,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(progress * 100, 100)}%`,
            borderRadius: 999,
            background: member?.streakKey === 'goat'
              ? '#d97706'
              : member?.streakKey === 'locked'
                ? '#3b82f6'
                : '#ea580c',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {nextTier && (
        <span style={{ fontSize: '12px', color: 'rgba(15,23,42,0.5)', whiteSpace: 'nowrap' }}>
          {nextThreshold - streak} more to {nextTier.label}
        </span>
      )}
    </div>
  );
};

const EmptyState = ({ memberName }) => (
  <div
    style={{
      padding: '24px',
      borderRadius: '18px',
      background: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      border: '1px dashed rgba(0,0,0,0.12)',
    }}
  >
    <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
      {memberName ? `No points for ${memberName} yet` : 'No events tracked yet'}
    </h3>
    <p style={{ margin: 0, color: 'rgba(17,24,39,0.75)' }}>
      When points are logged, they will appear here with the event, category, and date.
    </p>
  </div>
);

const MemberPointsDetail = ({ member, events = [], timeframe }) => {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events]);

  const groupedByCategory = useMemo(() => {
    return sortedEvents.reduce((acc, event) => {
      const group = event.category || 'OTHER';
      if (!acc[group]) {
        acc[group] = {
          category: group,
          total: 0,
          events: [],
        };
      }
      acc[group].events.push(event);
      acc[group].total += event.points;
      return acc;
    }, {});
  }, [sortedEvents]);

  const totalPoints = member?.totalPoints ?? sortedEvents.reduce((sum, event) => sum + event.points, 0);

  const activeMemberName = member?.memberName || 'Selected member';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderBottom: '1px solid rgba(15,23,42,0.12)',
          paddingBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: '14px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(17,24,39,0.65)',
          }}
        >
          {timeframe === 'YEAR' ? 'Academic Year' : 'Current Semester'}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {activeMemberName}
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {member?.familyName && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(15,23,42,0.15)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {member.familyName} Family
            </span>
          )}
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'rgba(16,185,129,0.12)',
              color: '#047857',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            {totalPoints} pts
          </span>
          {member?.streakKey && (
            <span className={`streak-badge streak-badge--${member.streakKey}`}>
              {member.streakBadge}
              <FlameIcon size={10} />
              {member.streak}
            </span>
          )}
        </div>

        {member?.streak > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: '13px', color: 'rgba(15,23,42,0.6)', marginBottom: 6 }}>
              Attendance streak: <strong style={{ color: '#0f172a' }}>{member.streak} in a row</strong>
              {member.streakMultiplier > 1 && (
                <span style={{ marginLeft: 6, color: '#0369a1', fontWeight: 600 }}>
                  ({member.streakMultiplier}x multiplier)
                </span>
              )}
            </div>
            <StreakProgress member={member} />
          </div>
        )}
      </header>

      {sortedEvents.length === 0 ? (
        <EmptyState memberName={activeMemberName} />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {Object.values(groupedByCategory).map((group) => {
            const { label } = formatCategoryPill(group.category);
            return (
              <section
                key={group.category}
                style={{
                  borderRadius: '18px',
                  border: '1px solid rgba(15,23,42,0.08)',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 8px 30px rgba(15,23,42,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(15,23,42,0.05)',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{group.total} pts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {group.events.map((event) => {
                    const pill = formatCategoryPill(event.category);
                    return (
                      <div
                        key={`${event.id}-${event.awardId || event.date}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '120px 1fr auto',
                          gap: 12,
                          padding: '14px 20px',
                          borderBottom: '1px solid rgba(15,23,42,0.04)',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '14px', color: 'rgba(15,23,42,0.7)' }}>{formatDate(event.date)}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {event.eventName}
                            {event.isAdjustment && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#c2410c',
                                  borderRadius: '8px',
                                  padding: '2px 8px',
                                  background: 'rgba(194,65,12,0.1)',
                                  border: '1px solid rgba(194,65,12,0.3)',
                                }}
                              >
                                Adjustment
                              </span>
                            )}
                          </div>
                          {event.note && (
                            <div style={{ fontSize: '12px', color: 'rgba(15,23,42,0.7)' }}>
                              {event.note}
                            </div>
                          )}
                          <span
                            style={{
                              ...pill.style,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              width: 'fit-content',
                            }}
                          >
                            {pill.label}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{event.points} pts</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid rgba(15,23,42,0.08)',
          paddingTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: '14px', color: 'rgba(15,23,42,0.75)' }}>
          Think something’s off?{' '}
          <button
            type="button"
            onClick={() => setShowCorrectionForm((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0ea5e9',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Request a correction
          </button>
        </div>
        {showCorrectionForm && (
          <CorrectionRequestForm
            memberName={activeMemberName}
            defaultEventName={sortedEvents[0]?.eventName}
            onClose={() => setShowCorrectionForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MemberPointsDetail;

