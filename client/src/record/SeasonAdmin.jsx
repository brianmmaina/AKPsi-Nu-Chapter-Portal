// Season administration — start a new points term (e.g. Spring → Fall).
// The term is stored server-side and tags every award, so past seasons
// stay archived under their own term id.

import { useState } from 'react';
import { usePoints } from '../context/PointsContext';

export default function SeasonAdmin({ notify }) {
  const { term, actions } = usePoints();
  const [nextTerm, setNextTerm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const label = nextTerm.trim();
    if (!label) {
      notify('Enter the new term, e.g. "Fall 2026".', 'error');
      return;
    }
    const ok = window.confirm(
      `Start the ${label} season?\n\nNew attendance and adjustments will be recorded under ${label}, and the ledger starts fresh. ${term} records stay archived under their own term.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await actions.setSeason(label);
      setNextTerm('');
      notify(`New season started — the record now tracks ${label}.`);
    } catch (err) {
      notify(`Save failed: ${err.response?.data?.error || err.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 48, alignItems: 'start' }}>
      <form onSubmit={submit} className="ncr-card" style={{ padding: '24px 26px', borderTop: '4px solid var(--ncr-gold)' }}>
        <div className="ncr-label ncr-label--gold" style={{ fontSize: 10.5, marginBottom: 16 }}>Current Season</div>
        <div style={{ fontFamily: 'var(--ncr-display)', fontSize: 34, color: 'var(--ncr-ink)', marginBottom: 22 }}>{term}</div>

        <label className="ncr-field-label" htmlFor="season-next">Start a new season</label>
        <input
          id="season-next"
          className="ncr-input"
          value={nextTerm}
          onChange={(e) => setNextTerm(e.target.value)}
          placeholder='e.g. "Fall 2026"'
          style={{ marginBottom: 22 }}
        />
        <button type="submit" className="ncr-btn" disabled={busy} style={{ width: '100%', height: 46 }}>
          {busy ? 'Saving…' : 'Start New Season'}
        </button>
      </form>

      <div style={{ maxWidth: 560 }}>
        <div className="ncr-label" style={{ marginBottom: 14 }}>What changing the season does</div>
        <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 12px' }}>
            The term label updates everywhere — the Index, the Life Points Ledger, and brother records — for every
            member as soon as they reload.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Attendance and manual adjustments recorded from officer tools are tagged with the current term, so the
            leaderboard starts from zero for the new season while past seasons stay archived in the points database
            under their old term.
          </p>
          <p style={{ margin: 0 }}>
            If the chapter runs points from the Google Sheet, remember to also reset the Sheet for the new term — the
            Sheet is its own source of truth for what it contains.
          </p>
        </div>
      </div>
    </div>
  );
}
