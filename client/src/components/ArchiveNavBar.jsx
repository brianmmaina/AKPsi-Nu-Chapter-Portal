import { getThemeStyles } from '../themes';

const ArchiveNavBar = ({
  mode = 'archive',
  selectedFamily = null,
  onBack,
  onBackToHome,
  canGoBack = false,
}) => {
  const isArchiveMode = mode === 'archive';
  const theme = isArchiveMode ? null : getThemeStyles(selectedFamily?.theme);
  const accent = isArchiveMode ? 'var(--archive-accent)' : theme?.accent || '#D3AF37';
  const background = isArchiveMode
    ? 'var(--archive-surface)'
    : 'rgba(255, 255, 255, 0.45)';
  const textColor = isArchiveMode ? 'var(--archive-text)' : '#000000';
  const borderColor = isArchiveMode ? 'var(--archive-border)' : 'rgba(201, 168, 87, 0.15)';

  return (
    <div
      className="archive-nav-bar"
      style={{
        position: 'sticky',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '12px 20px',
        background: 'transparent',
      }}
    >
      <div
        className="archive-nav-bar__container"
        style={{
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          background,
          borderRadius: '18px',
          boxShadow: isArchiveMode 
            ? '0 4px 12px rgba(109, 81, 34, 0.08)' 
            : '0 4px 12px rgba(0, 0, 0, 0.10)',
          border: `1px solid ${borderColor}`,
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div className="archive-nav-bar__left">
          {!isArchiveMode && selectedFamily && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '14px',
                  fontFamily: theme?.titleFont || 'var(--font-display)',
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                {selectedFamily.name}
              </span>
            </div>
          )}
          {isArchiveMode && (
            <span
              style={{
                fontSize: '14px',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: textColor,
              }}
            >
              Information Archive
            </span>
          )}
        </div>
        <div className="archive-nav-bar__right" style={{ display: 'flex', gap: '12px' }}>
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                borderRadius: '18px',
                background: isArchiveMode
                  ? 'var(--archive-bg)'
                  : 'rgba(255, 230, 170, 0.25)',
                border: `1px solid ${borderColor}`,
                color: textColor,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 200ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isArchiveMode
                  ? 'var(--archive-bg-subtle)'
                  : 'rgba(255, 230, 170, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isArchiveMode
                  ? 'var(--archive-bg)'
                  : 'rgba(255, 230, 170, 0.25)';
              }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              borderRadius: '18px',
              background: accent,
              border: 'none',
              color: isArchiveMode ? 'var(--archive-text)' : '#000000',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveNavBar;

