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
    <div className="relative min-h-screen flex flex-col items-center p-6 royal-bg">
      <Header />
      {/* Large centered AKΨ watermark */}
      <div className="watermark watermark-top" aria-hidden>
        <div className="watermark-inner">ΑΚΨ</div>
      </div>
      {/* Subtle repeating pattern overlay */}
      <div className="pattern-overlay" aria-hidden />
      <div
        className="relative rounded-sm p-12 w-full max-w-[1200px]"
        style={{ backgroundColor: 'transparent' }}
      >
        {/* Fraternity Seal */}
        <div className="flex justify-center mb-8">
          <img
            src="/akpsi-seal.png"
            alt="Alpha Kappa Psi Seal"
            className="w-32 h-32 object-contain shadow-lg"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(211, 175, 55, 0.3))' }}
          />
        </div>
        <div className="text-center mb-10">
          <h2 className="text-lg font-normal" style={{ color: '#D3AF37' }}>
            Select a Family
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Explore lineage, classes, and connections.
          </p>
        </div>

        <div className="tiles flex flex-wrap justify-center gap-8">
          {families.map((family, idx) => {
            const theme = getThemeStyles(family.theme);
            const accent = theme?.accent || '#D3AF37';
            const titleColor = family.theme === 'wolfpack' ? '#ffffff' : accent;
            // Subtle per-family patterns
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
              className={`tile p-8 rounded-md transition-all duration-200 text-center group w-[28rem] fade-zoom ${clickedIndex === idx ? 'click-zoom' : ''} fade-stagger-${idx+1}`}
              style={{
                backgroundColor: '#002244',
                border: `2px solid ${accent}99`,
                boxShadow: '0 10px 24px rgba(0,0,0,0.35)'
                , backgroundImage, backgroundSize
              }}
              aria-label={`Select ${family.name} family`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
                <h3 className="text-xl font-bold" style={{ fontFamily: "'PT Serif', serif", color: titleColor }}>
                {family.name}
                </h3>
              </div>
              <div className="tile-underline h-[3px] mx-auto" style={{ backgroundColor: accent, width: '70%', opacity: 0.7 }}></div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-3 flex justify-center" aria-hidden>
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

