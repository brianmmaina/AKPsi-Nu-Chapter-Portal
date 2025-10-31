import { getThemeStyles } from '../themes';

const FamilyTabs = ({ families, selectedFamily, setSelectedFamily }) => {
  const accent = getThemeStyles(selectedFamily.theme)?.accent || '#D3AF37';

  return (
    <div className="px-6" style={{ background: 'transparent' }}>
      <div className="flex space-x-4 overflow-x-auto">
        {families.map((family) => (
          <button
            key={family.id}
            onClick={() => setSelectedFamily(family)}
            className="relative px-3 py-3 font-medium transition-colors duration-200 whitespace-nowrap text-slate-300 hover:text-white"
            style={{ fontFamily: "'PT Serif', serif" }}
          >
            <span>{family.name}</span>
            <span
              className="absolute left-0 right-0 -bottom-[2px] mx-auto h-[2px]"
              style={{
                width: selectedFamily.id === family.id ? '100%' : '0%',
                backgroundColor: accent,
                transition: 'width 220ms ease',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FamilyTabs;

