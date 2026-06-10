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
        titleColor: '#6d4d1f',
        background: 'linear-gradient(145deg, #fff8e8, #ead9a8)',
        border: '1px solid rgba(186,145,58,0.58)',
        shadow: '0 22px 48px rgba(43,33,24,0.18), 0 4px 12px rgba(43,33,24,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
        text: '#7a5c2a',
      },
      greed: {
        titleColor: '#f3e8bd',
        background: 'linear-gradient(145deg, #145332, #082f1d)',
        border: '1px solid rgba(216,190,94,0.55)',
        shadow: '0 22px 48px rgba(43,33,24,0.22), 0 4px 12px rgba(43,33,24,0.12), inset 0 1px 0 rgba(255,255,255,0.10)',
        text: 'rgba(243,232,189,0.85)',
      },
      power: {
        titleColor: '#efe2bd',
        background: 'linear-gradient(145deg, #10253d, #061523)',
        border: '1px solid rgba(197,167,91,0.52)',
        shadow: '0 22px 48px rgba(43,33,24,0.22), 0 4px 12px rgba(43,33,24,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        text: 'rgba(239,226,189,0.85)',
      },
      pride: {
        titleColor: '#f1dfb8',
        background: 'linear-gradient(145deg, #3a2618, #1f130c)',
        border: '1px solid rgba(193,151,82,0.55)',
        shadow: '0 22px 48px rgba(43,33,24,0.24), 0 4px 12px rgba(43,33,24,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
        text: 'rgba(241,223,184,0.85)',
      },
      wolfpack: {
        titleColor: '#eef4ff',
        background: 'linear-gradient(145deg, #334d73, #172b49)',
        border: '1px solid rgba(213,226,247,0.36)',
        shadow: '0 22px 48px rgba(43,33,24,0.20), 0 4px 12px rgba(43,33,24,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        text: 'rgba(238,244,255,0.85)',
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
        padding: '1.25rem 1.5rem',
        width: '230px',
        minHeight: '104px',
        boxShadow: cardStyle.shadow,
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, opacity var(--motion-med) var(--ease-standard)',
        opacity,
        transform: isLoaded ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        transitionDelay: isLoaded ? `${animationDelay}ms` : '0ms',
      }}
      onMouseEnter={(e) => {
        if (isLoaded) {
          e.currentTarget.style.transform = 'translateY(-6px)';
        }
        e.currentTarget.style.boxShadow = '0 30px 64px rgba(43,33,24,0.24), 0 8px 18px rgba(43,33,24,0.14), inset 0 1px 0 rgba(255,255,255,0.38)';
        e.currentTarget.style.borderColor = `${accent}CC`;
      }}
      onMouseLeave={(e) => {
        if (isLoaded) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
        e.currentTarget.style.boxShadow = cardStyle.shadow;
        e.currentTarget.style.borderColor = '';
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

