import { useState, useCallback } from 'react';
import FamilyCard from './FamilyCard';

/**
 * FamilySelection Component
 * 
 * Displays a grid of family selection cards in a centered 3-2 layout.
 * 
 * @param {Object} props - Component props
 * @param {Array<Object>} props.families - List of all available families
 * @param {Function} props.onSelectFamily - Callback when a family is selected
 * @returns {JSX.Element} Family selection page
 */
const FamilySelection = ({ families, onSelectFamily }) => {
  const [clickedIndex, setClickedIndex] = useState(null);

  const handleClick = useCallback((family, idx) => {
    setClickedIndex(idx);
    setTimeout(() => onSelectFamily(family), 220);
  }, [onSelectFamily]);

  return (
    <div className="relative min-h-screen flex flex-col akpsi-bg" style={{ padding: 'var(--space-4)' }}>
      {/* Large centered AKΨ watermark */}
      <div className="akpsi-watermark" aria-hidden>
        <div className="akpsi-watermark-inner">ΑΚΨ</div>
      </div>
      {/* Subtle repeating pattern overlay */}
      <div className="akpsi-pattern-overlay" aria-hidden />
      
      <div className="relative container max-w-5xl mx-auto flex-1 flex flex-col justify-center" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        {/* Compact Header Section */}
        <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
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

        {/* Centered 3-2 Grid Layout */}
        <div className="flex flex-col items-center" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {/* First Row: 3 families */}
          <div className="flex justify-center items-center" style={{ gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {families.slice(0, 3).map((family, idx) => (
              <FamilyCard
                key={family.id}
                family={family}
                index={idx}
                isClicked={clickedIndex === idx}
                onClick={handleClick}
              />
            ))}
          </div>

          {/* Second Row: 2 families */}
          {families.length > 3 && (
            <div className="flex justify-center items-center" style={{ gap: 'var(--space-4)' }}>
              {families.slice(3).map((family, idx) => {
                const actualIdx = idx + 3;
                return (
                  <FamilyCard
                    key={family.id}
                    family={family}
                    index={actualIdx}
                    isClicked={clickedIndex === actualIdx}
                    onClick={handleClick}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer at bottom of page */}
      <footer className="w-full text-center" style={{ 
        paddingTop: 'var(--space-4)', 
        paddingBottom: 'var(--space-4)',
        borderTop: '1px solid var(--glass-border)',
        marginTop: 'auto',
      }}>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          © {new Date().getFullYear()} Alpha Kappa Psi Nu Chapter
        </p>
      </footer>
    </div>
  );
};

export default FamilySelection;

