const OPTIONS = [
  { value: 'SEMESTER', label: 'This Semester' },
  { value: 'YEAR', label: 'This Year' },
];

const TimeframeSelector = ({ value, onChange, disabled }) => {
  return (
    <div className="points-timeframe-selector" role="group" aria-label="Select points timeframe">
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            className={`points-pill ${isActive ? 'points-pill--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default TimeframeSelector;

