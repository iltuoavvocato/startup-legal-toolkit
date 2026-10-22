const common = {
  viewBox: '0 0 32 32',
  width: 32,
  height: 32,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function PieIcon() {
  return (
    <svg {...common}>
      <path d="M16 4a12 12 0 1 0 12 12H16z" />
      <path d="M19 2.5v10.5h10.5A10.5 10.5 0 0 0 19 2.5z" />
    </svg>
  );
}

export function TimelineIcon() {
  return (
    <svg {...common}>
      <path d="M4 26h24" />
      <path d="M5 23h5v-5h5v-5h5v-5h7" />
      <path d="M10 18v8M10 4v2" strokeDasharray="2 2.5" />
    </svg>
  );
}

export function ChecklistIcon() {
  return (
    <svg {...common}>
      <rect x="5" y="4" width="22" height="24" rx="3" />
      <path d="M10 11l2 2 3.5-4M10 19l2 2 3.5-4M19 11.5h4M19 19.5h4" />
    </svg>
  );
}
