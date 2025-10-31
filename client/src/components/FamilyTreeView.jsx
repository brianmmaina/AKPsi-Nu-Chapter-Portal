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
      <div className="flex items-center justify-between px-6 pt-6 max-w-[1200px] mx-auto">
        <div className="text-lg font-semibold" style={{ color: '#D3AF37', fontFamily: "'PT Serif', serif" }}>
          {selectedFamily.name}
        </div>
        <button
          onClick={onChangeFamily}
          className="text-sm px-3 py-1 rounded border transition-colors"
          style={{ borderColor: 'rgba(211,175,55,0.6)', color: '#D3AF37' }}
        >
          Change Family
        </button>
      </div>
      <FamilyTabs
        families={families}
        selectedFamily={selectedFamily}
        setSelectedFamily={setSelectedFamily}
      />
      <TreeVisualization family={selectedFamily} onToast={onToast} />
    </div>
  );
};

export default FamilyTreeView;

