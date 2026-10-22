export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  centerLabel: string;
  centerValue: string;
  ariaLabel: string;
}

/** Hand-rolled SVG donut chart. Values are percentages summing to 100. */
export function Donut({ slices, size = 220, centerLabel, centerValue, ariaLabel }: Props) {
  const stroke = 30;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const visible = slices.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 2 : 0;
  let offset = 0;

  return (
    <svg className="donut" viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-track)" strokeWidth={stroke} />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {visible.map((s) => {
          const len = (s.value / 100) * c;
          const dash = Math.max(0, len - gap);
          const el = (
            <circle
              key={s.label}
              className="donut-slice"
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" className="donut-value">
        {centerValue}
      </text>
      <text x="50%" y="60%" textAnchor="middle" className="donut-label">
        {centerLabel}
      </text>
    </svg>
  );
}
