import { useMemo } from 'react';
import { getThemeStyles } from '../themes';

/**
 * FamilyCard Component
 * 
 * Reusable card component for displaying a family in the selection grid.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.family - Family object with id, name, and theme
 * @param {number} props.index - Index of the family (for animation)
 * @param {boolean} props.isClicked - Whether this card was recently clicked
 * @param {Function} props.onClick - Click handler function
 * @param {boolean} props.isLoaded - Whether families have loaded (for fade-in animation)
 * @returns {JSX.Element} Family selection card
 */
const FamilyCard = ({ family, index, isClicked, onClick, isLoaded = false }) => {
  const { accent, titleColor, backgroundImage, backgroundSize } = useMemo(() => {
    const theme = getThemeStyles(family.theme);
    const accent = theme?.accent || '#D3AF37';
    const titleColor = family.theme === 'wolfpack' ? '#ffffff' : accent;
    
    // Subtle per-family patterns (preserve family identity)
    let backgroundImage = undefined;
    let backgroundSize = undefined;
    switch (family.theme) {
      case 'power':
        backgroundImage = `repeating-linear-gradient(60deg, ${accent}0D 0 1px, transparent 1px 12px), repeating-linear-gradient(-60deg, ${accent}0D 0 1px, transparent 1px 12px)`;
        backgroundSize = 'auto';
        break;
      case 'empire':
        backgroundImage = `radial-gradient(circle at 1px 1px, ${accent}0D 1px, transparent 1px)`;
        backgroundSize = '14px 14px';
        break;
      case 'greed':
        backgroundImage = `repeating-linear-gradient(45deg, ${accent}0A 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, ${accent}08 0 1px, transparent 1px 8px)`;
        backgroundSize = 'auto';
        break;
      case 'wolfpack':
        backgroundImage = `repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 12px)`;
        backgroundSize = 'auto';
        break;
      case 'pride':
        backgroundImage = `radial-gradient(circle at 1px 1px, ${accent}0D 1px, transparent 1px)`;
        backgroundSize = '18px 18px';
        break;
      default:
        break;
    }
    
    return { accent, titleColor, backgroundImage, backgroundSize };
  }, [family.theme]);

  // Calculate animation delay based on index (staggered fade-in)
  const animationDelay = isLoaded ? index * 100 : 0; // 100ms delay per card
  const opacity = isLoaded ? 1 : 0;

  return (
    <button
      onClick={() => onClick(family, index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(family, index);
        }
      }}
      tabIndex={0}
      className={`tile text-center group ${isClicked ? 'click-zoom' : ''}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        border: `1.5px solid ${accent}55`,
        borderRadius: '18px',
        padding: 'var(--space-4) var(--space-5)',
        minWidth: '200px',
        backgroundImage,
        backgroundSize,
        boxShadow: '0 14px 28px rgba(50, 33, 15, 0.08)',
        transition: 'all var(--motion-fast) var(--ease-standard), opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
        opacity,
        transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        transitionDelay: isLoaded ? `${animationDelay}ms` : '0ms',
      }}
      onMouseEnter={(e) => {
        if (isLoaded) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
        }
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = `${accent}CC`;
      }}
      onMouseLeave={(e) => {
        if (isLoaded) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = `${accent}80`;
      }}
      aria-label={`Select ${family.name} family`}
    >
      <div className="flex items-center justify-center gap-1.5" style={{ gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
        <span
          className="inline-block rounded-full"
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: accent,
          }}
        />
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-bold)',
            color: titleColor,
            letterSpacing: '0.5px',
          }}
        >
          {family.name}
        </h3>
      </div>
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'rgba(51, 38, 20, 0.6)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-3)',
        }}
      >
        Family Records
      </p>
      <div
        className="tile-underline mx-auto"
        style={{
          backgroundColor: accent,
          width: '60%',
          height: '2px',
          opacity: 0.6,
          borderRadius: 'var(--radius-full)',
        }}
      />
    </button>
  );
};

export default FamilyCard;

