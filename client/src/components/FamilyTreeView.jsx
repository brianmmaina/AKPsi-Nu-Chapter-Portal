import { useState, useEffect } from 'react';
import FamilyTabs from './FamilyTabs';
import TreeVisualization from './TreeVisualization';

const FamilyTreeView = ({ families, selectedFamily: initialSelectedFamily, onChangeFamily, onToast }) => {
  const [selectedFamily, setSelectedFamily] = useState(initialSelectedFamily || families[0] || null);

  useEffect(() => {
    if (initialSelectedFamily) {
      setSelectedFamily(initialSelectedFamily);
    }
  }, [initialSelectedFamily]);

  if (!selectedFamily) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div>No families found. Please initialize the database.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen royal-bg">
      {/* Glassmorphism Header */}
      <div className="glass-panel sticky top-0 z-sticky">
        <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          <div className="flex items-center justify-between">
            {/* Left: Family name with crest */}
            <div className="flex items-center" style={{ gap: 'var(--space-4)' }}>
              <div className="family-crest active">
                {selectedFamily.name.charAt(0)}
              </div>
              <div>
                <h1
                  className="font-bold"
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontFamily: 'var(--font-display)',
                    color: 'var(--primary)',
                    letterSpacing: 'var(--tracking-wide)',
                  }}
                >
                  {selectedFamily.name}
                </h1>
                <p
                  className="mt-0.5"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  Family Tree
                </p>
              </div>
            </div>

            {/* Right: Change Family button */}
            <button
              onClick={onChangeFamily}
              className="btn btn-glass"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--text-sm)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Change Family
            </button>
          </div>
        </div>
      </div>

      {/* Family Tabs Navigation */}
      <FamilyTabs
        families={families}
        selectedFamily={selectedFamily}
        setSelectedFamily={setSelectedFamily}
      />
      
      <TreeVisualization family={selectedFamily} onToast={onToast} onChangeFamily={onChangeFamily} />
    </div>
  );
};

export default FamilyTreeView;

