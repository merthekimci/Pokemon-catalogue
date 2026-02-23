export default function PokeballIcon({ size = 28, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#fff" stroke="#2a2a2a" strokeWidth="4" />
      <path d="M2 50 A48 48 0 0 1 98 50 Z" fill="#EE1515" stroke="#2a2a2a" strokeWidth="4" />
      <rect x="2" y="47" width="96" height="6" fill="#2a2a2a" />
      <circle cx="50" cy="50" r="16" fill="#fff" stroke="#2a2a2a" strokeWidth="4" />
      <circle cx="50" cy="50" r="8" fill="#2a2a2a" />
    </svg>
  );
}
