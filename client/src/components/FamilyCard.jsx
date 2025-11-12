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
  const { accent, titleColor, cardStyle } = useMemo(() => {
    const theme = getThemeStyles(family.theme);
    const accent = theme?.accent || '#D3AF37';

    const palette = {
      empire: {
        titleColor: '#6d5122',
        background: 'linear-gradient(135deg, rgba(255, 249, 236, 0.94) 0%, rgba(247, 233, 199, 0.92) 100%)',
        border: '1.5px solid rgba(201,168,87,0.55)',
        shadow: '0 16px 32px rgba(98, 72, 28, 0.12)',
        text: '#4a3b25',
      },
      greed: {
        titleColor: '#f1ffe0',
        background: 'linear-gradient(135deg, rgba(16, 76, 46, 0.97) 0%, rgba(9, 53, 33, 0.95) 100%)',
        border: '1.5px solid rgba(244,217,97,0.45)',
        shadow: '0 18px 34px rgba(12, 46, 29, 0.28)',
        text: 'rgba(235, 245, 235, 0.9)',
      },
      power: {
        titleColor: '#f7e7c0',
        background: 'linear-gradient(140deg, rgba(13, 38, 63, 0.97) 0%, rgba(7, 20, 33, 0.96) 100%)',
        border: '1.5px solid rgba(235,210,144,0.45)',
        shadow: '0 18px 34px rgba(9, 24, 40, 0.32)',
        text: 'rgba(247, 235, 206, 0.92)',
      },
      pride: {
        titleColor: '#f1d0a0',
        background: 'linear-gradient(135deg, rgba(48, 34, 22, 0.96) 0%, rgba(36, 22, 12, 0.95) 100%)',
        border: '1.5px solid rgba(212,175,126,0.45)',
        shadow: '0 18px 32px rgba(36, 20, 10, 0.3)',
        text: 'rgba(245, 232, 212, 0.9)',
      },
      wolfpack: {
        titleColor: '#e5edff',
        background: 'linear-gradient(140deg, rgba(54, 76, 115, 0.97) 0%, rgba(40, 56, 86, 0.96) 100%)',
        border: '1.5px solid rgba(109,139,177,0.45)',
        shadow: '0 18px 32px rgba(40, 56, 86, 0.3)',
        text: 'rgba(235, 241, 255, 0.92)',
      },
    };

    const selected = palette[family.theme] || {
      titleColor: accent,
      background: 'rgba(255, 255, 255, 0.9)',
      border: `1.5px solid ${accent}55`,
      shadow: '0 14px 28px rgba(50, 33, 15, 0.12)',
      text: '#4a3b25',
    };

    return { accent, titleColor: selected.titleColor, cardStyle: selected };
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
        background: cardStyle.background,
        border: cardStyle.border,
        borderRadius: '18px',
        padding: 'var(--space-4) var(--space-5)',
        minWidth: '200px',
        boxShadow: cardStyle.shadow,
        transition: 'all var(--motion-fast) var(--ease-standard), opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
        opacity,
        transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        transitionDelay: isLoaded ? `${animationDelay}ms` : '0ms',
      }}
      onMouseEnter={(e) => {
        if (isLoaded) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
        }
        e.currentTarget.style.boxShadow = '0 20px 36px rgba(31, 24, 18, 0.18)';
        e.currentTarget.style.borderColor = `${accent}CC`;
      }}
      onMouseLeave={(e) => {
        if (isLoaded) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }
        e.currentTarget.style.boxShadow = cardStyle.shadow;
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
          color: cardStyle.text,
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

