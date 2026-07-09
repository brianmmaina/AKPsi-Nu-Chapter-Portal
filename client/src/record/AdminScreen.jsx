// Points Administration — officer-gated writes to the chapter records:
// record attendance, create events, log manual adjustments.

import { useState, useMemo } from 'react';
import { usePoints } from '../context/PointsContext';

const CATEGORIES = ['CHAPTER', 'PROFESSIONAL', 'SERVICE', 'SOCIAL', 'RITUAL', 'COMPETITION', 'DEI', 'RECRUITMENT', 'COMMITTEE', 'OTHER'];

const FALLBACK_EVENTS = [
  { name: 'Weekly Chapter Meeting', pts: 8, value: 'Weekly Chapter Meeting' },
  { name: 'Service Saturday', pts: 6, value: 'Service Saturday' },
  { name: 'Professional Workshop', pts: 7, value: 'Professional Workshop' },
  { name: 'Case Competition', pts: 18, value: 'Case Competition' },
];

export default function AdminScreen({
  M,
  officerAuthed,
  officerHint,
  onOfficerUnlock,
  onLockOfficer,
  onBackToLedger,
  notify,
}) {
  const { pointsData, actions, timeframe } = usePoints();

  const [tab, setTab] = useState('attendance');
  const [officerPw, setOfficerPw] = useState('');
  const [officerError, setOfficerError] = useState('');
  const [officerBusy, setOfficerBusy] = useState(false);

  // Attendance
  const [presentMap, setPresentMap] = useState({});
  const [attEventId, setAttEventId] = useState('');
  const [attBusy, setAttBusy] = useState(false);

  // Event builder
  const [ebName, setEbName] = useState('');
  const [ebDate, setEbDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ebCat, setEbCat] = useState('PROFESSIONAL');
  const [ebPts, setEbPts] = useState('7');
  const [ebCp, setEbCp] = useState('CP2');
  const [ebCup, setEbCup] = useState(true);
  const [ebBusy, setEbBusy] = useState(false);
  const [sessionEvents, setSessionEvents] = useState([]);

  // Adjustments
  const [ajMember, setAjMember] = useState('');
  const [ajPoints, setAjPoints] = useState('10');
  const [ajReason, setAjReason] = useState('');
  const [ajBusy, setAjBusy] = useState(false);

  const sortedAll = useMemo(
    () => Object.values(M.brothers).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
    [M],
  );

  const liveEvents = (pointsData && pointsData.events
    ? pointsData.events.filter((e) => e.id !== 'manual-adjustment')
    : []
  );
  const attEvents = liveEvents.length
    ? liveEvents.slice().reverse().map((e) => ({ name: e.name, pts: e.defaultPoints, value: e.id }))
    : FALLBACK_EVENTS;
  const attSel = attEvents.find((x) => x.value === attEventId) || attEvents[0] || { name: '', pts: 0, value: '' };
  const attendanceCount = Object.keys(presentMap).filter((k) => presentMap[k]).length;

  // Points writes are keyed by the points system's member id; fall back to the
  // roster name (Sheets keys members by name).
  const pointsMemberIdFor = (id) => (M.brothers[id] && (M.brothers[id].pointsMemberId || M.brothers[id].name)) || id;

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    if (!officerPw.trim()) {
      setOfficerError('Enter the officer password.');
      return;
    }
    setOfficerBusy(true);
    const res = await onOfficerUnlock(officerPw);
    setOfficerBusy(false);
    if (res.ok) {
      setOfficerPw('');
      setOfficerError('');
      notify('Officer tools unlocked.');
    } else {
      setOfficerError(res.error || 'Incorrect officer password.');
      setOfficerPw('');
    }
  };

  const awardAttendance = async () => {
    const ids = Object.keys(presentMap).filter((k) => presentMap[k]);
    if (!ids.length) {
      notify('Mark at least one brother present.', 'error');
      return;
    }
    setAttBusy(true);
    try {
      await actions.recordAttendance(attSel.value, ids.map(pointsMemberIdFor), attSel.pts);
      setPresentMap({});
      notify(`Awarded ${attSel.pts} pts to ${ids.length} brother${ids.length === 1 ? '' : 's'} · saved to the points records.`);
    } catch (err) {
      notify(`Save failed: ${err.message || err}`, 'error');
    } finally {
      setAttBusy(false);
    }
  };

  const createEvent = async () => {
    const name = ebName.trim();
    if (!name) {
      notify('Enter an event name.', 'error');
      return;
    }
    setEbBusy(true);
    try {
      await actions.createEvent({
        name,
        date: ebDate,
        category: ebCat,
        required: false,
        defaultPoints: Number(ebPts) || 0,
        checkpoints: [ebCp],
        countsForFamilyCup: ebCup,
        timeframe,
      });
      setSessionEvents((prev) => [...prev, { name, meta: `${ebCat} · ${Number(ebPts) || 0} pts · ${ebCp}${ebCup ? ' · Family Cup' : ''}` }]);
      setEbName('');
      notify(`Event “${name}” created in the points records.`);
    } catch (err) {
      notify(`Create failed: ${err.message || err}`, 'error');
    } finally {
      setEbBusy(false);
    }
  };

  const recordAdjustment = async () => {
    const pts = parseInt(ajPoints, 10);
    const memberId = ajMember || (sortedAll[0] ? sortedAll[0].id : '');
    if (Number.isNaN(pts) || pts === 0) {
      notify('Enter a non-zero adjustment.', 'error');
      return;
    }
    if (!ajReason.trim()) {
      notify('A reason is required (audited).', 'error');
      return;
    }
    const who = M.brothers[memberId];
    setAjBusy(true);
    try {
      await actions.addManualAdjustment(pointsMemberIdFor(memberId), pts, ajReason.trim());
      setAjReason('');
      setAjPoints('10');
      notify(`${pts > 0 ? '+' : ''}${pts} pts recorded for ${who ? who.name : 'brother'} · saved.`);
    } catch (err) {
      notify(`Save failed: ${err.message || err}`, 'error');
    } finally {
      setAjBusy(false);
    }
  };

  const tabBtn = (key, name) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        background: 'none',
        border: 'none',
        padding: '12px 22px',
        cursor: 'pointer',
        fontFamily: 'var(--ncr-ui)',
        fontSize: 11.5,
        letterSpacing: '.16em',
        textTransform: 'uppercase',
        color: tab === key ? 'var(--ncr-ink)' : 'var(--ncr-muted)',
        borderBottom: `2px solid ${tab === key ? 'var(--ncr-crimson)' : 'transparent'}`,
        marginBottom: -1.5,
      }}
    >
      {name}
    </button>
  );

  return (
    <div className="ncr-shell">
      <div className="ncr-folio-row">
        <button className="ncr-link-btn" onClick={onBackToLedger} style={{ fontSize: 11, letterSpacing: '.2em' }}>
          ← Ledger
        </button>
        <span className="ncr-folio-line" />
        <span className="ncr-folio-note">Officers Only · Writes to the chapter records</span>
      </div>
      <h1 className="ncr-display-1" style={{ margin: '14px 0 26px' }}>Points Administration</h1>

      {!officerAuthed && (
        <div className="ncr-card" style={{ maxWidth: 400, margin: '8px 0 40px', borderTop: '4px solid var(--ncr-crimson)', padding: '32px 34px' }}>
          <div className="ncr-label ncr-label--gold" style={{ fontSize: 10.5, letterSpacing: '.22em', marginBottom: 10 }}>
            Restricted · Executive Board
          </div>
          <div style={{ fontFamily: 'var(--ncr-display)', fontSize: 25, color: 'var(--ncr-ink)', marginBottom: 8 }}>Officer Sign-in</div>
          <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', lineHeight: 1.55, margin: '0 0 20px' }}>
            Manual point entry, event creation, and adjustments are limited to chapter officers.
          </p>
          <form onSubmit={handleOfficerSubmit}>
            <label className="ncr-field-label" htmlFor="officer-password" style={{ marginBottom: 7 }}>Officer Password</label>
            <input
              id="officer-password"
              type="password"
              value={officerPw}
              onChange={(e) => setOfficerPw(e.target.value)}
              placeholder="••••••••"
              className="ncr-input"
            />
            <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ncr-faint)', marginTop: 7 }}>
              {officerHint}
            </div>
            {officerError && <div className="ncr-error" style={{ marginTop: 11 }}>{officerError}</div>}
            <button type="submit" className="ncr-btn" disabled={officerBusy} style={{ marginTop: 22, width: '100%', height: 46 }}>
              {officerBusy ? 'Verifying…' : 'Unlock Officer Tools'}
            </button>
          </form>
        </div>
      )}

      {officerAuthed && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottom: '1.5px solid var(--ncr-ink)', marginBottom: 34, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {tabBtn('attendance', 'Record Attendance')}
              {tabBtn('event', 'Event Builder')}
              {tabBtn('adjust', 'Manual Adjustments')}
            </div>
            <button className="ncr-btn-ghost" onClick={onLockOfficer} style={{ marginBottom: 8, padding: '7px 13px', color: 'var(--ncr-muted)' }}>
              Lock
            </button>
          </div>

          {tab === 'attendance' && (
            <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 48, alignItems: 'start' }}>
              <div>
                <label className="ncr-field-label" htmlFor="att-event">Select Event</label>
                <select
                  id="att-event"
                  className="ncr-select"
                  value={attSel.value}
                  onChange={(e) => setAttEventId(e.target.value)}
                >
                  {attEvents.map((o) => (
                    <option key={o.value} value={o.value}>{o.name}</option>
                  ))}
                </select>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-muted)', marginTop: 14, lineHeight: 1.6 }}>
                  Default award <span style={{ fontFamily: 'var(--ncr-serif)', color: 'var(--ncr-ink)' }}>{attSel.pts} pts</span> · Counts for Family Cup
                </div>
                <button className="ncr-btn" onClick={awardAttendance} disabled={attBusy} style={{ marginTop: 24, width: '100%', height: 46 }}>
                  {attBusy ? 'Saving…' : `Award ${attSel.pts} pts to Present`}
                </button>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="ncr-label">Roster · mark present</span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>{attendanceCount} present</span>
                </div>
                <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
                  {sortedAll.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setPresentMap((prev) => ({ ...prev, [b.id]: !prev[b.id] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 4px', borderBottom: '1px solid var(--ncr-rule-faint)', cursor: 'pointer' }}
                    >
                      <span className="ncr-checkbox" style={{ background: presentMap[b.id] ? 'var(--ncr-ink)' : 'transparent' }}>
                        {presentMap[b.id] ? '✓' : ''}
                      </span>
                      <span style={{ flex: 1, fontFamily: 'var(--ncr-serif)', fontSize: 16, color: 'var(--ncr-ink)' }}>{b.name}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-ink-mid)' }}>
                        <span style={{ width: 8, height: 8, background: b.accent }} />
                        {b.family}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'event' && (
            <div style={{ maxWidth: 620 }}>
              <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="ncr-field-label" htmlFor="eb-name">Event Name</label>
                  <input id="eb-name" className="ncr-input" value={ebName} onChange={(e) => setEbName(e.target.value)} placeholder="e.g. Alumni Networking Night" />
                </div>
                <div>
                  <label className="ncr-field-label" htmlFor="eb-date">Date</label>
                  <input id="eb-date" className="ncr-input" type="date" value={ebDate} onChange={(e) => setEbDate(e.target.value)} />
                </div>
                <div>
                  <label className="ncr-field-label" htmlFor="eb-cat">Category</label>
                  <select id="eb-cat" className="ncr-select" value={ebCat} onChange={(e) => setEbCat(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ncr-field-label" htmlFor="eb-pts">Default Points</label>
                  <input id="eb-pts" className="ncr-input" type="number" value={ebPts} onChange={(e) => setEbPts(e.target.value)} />
                </div>
                <div>
                  <label className="ncr-field-label" htmlFor="eb-cp">Checkpoint</label>
                  <select id="eb-cp" className="ncr-select" value={ebCp} onChange={(e) => setEbCp(e.target.value)}>
                    <option>CP1</option>
                    <option>CP2</option>
                    <option>CP3</option>
                  </select>
                </div>
              </div>
              <div onClick={() => setEbCup((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, cursor: 'pointer' }}>
                <span className="ncr-checkbox" style={{ background: ebCup ? 'var(--ncr-ink)' : 'transparent' }}>{ebCup ? '✓' : ''}</span>
                <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink)' }}>Counts toward the Family Cup</span>
              </div>
              <button className="ncr-btn" onClick={createEvent} disabled={ebBusy} style={{ marginTop: 30 }}>
                {ebBusy ? 'Saving…' : 'Create Event'}
              </button>
              {sessionEvents.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <div className="ncr-label ncr-label--sm" style={{ fontSize: 10.5, marginBottom: 10 }}>Created This Session</div>
                  <div style={{ borderTop: '1px solid var(--ncr-rule)' }}>
                    {sessionEvents.map((c, i) => (
                      <div key={`${c.name}-${i}`} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, padding: '9px 2px', borderBottom: '1px solid rgba(43,35,24,.1)' }}>
                        <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, color: 'var(--ncr-ink)' }}>{c.name}</span>
                        <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)', letterSpacing: '.04em' }}>{c.meta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'adjust' && (
            <div style={{ maxWidth: 620 }}>
              <label className="ncr-field-label" htmlFor="aj-member">Brother</label>
              <select
                id="aj-member"
                className="ncr-select"
                value={ajMember || (sortedAll[0] ? sortedAll[0].id : '')}
                onChange={(e) => setAjMember(e.target.value)}
                style={{ marginBottom: 22 }}
              >
                {sortedAll.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} · {b.family}</option>
                ))}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 22, alignItems: 'end' }}>
                <div>
                  <label className="ncr-field-label" htmlFor="aj-points">Adjustment</label>
                  <input
                    id="aj-points"
                    className="ncr-input"
                    type="number"
                    value={ajPoints}
                    onChange={(e) => setAjPoints(e.target.value)}
                    style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18 }}
                  />
                </div>
                <div>
                  <label className="ncr-field-label" htmlFor="aj-reason">Reason (audited)</label>
                  <input
                    id="aj-reason"
                    className="ncr-input"
                    value={ajReason}
                    onChange={(e) => setAjReason(e.target.value)}
                    placeholder="e.g. Led committee initiative"
                  />
                </div>
              </div>
              <button className="ncr-btn" onClick={recordAdjustment} disabled={ajBusy} style={{ marginTop: 30 }}>
                {ajBusy ? 'Saving…' : 'Record Adjustment'}
              </button>
              <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', marginTop: 18 }}>
                All manual adjustments are logged with a note and timestamp.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
