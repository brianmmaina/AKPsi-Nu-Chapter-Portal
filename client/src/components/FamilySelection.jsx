import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { getThemeStyles } from '../themes';

const FamilySelection = ({ families, onSelectFamily }) => {
  const [clickedIndex, setClickedIndex] = useState(null);

  const handleClick = (family, idx) => {
    setClickedIndex(idx);
    setTimeout(() => onSelectFamily(family), 220);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center akpsi-bg" style={{ padding: 'var(--space-6)' }}>
      <Header />
      {/* Large centered AKΨ watermark */}
      <div className="akpsi-watermark akpsi-watermark-top" aria-hidden>
        <div className="akpsi-watermark-inner">ΑΚΨ</div>
      </div>
      {/* Subtle repeating pattern overlay */}
      <div className="akpsi-pattern-overlay" aria-hidden />
      <div className="relative container" style={{ paddingTop: 'var(--space-9)', paddingBottom: 'var(--space-9)' }}>
        {/* Fraternity Seal */}
        <div className="flex justify-center" style={{ marginBottom: 'var(--space-8)' }}>
          <img
            src="/akpsi-seal.png"
            alt="Alpha Kappa Psi Seal"
            className="object-contain"
            style={{
              width: '128px',
              height: '128px',
              aspectRatio: '1/1',
              filter: 'drop-shadow(0 4px 8px var(--akpsi-gold-subtle))',
            }}
            loading="lazy"
          />
        </div>
        <div className="text-center" style={{ marginBottom: 'var(--space-9)' }}>
          <h2
            className="font-normal"
            style={{
              fontSize: 'var(--text-lg)',
              fontFamily: 'var(--font-display)',
              color: 'var(--primary)',
            }}
          >
            Select a Family
          </h2>
          <p
            className="mt-2"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-2)',
            }}
          >
            Explore lineage, classes, and connections.
          </p>
        </div>

        <div className="tiles flex flex-wrap justify-center" style={{ gap: 'var(--space-8)' }}>
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
              className={`tile text-center group fade-zoom ${clickedIndex === idx ? 'click-zoom' : ''} reveal-stagger-${idx+1}`}
              style={{
                backgroundColor: 'var(--akpsi-navy-subtle)',
                border: `2px solid ${accent}99`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-8)',
                width: '28rem',
                maxWidth: '100%',
                backgroundImage,
                backgroundSize,
                boxShadow: 'var(--shadow-md)',
              }}
              aria-label={`Select ${family.name} family`}
            >
              <div className="flex items-center justify-center gap-2" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span
                  className="inline-block rounded-full"
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: accent,
                  }}
                />
                <h3
                  className="font-bold"
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontFamily: 'var(--font-display)',
                    color: titleColor,
                  }}
                >
                  {family.name}
                </h3>
              </div>
              <div
                className="tile-underline mx-auto"
                style={{
                  backgroundColor: accent,
                  width: '70%',
                  height: '3px',
                  opacity: 0.7,
                  borderRadius: 'var(--radius-full)',
                }}
              />
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center"
                style={{
                  transitionDuration: 'var(--motion-med)',
                  marginTop: 'var(--space-3)',
                }}
                aria-hidden
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5l7 7-7 7" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 12h14" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </button>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FamilySelection;

