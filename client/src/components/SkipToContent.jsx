/**
 * SkipToContent Component
 * 
 * Accessibility component for skip-to-content link.
 * Visible when focused for keyboard navigation.
 * 
 * @returns {JSX.Element} Skip-to-content link
 */
const SkipToContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
      onFocus={(e) => {
        e.currentTarget.style.position = 'absolute';
        e.currentTarget.style.width = 'auto';
        e.currentTarget.style.height = 'auto';
        e.currentTarget.style.padding = 'var(--space-4)';
        e.currentTarget.style.margin = 'var(--space-4)';
        e.currentTarget.style.overflow = 'visible';
        e.currentTarget.style.clip = 'auto';
        e.currentTarget.style.whiteSpace = 'normal';
        e.currentTarget.style.backgroundColor = 'var(--primary)';
        e.currentTarget.style.color = 'var(--primary-contrast)';
        e.currentTarget.style.borderRadius = 'var(--radius-lg)';
        e.currentTarget.style.zIndex = 'var(--z-toast)';
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipToContent;

