import { memo } from 'react';
import { hexToRgba } from '../utils/color';

const PledgeClassMarkers = ({
  markers = [],
  projectPosition,
  headerHeight = 136,
  bottomBuffer = 4,
  highlightedLevel,
  hoveredLevel,
  onHover,
  onHoverEnd,
  onToggle,
  theme,
}) => {
  if (!markers.length) {
    return null;
  }

  const markerAccent = theme?.pledgeMarkerAccent || theme?.accent || '#d9b87b';
  const markerAccentEnd = theme?.pledgeMarkerAccentEnd || markerAccent;
  const markerText = theme?.pledgeMarkerText || theme?.nodeText || '#3d3526';
  const labelBg = theme?.pledgeMarkerLabelBg || 'rgba(255,255,255,0.35)';
  const labelBorder = theme?.pledgeMarkerLabelBorder || 'rgba(255,255,255,0.55)';
  const labelShadow = theme?.pledgeMarkerShadow || '0 6px 16px rgba(0,0,0,0.18)';
  const yearText = theme?.pledgeMarkerYearText || hexToRgba(markerText, 0.8);

  return (
    <div
      className="tree-pledge-markers"
      style={{
        left: 0,
        top: 0,
        width: '90px',
        height: '100%',
        paddingTop: `calc(${headerHeight}px + env(safe-area-inset-top, 0px))`,
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomBuffer}px)`,
      }}
    >
      {markers.map((marker) => {
        const projected = projectPosition(marker.y);
        const screenY = projected?.y ?? 0;
        const isHighlighted = highlightedLevel === marker.level;
        const isHovered = hoveredLevel === marker.level;

        return (
          <div
            key={`pledge-marker-${marker.level}`}
            className="marker-interactive"
            style={{
              position: 'absolute',
              left: 0,
              top: `${screenY}px`,
              width: '100%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={() => onHover?.(marker.level)}
            onMouseLeave={() => onHoverEnd?.()}
            onClick={() => onToggle?.(marker.level)}
          >
            <div
              style={{
                width: '4px',
                height: '24px',
                background: isHovered || isHighlighted
                  ? `linear-gradient(to bottom, ${markerAccent}, ${markerAccentEnd})`
                  : `linear-gradient(to bottom, ${hexToRgba(markerAccent, 0.8)}, ${hexToRgba(markerAccentEnd, 0.8)})`,
                borderRadius: '2px',
                transition: 'all 0.2s ease',
                opacity: isHovered || isHighlighted ? 1 : 0.85,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '16px',
                background: labelBg,
                border: `1px solid ${labelBorder}`,
                borderRadius: '6px',
                padding: '6px 10px',
                boxShadow: labelShadow,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: markerText,
                fontSize: '10px',
                fontWeight: 600,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                maxWidth: '220px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'all 0.2s ease',
                opacity: isHovered || isHighlighted ? 1 : 0.88,
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                cursor: 'pointer',
              }}
            >
              <div>{marker.label}</div>
              {marker.yearLabel && (
                <div style={{ fontSize: '9px', color: yearText, marginTop: '2px' }}>
                  {marker.yearLabel}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(PledgeClassMarkers);

