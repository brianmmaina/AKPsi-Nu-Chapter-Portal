const FlameIcon = ({ size = 11 }) => (
  <svg
    width={size}
    height={Math.round(size * 1.3)}
    viewBox="0 0 10 13"
    fill="currentColor"
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path d="M5 0 C5 0 2.5 3 2.5 5.2 C2.5 5.9 2.8 6.5 3.3 6.9 C3.2 6.2 3.4 5.4 3.9 4.9 C3.9 6.1 4.5 7 5.2 7.2 C5 6.4 5.3 5.5 6 5 C6.5 6 6.5 7.1 5.8 7.8 C7.2 7.2 8 5.8 7.5 4.5 C8.5 5.5 9 7 9 8.5 C9 11 7.2 13 5 13 C2.8 13 1 11 1 8.5 C1 6 2.8 3.8 5 0 Z" />
  </svg>
);

export default FlameIcon;
