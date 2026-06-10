import { useState } from 'react';
import { pointSystemConfig, STREAK_TIERS } from '../../config/pointSystemConfig';
import FlameIcon from '../FlameIcon';

const CATEGORY_LABELS = {
  CHAPTER: 'Chapter', PROFESSIONAL: 'Professional', DEI: 'DEI',
  SERVICE: 'Service', SOCIAL: 'Social', RECRUITMENT: 'Recruitment',
  RITUAL: 'Ritual', COMMITTEE: 'Committee', COMPETITION: 'Competition', OTHER: 'Other',
};

const formatPoints = (event) => {
  if (event.variants?.length) return event.variants.map((v) => `${v.label}: ${v.points} pts`).join(' · ');
  if (event.points) return `${event.points} pts / ${event.perUnit}${event.maxPerCheckpoint ? ` (max ${event.maxPerCheckpoint}/checkpoint)` : ''}`;
  return 'See VPAA for details';
};

const grouped = pointSystemConfig.pointEvents.reduce((acc, event) => {
  const cat = event.category || 'OTHER';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(event);
  return acc;
}, {});

const Accordion = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pd-rules-accordion">
      <button
        type="button"
        className="pd-rules-accordion__trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="pd-rules-accordion__body">{children}</div>}
    </div>
  );
};

const PointsRulesPanel = () => (
  <div className="points-rules">
    <div className="points-rules__header">
      <h3>Point Rules & Transparency</h3>
      <p>{pointSystemConfig.semester} · Maintained by VPAA</p>
    </div>

    <Accordion title="Checkpoints" defaultOpen>
      <ul>
        {pointSystemConfig.checkpoints.map((cp) => (
          <li key={cp.id}>
            <strong>{cp.label}</strong>: {cp.minimumPoints} pts minimum
            {cp.description && <span className="pd-rules-note"> · {cp.description}</span>}
          </li>
        ))}
      </ul>
    </Accordion>

    <Accordion title="Required Events">
      <ul>
        {pointSystemConfig.requiredEvents.map((req) => (
          <li key={req.key}>
            <strong>{req.label}</strong> ({req.category}): {req.points} pts · checkpoints {req.checkpoints.join(', ')}
            {req.description && <span className="pd-rules-note"> · {req.description}</span>}
          </li>
        ))}
      </ul>
    </Accordion>

    {Object.entries(grouped).map(([cat, events]) => (
      <Accordion key={cat} title={CATEGORY_LABELS[cat] || cat}>
        <ul>
          {events.map((event) => (
            <li key={event.key}>
              <strong>{event.name}</strong>: {formatPoints(event)}
              {event.notes && <span className="pd-rules-note"> · {event.notes}</span>}
            </li>
          ))}
        </ul>
      </Accordion>
    ))}

    <Accordion title="Attendance Streak Bonuses">
      <ul>
        {[...STREAK_TIERS].sort((a, b) => a.threshold - b.threshold).map((tier) => (
          <li key={tier.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`streak-badge streak-badge--${tier.key}`}>
              {tier.badge} <FlameIcon size={10} /> {tier.threshold}+
            </span>
            <span>{tier.threshold}+ consecutive meetings → <strong>{tier.multiplier}x</strong> multiplier on chapter meeting points</span>
          </li>
        ))}
      </ul>
    </Accordion>

    <Accordion title="Deductions">
      <ul>
        {pointSystemConfig.deductions.map((d) => (
          <li key={d.key}>
            <strong>{d.label}</strong>: {d.points} pts ({d.appliesTo.toLowerCase()})
            {d.notes && <span className="pd-rules-note"> · {d.notes}</span>}
          </li>
        ))}
      </ul>
    </Accordion>

    <Accordion title="Special Reminders">
      <ul>
        {pointSystemConfig.specialRequirements.map((req) => (
          <li key={req.key}>
            <strong>{req.label}</strong>: {req.description}
          </li>
        ))}
        <li>Point-earning events are shown here; disciplinary actions and fines are handled offline.</li>
      </ul>
    </Accordion>

    <p className="points-rules__disclaimer">
      Questions or corrections? Contact VPAA.
    </p>
  </div>
);

export default PointsRulesPanel;
