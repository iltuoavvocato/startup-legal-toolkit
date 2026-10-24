// V2 Dashboard: static decorative thumbnail (sidebar, KPI strip, table rows with stacked score bars).
const ROWS = [
  [30, 30, 20, 14],
  [30, 22, 20, 8],
  [20, 30, 12, 8],
  [20, 18, 20, 8],
  [15, 24, 12, 8],
  [20, 12, 12, 8],
];
const COLORS = ['#1e3a8a', '#3b82f6', '#0f766e', '#b45309'];

export function Thumb() {
  return (
    <svg
      className="v2-thumb"
      width="100%"
      height="100%"
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="320" height="200" fill="#f4f6f9" />
      <rect width="320" height="16" fill="#0f1b33" />
      <rect x="8" y="6" width="40" height="4" rx="2" fill="#93a4c3" />
      <rect x="8" y="24" width="70" height="168" rx="4" fill="#fff" stroke="#d6dbe3" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x="15" y={36 + i * 14} width="6" height="6" rx="1.5" fill={i % 2 ? '#fff' : '#1e3a8a'} stroke="#1e3a8a" />
          <rect x="25" y={37.5 + i * 14} width={34 - (i % 3) * 6} height="3" rx="1.5" fill="#9aa5b5" />
        </g>
      ))}
      <rect x="15" y="130" width="56" height="3" rx="1.5" fill="#d6dbe3" />
      <rect x="15" y="130" width="30" height="3" rx="1.5" fill="#1e3a8a" />
      <circle cx="45" cy="131.5" r="4" fill="#fff" stroke="#1e3a8a" strokeWidth="1.5" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={86 + i * 57} y="24" width="51" height="30" rx="4" fill="#fff" stroke="#d6dbe3" />
          <rect x={92 + i * 57} y="30" width="26" height="3" rx="1.5" fill="#9aa5b5" />
          <rect x={92 + i * 57} y="38" width="18" height="9" rx="1.5" fill="#0f1b33" />
        </g>
      ))}
      <rect x="86" y="62" width="226" height="130" rx="4" fill="#fff" stroke="#d6dbe3" />
      <rect x="86" y="62" width="226" height="14" fill="#eef1f5" />
      {ROWS.map((parts, i) => {
        const y = 82 + i * 18;
        let x = 196;
        return (
          <g key={i}>
            {i === 1 && <rect x="87" y={y - 4} width="224" height="17" fill="#e8eefc" />}
            <rect x="93" y={y + 2} width="8" height="4" rx="1" fill="#9aa5b5" />
            <rect x="108" y={y + 2} width={44 - (i % 3) * 7} height="4" rx="2" fill="#2b3445" />
            <rect x="160" y={y + 2} width="26" height="4" rx="2" fill="#c3cad5" />
            {parts.map((p, j) => {
              const w = p * 0.7;
              const el = <rect key={j} x={x} y={y + 1} width={w} height="6" fill={COLORS[j]} />;
              x += w;
              return el;
            })}
            <rect x="276" y={y} width="28" height="8" rx="4" fill={i < 2 ? '#1e3a8a' : '#fff'} stroke="#1e3a8a" />
          </g>
        );
      })}
    </svg>
  );
}
