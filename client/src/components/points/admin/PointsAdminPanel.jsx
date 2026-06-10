import { useEffect, useMemo, useState } from 'react';
import { pointSystemConfig, getPointEventTemplate } from '../../../config/pointSystemConfig';
import { usePoints } from '../../../context/PointsContext.jsx';

const CHECKPOINT_OPTIONS = pointSystemConfig.checkpoints.map((checkpoint) => checkpoint.id);
const CATEGORY_OPTIONS = Array.from(
  new Set(pointSystemConfig.pointEvents.map((event) => event.category)),
).sort();

const TIMEFRAME_OPTIONS = [
  { value: 'SEMESTER', label: 'This Semester' },
  { value: 'YEAR', label: 'This Year' },
];

const defaultEventForm = (timeframe) => {
  const fallbackTemplate = pointSystemConfig.pointEvents[0];
  const defaultPoints =
    fallbackTemplate?.points || fallbackTemplate?.variants?.[0]?.points || 5;
  return {
    id: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    category: fallbackTemplate?.category || 'CHAPTER',
    subcategory: '',
    required: false,
    defaultPoints,
    checkpoints: CHECKPOINT_OPTIONS.length ? [CHECKPOINT_OPTIONS[0]] : [],
    countsForFamilyCup: true,
    timeframe,
  };
};

