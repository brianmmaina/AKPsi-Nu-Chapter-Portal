import { useState } from 'react';
import { getThemeStyles } from '../themes';

const FamilySelection = ({ families, onSelectFamily }) => {
  const [clickedIndex, setClickedIndex] = useState(null);

  const handleClick = (family, idx) => {
    setClickedIndex(idx);
    setTimeout(() => onSelectFamily(family), 220);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center akpsi-bg" style={{ padding: 'var(--space-4)' }}>
      {/* Large centered AKΨ watermark */}
      <div className="akpsi-watermark" aria-hidden>
        <div className="akpsi-watermark-inner">ΑΚΨ</div>
      </div>
      {/* Subtle repeating pattern overlay */}
      <div className="akpsi-pattern-overlay" aria-hidden />
      
      <div className="relative container max-w-4xl" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
        {/* Compact Header Section */}
        <div className="text-center" style={{ marginBottom: 'var(--space-6)' }}>
          {/* Fraternity Seal - Smaller */}
          <div className="flex justify-center" style={{ marginBottom: 'var(--space-3)' }}>
            <img
              src="/akpsi-seal.png"
              alt="Alpha Kappa Psi Seal"
              className="object-contain"
              style={{
                width: '80px',
                height: '80px',
                aspectRatio: '1/1',
                filter: 'drop-shadow(0 4px 8px var(--akpsi-gold-subtle))',
              }}
              loading="lazy"
            />
          </div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-display)',
              color: 'var(--primary)',
              fontWeight: 'var(--weight-bold)',
              letterSpacing: 'var(--tracking-wide)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Alpha Kappa Psi
          </h1>
          <h2
            style={{
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-display)',
              color: 'var(--primary)',
              fontWeight: 'var(--weight-normal)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Select a Family
          </h2>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            Explore lineage, classes, and connections
          </p>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-2 gap-4" style={{ 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {families.map((family, idx) => {
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
            return (
            <button
              key={family.id}
              onClick={() => handleClick(family, idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClick(family, idx);
                }
              }}
              tabIndex={0}
              className={`tile text-center group fade-zoom ${clickedIndex === idx ? 'click-zoom' : ''}`}
              style={{
                backgroundColor: 'var(--akpsi-navy-subtle)',
                border: `1.5px solid ${accent}80`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4) var(--space-3)',
                backgroundImage,
                backgroundSize,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--motion-fast) var(--ease-standard)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = `${accent}CC`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
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
          })}
        </div>

        {/* Compact Footer */}
        <div className="text-center" style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--glass-border)' }}>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            © {new Date().getFullYear()} Alpha Kappa Psi Nu Chapter
          </p>
        </div>
      </div>
    </div>
  );
};

export default FamilySelection;

