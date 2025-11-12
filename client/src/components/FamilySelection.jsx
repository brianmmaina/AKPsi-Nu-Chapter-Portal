import { useState, useCallback, useEffect } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger fade-in animation after a brief delay when families are loaded
  useEffect(() => {
    if (families && families.length > 0) {
      // Small delay to ensure smooth transition from login
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [families]);

  const handleClick = useCallback((family, idx) => {
    setClickedIndex(idx);
    setTimeout(() => onSelectFamily(family), 220);
  }, [onSelectFamily]);

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{
        padding: 'var(--space-4)',
        backgroundColor: '#f4ede2',
        backgroundImage:
          'radial-gradient(circle at top, rgba(211,175,55,0.12) 0%, rgba(244,237,226,0) 55%), linear-gradient(135deg, rgba(109,81,34,0.08) 0%, rgba(244,237,226,0) 60%)',
      }}
    >
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
              fontSize: 'calc(var(--text-2xl) * 1.1)',
              fontFamily: 'var(--font-display)',
              color: '#6d5122',
              fontWeight: '700',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-1)',
            }}
          >
            Nu Chapter Archives
          </h1>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontFamily: 'var(--font-display)',
              color: '#9a7d45',
              fontWeight: '500',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}
          >
            Family Tree Collection
          </h2>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'rgba(51, 38, 20, 0.65)',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            Explore preserved lineage ledgers, pledge classes, and mentorship ties of the Alpha Kappa Psi Nu Chapter.
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
                isLoaded={isLoaded}
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
                    isLoaded={isLoaded}
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