const PointsAdminPanel = ({ onClose, initialMember, onChangeMember = () => {} }) => {
  const { pointsData, timeframe, actions, loading } = usePoints();
  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const [eventForm, setEventForm] = useState(() => defaultEventForm(timeframe));
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [attendanceEventId, setAttendanceEventId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [adjustmentMemberId, setAdjustmentMemberId] = useState('');
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [spotlightMember, setSpotlightMember] = useState(initialMember || null);
  const [templateKey, setTemplateKey] = useState('');

  const events = pointsData?.events ?? [];
  const members = pointsData?.members ?? [];

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === attendanceEventId),
    [events, attendanceEventId],
  );

  useEffect(() => {
    if (!isEditing) {
      setEventForm(defaultEventForm(timeframe));
      setSelectedEventId('');
      setTemplateKey('');
    }
  }, [timeframe, isEditing]);

  useEffect(() => {
    setSpotlightMember(initialMember || null);
  }, [initialMember]);

  useEffect(() => {
    if (spotlightMember && !adjustmentMemberId) {
      setAdjustmentMemberId(spotlightMember.memberId);
    }
  }, [spotlightMember, adjustmentMemberId]);

  const handleToggleMember = (memberId) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleSelectEventToEdit = (eventId) => {
    if (!eventId) {
      setIsEditing(false);
      setEventForm(defaultEventForm(timeframe));
      setSelectedEventId('');
      setTemplateKey('');
      return;
    }
    const event = events.find((evt) => evt.id === eventId);
    if (!event) return;
    setIsEditing(true);
    setSelectedEventId(eventId);
    setTemplateKey('');
    setEventForm({
      id: event.id,
      name: event.name,
      date: event.date,
      category: event.category,
      subcategory: event.subcategory || '',
      required: event.required,
      defaultPoints: event.defaultPoints,
      checkpoints: event.checkpoints || [],
      countsForFamilyCup: event.countsForFamilyCup,
      timeframe: event.timeframe,
    });
  };

  const handleTemplateSelect = (value) => {
    setTemplateKey(value);
    if (!value) return;
    const template = getPointEventTemplate(value);
    if (!template) return;
    const templatePoints =
      template.points || template.variants?.[0]?.points || eventForm.defaultPoints;
    setEventForm((prev) => ({
      ...prev,
      name: template.name,
      category: template.category,
      defaultPoints: templatePoints,
      subcategory: '',
    }));
  };

  const submitEventForm = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setStatus(null);
      const payload = {
        name: eventForm.name,
        date: eventForm.date,
        category: eventForm.category,
        subcategory: eventForm.subcategory || undefined,
        required: eventForm.required,
        defaultPoints: Number(eventForm.defaultPoints) || 0,
        checkpoints: eventForm.checkpoints,
        countsForFamilyCup: eventForm.countsForFamilyCup,
        timeframe: eventForm.timeframe,
      };
      if (isEditing && eventForm.id) {
        await actions.updateEvent(eventForm.id, payload);
        setStatus('Event updated.');
      } else {
        await actions.createEvent(payload);
        setStatus('Event created.');
      }
      setIsEditing(false);
      setSelectedEventId('');
      setEventForm(defaultEventForm(timeframe));
    } catch (error) {
      setStatus(error.message || 'Unable to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAttendance = async (event) => {
    event.preventDefault();
    if (!attendanceEventId || selectedMembers.size === 0) {
      setStatus('Select an event and at least one member.');
      return;
    }
    try {
      setSubmitting(true);
      setStatus(null);
      await actions.recordAttendance(attendanceEventId, Array.from(selectedMembers));
      setStatus('Attendance recorded.');
      setSelectedMembers(new Set());
    } catch (error) {
      setStatus(error.message || 'Unable to record attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    if (!adjustmentMemberId || !adjustmentPoints) {
      setStatus('Select a member and enter the adjustment.');
      return;
    }
    try {
      setSubmitting(true);
      setStatus(null);
      await actions.addManualAdjustment(
        adjustmentMemberId,
        Number(adjustmentPoints),
        adjustmentNote.trim(),
      );
      setAdjustmentPoints('');
      setAdjustmentNote('');
      setStatus('Adjustment saved.');
    } catch (error) {
      setStatus(error.message || 'Unable to save adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttendance = () => (
    <form className="admin-form" onSubmit={submitAttendance}>
      <label className="admin-label">
        Event
        <select
          className="admin-input"
          value={attendanceEventId}
          onChange={(e) => setAttendanceEventId(e.target.value)}
          required
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} · {new Date(event.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>
      {selectedEvent && (
        <p className="admin-hint">
          Default points: <strong>{selectedEvent.defaultPoints}</strong> · Category:{' '}
          {selectedEvent.category}
        </p>
      )}
      <div className="admin-roster">
        {members.map((member) => {
          const checked = selectedMembers.has(member.memberId);
          return (
            <label key={member.memberId} className={`admin-roster-item ${checked ? 'is-selected' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggleMember(member.memberId)}
              />
              <span>
                {member.memberName} · {member.familyName}
              </span>
            </label>
          );
        })}
      </div>
      <button type="submit" className="points-admin-primary" disabled={submitting || loading}>
        Record Attendance
      </button>
    </form>
  );

  const renderEventForm = () => (
    <form className="admin-form" onSubmit={submitEventForm}>
      <label className="admin-label">
        Start from template
        <select
          className="admin-input"
          value={templateKey}
          onChange={(e) => handleTemplateSelect(e.target.value)}
        >
          <option value="">Select a template (optional)</option>
          {pointSystemConfig.pointEvents.map((template) => (
            <option key={template.key} value={template.key}>
              {template.name} · {template.category}
            </option>
          ))}
        </select>
      </label>
      {templateKey && (
        <div className="admin-hint">
          <p>
            {getPointEventTemplate(templateKey)?.notes ||
              'Template applied. Adjust anything else you need before saving.'}
          </p>
          {getPointEventTemplate(templateKey)?.variants?.length > 0 && (
            <ul>
              {getPointEventTemplate(templateKey)?.variants?.map((variant) => (
                <li key={variant.key}>
                  {variant.label}: {variant.points} pts
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <label className="admin-label">
        Load existing event
        <select
          className="admin-input"
          value={selectedEventId}
          onChange={(e) => handleSelectEventToEdit(e.target.value)}
        >
          <option value="">New event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} · {event.category}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-label">
        Event name
        <input
          className="admin-input"
          value={eventForm.name}
          onChange={(e) => setEventForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </label>
      <div className="admin-grid">
        <label className="admin-label">
          Date
          <input
            type="date"
            className="admin-input"
            value={eventForm.date}
            onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </label>
        <label className="admin-label">
          Timeframe
          <select
            className="admin-input"
            value={eventForm.timeframe}
            onChange={(e) => setEventForm((prev) => ({ ...prev, timeframe: e.target.value }))}
          >
            {TIMEFRAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-grid">
        <label className="admin-label">
          Category
          <select
            className="admin-input"
            value={eventForm.category}
            onChange={(e) => setEventForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-label">
          Default points
          <input
            type="number"
            min="0"
            className="admin-input"
            value={eventForm.defaultPoints}
            onChange={(e) =>
              setEventForm((prev) => ({ ...prev, defaultPoints: Number(e.target.value) }))
            }
          />
        </label>
      </div>
      <label className="admin-label">
        Subcategory
        <input
          className="admin-input"
          value={eventForm.subcategory}
          onChange={(e) => setEventForm((prev) => ({ ...prev, subcategory: e.target.value }))}
          placeholder="Optional"
        />
      </label>
      <div className="admin-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={eventForm.required}
            onChange={(e) => setEventForm((prev) => ({ ...prev, required: e.target.checked }))}
          />
          Required for members
        </label>
        <label>
          <input
            type="checkbox"
            checked={eventForm.countsForFamilyCup}
            onChange={(e) =>
              setEventForm((prev) => ({ ...prev, countsForFamilyCup: e.target.checked }))
            }
          />
          Counts for Family Cup
        </label>
      </div>
      <label className="admin-label">
        Checkpoints
        <div className="admin-checkboxes">
          {CHECKPOINT_OPTIONS.map((cp) => (
            <label key={cp}>
              <input
                type="checkbox"
                checked={eventForm.checkpoints.includes(cp)}
                onChange={() => {
                  setEventForm((prev) => {
                    const next = new Set(prev.checkpoints);
                    if (next.has(cp)) {
                      next.delete(cp);
                    } else {
                      next.add(cp);
                    }
                    return { ...prev, checkpoints: Array.from(next) };
                  });
                }}
              />
              {cp}
            </label>
          ))}
        </div>
      </label>
      <button type="submit" className="points-admin-primary" disabled={submitting}>
        {isEditing ? 'Update Event' : 'Create Event'}
      </button>
    </form>
  );

  const renderAdjustments = () => (
    <form className="admin-form" onSubmit={submitAdjustment}>
      <label className="admin-label">
        Member
        <select
          className="admin-input"
          value={adjustmentMemberId}
          onChange={(e) => setAdjustmentMemberId(e.target.value)}
          required
        >
          <option value="">Select a member</option>
          {members.map((member) => (
            <option key={member.memberId} value={member.memberId}>
              {member.memberName} · {member.familyName} ({member.totalPoints} pts)
            </option>
          ))}
        </select>
      </label>
      <label className="admin-label">
        Adjustment (positive or negative)
        <input
          type="number"
          className="admin-input"
          value={adjustmentPoints}
          onChange={(e) => setAdjustmentPoints(e.target.value)}
          required
        />
      </label>
      <label className="admin-label">
        Note
        <textarea
          className="admin-input"
          value={adjustmentNote}
          onChange={(e) => setAdjustmentNote(e.target.value)}
          placeholder="Why is this adjustment needed?"
          rows={3}
        />
      </label>
      <button type="submit" className="points-admin-primary" disabled={submitting}>
        Save Adjustment
      </button>
    </form>
  );

  const renderActiveTab = () => {
    if (!pointsData) {
      return <p className="admin-hint">Loading points data…</p>;
    }
    if (activeTab === 'EVENTS') return renderEventForm();
    if (activeTab === 'ADJUSTMENTS') return renderAdjustments();
    return renderAttendance();
  };

  return (
    <div className="points-admin-panel">
      <header className="points-admin-header">
        <div className="points-admin-header__info">
          <p className="eyebrow">VPAA Admin</p>
          <h2>Points Admin Panel</h2>
          <p className="admin-hint">Create events, record attendance, and log adjustments.</p>
        </div>
        <button type="button" className="points-admin-close" onClick={onClose}>
          ×
        </button>
      </header>
      {spotlightMember && (
        <div className="points-admin-target">
          <div>
            <p className="eyebrow">Acting on behalf of</p>
            <h3>{spotlightMember.memberName}</h3>
            <p className="admin-hint">
              {spotlightMember.familyName} · {spotlightMember.totalPoints} pts
            </p>
          </div>
          <button
            type="button"
            className="points-admin-switcher"
            onClick={() => onChangeMember?.()}
          >
            Switch brother
          </button>
        </div>
      )}
      <div className="points-admin-tabs">
        {['ATTENDANCE', 'EVENTS', 'ADJUSTMENTS'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`points-admin-tab ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ATTENDANCE' && 'Record Attendance'}
            {tab === 'EVENTS' && 'Event Builder'}
            {tab === 'ADJUSTMENTS' && 'Manual Adjustments'}
          </button>
        ))}
      </div>
      {status && <div className="points-admin-status">{status}</div>}
      <div className="points-admin-content">{renderActiveTab()}</div>
    </div>
  );
};

export default PointsAdminPanel;

