// Roster & Trees administration — officer-gated roster maintenance:
// bulk graduate/reactivate pledge classes, re-parent bigs, remove records.

import { useState, useMemo } from 'react';
import { brothers as brothersApi, relationships as relationshipsApi } from '../api';

export default function RosterAdmin({ M, canWrite, notify, onChanged, onOpenBrother, onAddBrother }) {
  const [famFilter, setFamFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState(false);

  const roster = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(M.brothers)
      .filter((b) => (famFilter === 'all' || b.familyId === famFilter))
      .filter((b) => !q || b.name.toLowerCase().includes(q) || (b.pledgeClass || '').toLowerCase().includes(q))
      .sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));
  }, [M, famFilter, query]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const toggleAllVisible = () => {
    const allOn = roster.length > 0 && roster.every((b) => selected[b.id]);
    const next = { ...selected };
    roster.forEach((b) => {
      next[b.id] = !allOn;
    });
    setSelected(next);
  };

  const run = async (fn, done, onSuccess) => {
    if (!canWrite) {
      notify('Chapter server offline — roster editing unavailable.', 'error');
      return;
    }
    setBusy(true);
    try {
      await fn();
      await onChanged();
      notify(done);
      if (onSuccess) onSuccess();
    } catch (err) {
      notify(`Save failed: ${err.response?.data?.error || err.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const bulkStatus = (status) => {
    if (!selectedIds.length) {
      notify('Select at least one brother first.', 'error');
      return;
    }
    run(
      () => brothersApi.bulkStatus(selectedIds, status),
      `${selectedIds.length} record${selectedIds.length === 1 ? '' : 's'} marked ${status === 'graduated' ? 'Graduated' : 'Active'}.`,
      () => setSelected({}),
    );
  };

  const setStatus = (b, status) =>
    run(() => brothersApi.bulkStatus([b.id], status), `${b.name} marked ${status === 'graduated' ? 'Graduated' : 'Active'}.`);

  const changeBig = (b, bigId) => {
    if (bigId === '') {
      run(() => relationshipsApi.remove(b.id, b.familyId), `${b.name} detached — now a root of the tree.`);
    } else {
      run(
        () => relationshipsApi.create({ family_id: b.familyId, big_id: bigId, little_id: b.id }),
        `${b.name}'s Big updated.`,
      );
    }
  };

  const removeBrother = (b) => {
    const ok = window.confirm(
      `Remove ${b.name} from the chapter record?\n\nTheir littles (if any) become roots of the ${b.family} tree. This cannot be undone.`,
    );
    if (!ok) return;
    run(() => brothersApi.remove(b.id), `${b.name} removed from the record.`);
  };

  const bigOptions = (b) =>
    (M.byFamily[b.familyId] || [])
      .filter((id) => id !== b.id)
      .map((id) => M.brothers[id])
      .sort((a, x) => a.name.localeCompare(x.name));

  const famTab = (key, name) => (
    <button
      key={key}
      onClick={() => setFamFilter(key)}
      style={{
        background: famFilter === key ? 'var(--ncr-ink)' : 'transparent',
        color: famFilter === key ? 'var(--ncr-paper-text)' : 'var(--ncr-ink)',
        border: '1px solid var(--ncr-rule)',
        padding: '7px 14px',
        cursor: 'pointer',
        fontFamily: 'var(--ncr-ui)',
        fontSize: 10.5,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
      }}
    >
      {name}
    </button>
  );

  return (
    <div>
      {!canWrite && (
        <div className="ncr-card" style={{ borderLeft: '5px solid var(--ncr-warn)', padding: '14px 18px', marginBottom: 22 }}>
          <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)' }}>
            Chapter server offline — the roster below is the sample record and cannot be edited.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {famTab('all', 'All Families')}
        {M.famOrder.map((fid) => famTab(fid, M.FAM[fid].name))}
        <input
          className="ncr-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or pledge class…"
          style={{ height: 36, width: 240, marginLeft: 'auto' }}
        />
        <button className="ncr-btn-ghost" onClick={onAddBrother} style={{ height: 36 }}>
          + Add Brother
        </button>
      </div>

      <div
        className="ncr-card"
        style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', marginBottom: 4 }}
      >
        <span
          className="ncr-checkbox"
          onClick={toggleAllVisible}
          style={{ background: roster.length && roster.every((b) => selected[b.id]) ? 'var(--ncr-ink)' : 'transparent', cursor: 'pointer' }}
        >
          {roster.length && roster.every((b) => selected[b.id]) ? '✓' : ''}
        </span>
        <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-muted)' }}>
          {selectedIds.length} selected
        </span>
        <span style={{ flex: 1 }} />
        <button className="ncr-btn-ghost" disabled={busy} onClick={() => bulkStatus('graduated')}>
          Mark Graduated
        </button>
        <button className="ncr-btn-ghost" disabled={busy} onClick={() => bulkStatus('studying')}>
          Mark Active
        </button>
      </div>

      <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
        {roster.map((b) => (
          <div
            key={b.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1.4fr .7fr .8fr 1fr auto',
              alignItems: 'center',
              gap: 14,
              padding: '10px 4px',
              borderBottom: '1px solid var(--ncr-rule-faint)',
            }}
          >
            <span
              className="ncr-checkbox"
              onClick={() => setSelected((prev) => ({ ...prev, [b.id]: !prev[b.id] }))}
              style={{ background: selected[b.id] ? 'var(--ncr-ink)' : 'transparent', cursor: 'pointer' }}
            >
              {selected[b.id] ? '✓' : ''}
            </span>

            <button
              onClick={() => onOpenBrother(b.id)}
              className="ncr-row-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 4px' }}
              title="Open record to edit details"
            >
              <span style={{ width: 8, height: 8, flex: 'none', background: b.accent }} />
              <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15.5, color: 'var(--ncr-ink)' }}>{b.name}</span>
            </button>

            <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12, color: 'var(--ncr-ink-mid)' }}>{b.pledgeClass}</span>

            <button
              className="ncr-btn-ghost ncr-btn-ghost--soft"
              disabled={busy}
              onClick={() => setStatus(b, b.status === 'graduated' ? 'studying' : 'graduated')}
              title="Toggle active / graduated"
              style={{
                padding: '5px 10px',
                color: b.status === 'graduated' ? 'var(--ncr-gold)' : 'var(--ncr-green)',
                borderColor: 'var(--ncr-rule-soft)',
              }}
            >
              {b.status === 'graduated' ? 'Graduated' : 'Active'}
            </button>

            <select
              className="ncr-select"
              disabled={busy}
              value={M.bigOf[b.id] || ''}
              onChange={(e) => changeBig(b, e.target.value)}
              style={{ height: 34, fontSize: 12.5 }}
              title="Big brother"
            >
              <option value="">— No Big (root) —</option>
              {bigOptions(b).map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            <button
              className="ncr-btn-ghost"
              disabled={busy}
              onClick={() => removeBrother(b)}
              style={{ color: 'var(--ncr-crimson-deep)', borderColor: 'var(--ncr-rule-soft)', padding: '5px 10px' }}
            >
              Remove
            </button>
          </div>
        ))}
        {!roster.length && (
          <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', padding: '16px 4px' }}>
            No brothers match this filter.
          </div>
        )}
      </div>

      <div className="ncr-italic" style={{ fontSize: 12.5, color: 'var(--ncr-muted)', marginTop: 16 }}>
        Click a name to open the full record (bio, major, photo, socials). Changing a Big re-draws the family tree immediately.
      </div>
    </div>
  );
}
