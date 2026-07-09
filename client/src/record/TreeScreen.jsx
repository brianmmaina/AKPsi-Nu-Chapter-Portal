// Family tree — themed banner, family tabs, the descent chart
// (generic any-depth layout, zoom/pan, PNG export, fullscreen), and the roster register.

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { layoutTree } from './model';
import { hexA } from './palette';

export default function TreeScreen({ M, treeFamily, onSelectFamily, onOpenBrother, onBackToLineage, onAddBrother, notify }) {
  const fid = M.FAM[treeFamily] ? treeFamily : M.famOrder[0];
  const fam = M.FAM[fid] || { name: '—', letter: '?', accent: '#2b2318', soft: 'transparent', subtitle: '', founded: '' };
  const layout = useMemo(() => layoutTree(M, fid), [M, fid]);
  const register = (M.byFamily[fid] || []).map((id) => M.brothers[id]);

  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);

  const zoomBy = useCallback((d) => {
    setZoom((z) => Math.min(2.5, Math.max(0.2, +(z + d).toFixed(2))));
  }, []);

  // Fit the whole tree into the viewport width.
  const fitZoom = useCallback(() => {
    const el = boxRef.current;
    const available = el ? el.clientWidth - 34 : 0;
    if (!available || !layout.width) return 1;
    return Math.min(1, Math.max(0.2, +(available / layout.width).toFixed(2)));
  }, [layout.width]);

  const zoomReset = useCallback(() => {
    setZoom(fitZoom());
    setPan({ x: 0, y: 0 });
  }, [fitZoom]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === '0') zoomReset();
      else if (e.key === '+' || e.key === '=') zoomBy(0.15);
      else if (e.key === '-' || e.key === '_') zoomBy(-0.15);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomBy, zoomReset]);

  // Start fitted so the whole tree is visible; refit when switching families.
  useEffect(() => {
    setZoom(fitZoom());
    setPan({ x: 0, y: 0 });
  }, [fid, fitZoom]);

  // ⌘/Ctrl + scroll zooms the chart (plain scroll still pans/scrolls).
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? -0.1 : 0.1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const onDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.x), y: dragRef.current.py + (e.clientY - dragRef.current.y) });
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const exportTree = async () => {
    const el = boxRef.current;
    if (!el) {
      notify('Tree not ready to export.', 'error');
      return;
    }
    setExporting(true);
    notify('Rendering PNG…');
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#e6dcc6', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${String(fam.name || 'family').toLowerCase()}-family-tree.png`;
      a.click();
      notify('Tree exported as PNG.');
    } catch (err) {
      notify(`Export failed: ${err.message || err}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const toggleFullscreen = () => {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  };

  return (
    <div style={{ position: 'relative', zIndex: 5 }}>
      {/* Themed banner */}
      <div style={{ background: fam.soft, borderBottom: `4px solid ${fam.accent}` }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', padding: '30px 40px' }}>
          <button className="ncr-link-btn" onClick={onBackToLineage} style={{ fontSize: 11, letterSpacing: '.2em', marginBottom: 18, color: 'var(--ncr-ink-mid)' }}>
            ← Lineage
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
            <span
              style={{
                width: 96,
                height: 96,
                flex: 'none',
                background: fam.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--ncr-display)',
                fontSize: 54,
                color: '#f4ecda',
                boxShadow: '0 8px 22px rgba(43,35,24,.22)',
              }}
            >
              {fam.letter}
            </span>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: fam.accent }}>
                {fam.name} · Lineage
              </div>
              <h1 className="ncr-display-1" style={{ fontSize: 60, margin: '6px 0' }}>{fam.name}</h1>
              <div className="ncr-italic" style={{ fontSize: 16 }}>
                {fam.subtitle || 'Family lineage'} · {fam.founded || 'Nu Chapter'} · {register.length} brothers on record
              </div>
            </div>
            <img src="/akpsi-seal.png" alt="" style={{ width: 78, height: 78, objectFit: 'contain', opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
            {M.famOrder.map((tid) => {
              const t = M.FAM[tid];
              const active = tid === fid;
              return (
                <button
                  key={tid}
                  onClick={() => onSelectFamily(tid)}
                  style={{
                    background: active ? t.accent : 'transparent',
                    color: active ? '#f4ecda' : 'var(--ncr-ink)',
                    border: `1px solid ${active ? t.accent : 'var(--ncr-rule)'}`,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontFamily: 'var(--ncr-ui)',
                    fontSize: 11,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '36px 40px 64px' }}>
        <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'start' }}>
          {/* Chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <span className="ncr-label">Descent Chart · Principal Line</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={() => zoomBy(-0.15)} aria-label="Zoom out" style={{ width: 30, height: 30, padding: 0, fontSize: 17, lineHeight: 1 }}>−</button>
                <span style={{ minWidth: 46, textAlign: 'center', fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.06em', color: 'var(--ncr-ink-mid)' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={() => zoomBy(0.15)} aria-label="Zoom in" style={{ width: 30, height: 30, padding: 0, fontSize: 16, lineHeight: 1 }}>+</button>
                <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={zoomReset} style={{ height: 30, padding: '0 12px' }}>Reset</button>
                <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={toggleFullscreen} style={{ height: 30, padding: '0 12px' }}>Fullscreen</button>
                <button
                  className="ncr-btn"
                  onClick={exportTree}
                  disabled={exporting}
                  style={{ height: 30, padding: '0 12px', fontSize: 10, letterSpacing: '.14em' }}
                >
                  {exporting ? 'Rendering…' : 'Export PNG'}
                </button>
              </div>
            </div>
            <div
              ref={boxRef}
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              style={{ overflow: 'auto', cursor: 'grab', border: '1px solid rgba(43,35,24,.14)', background: 'var(--ncr-well)', padding: '26px 16px' }}
            >
              {/* Outer box tracks the scaled size so the scroll area shrinks with the zoom. */}
              <div
                style={{
                  width: Math.max(1, Math.round(layout.width * zoom)),
                  height: Math.max(1, Math.round(layout.height * zoom)),
                  margin: '0 auto',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform .07s linear',
                    position: 'relative',
                    width: layout.width,
                    height: layout.height,
                  }}
                >
                  {layout.edges.map((ed, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: ed.left,
                        top: ed.top,
                        width: ed.width,
                        height: 1.5,
                        background: hexA(fam.accent, 0.45),
                        transform: `rotate(${ed.angle}deg)`,
                        transformOrigin: '0 0',
                      }}
                    />
                  ))}
                  {layout.nodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onOpenBrother(n.id)}
                      style={{
                        position: 'absolute',
                        left: n.x,
                        top: n.y,
                        width: n.w,
                        height: n.h,
                        boxSizing: 'border-box',
                        background: n.isRoot ? fam.accent : 'var(--ncr-card-alt)',
                        border: n.isRoot ? `1.5px solid ${fam.accent}` : '1px solid var(--ncr-rule)',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--ncr-serif)',
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: n.isRoot ? '#f4ecda' : 'var(--ncr-ink)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {n.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--ncr-ui)',
                          fontSize: 8.5,
                          letterSpacing: '.08em',
                          textTransform: 'uppercase',
                          color: n.isRoot ? 'rgba(244,236,218,.85)' : 'var(--ncr-muted)',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {n.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {!layout.hasRels && layout.nodes.length > 0 && (
                <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', marginTop: 24, textAlign: 'center' }}>
                  Brothers are on record but not yet connected — set each brother's Big from their record card.
                </div>
              )}
              <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', marginTop: 28, textAlign: 'center' }}>
                The full {fam.name} lineage · {register.length} brothers on record.
              </div>
            </div>
            <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ncr-faint)', marginTop: 10 }}>
              Drag to pan · 0 reset · + / − or ⌘ scroll to zoom
            </div>
          </div>

          {/* Register */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="ncr-label">Full Roster</span>
              <button className="ncr-link-btn ncr-link-btn--crimson" onClick={onAddBrother} style={{ fontSize: 10.5 }}>
                + Add
              </button>
            </div>
            <div style={{ borderTop: `1.5px solid ${fam.accent}` }}>
              {register.map((m) => (
                <button
                  key={m.id}
                  className="ncr-row-btn"
                  onClick={() => onOpenBrother(m.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', borderBottom: '1px solid var(--ncr-rule-faint)' }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      flex: 'none',
                      border: `1px solid ${fam.accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--ncr-serif)',
                      fontSize: 12,
                      color: fam.accent,
                    }}
                  >
                    {m.initials}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--ncr-serif)', fontSize: 16, color: 'var(--ncr-ink)' }}>{m.name}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>{m.role}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)', letterSpacing: '.06em' }}>{m.pledgeClass}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
