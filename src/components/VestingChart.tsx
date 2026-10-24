import { useRef, type PointerEvent } from 'react';
import { useElementWidth } from '../hooks/useElementWidth';
import { useI18n } from '../i18n/context';
import { addMonths, vestingSchedule, type VestingParams } from '../lib/vesting';

interface Props {
  params: VestingParams;
  start: Date;
  leaverMonth: number;
  onLeaverChange: (month: number) => void;
}

const TICK_STEPS = [1, 3, 6, 12, 24, 36];

/** SVG step chart of the vested share over time, with cliff and a draggable leaver marker. */
export function VestingChart({ params, start, leaverMonth, onLeaverChange }: Props) {
  const { t, f } = useI18n();
  const c = t.vesting.chart;
  const { percent: formatPercent, monthYear: formatMonthYear } = f;
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const dragging = useRef(false);
  const compact = width < 520;
  const height = compact ? 240 : 300;
  const pad = { top: 34, right: compact ? 16 : 24, bottom: 44, left: compact ? 40 : 48 };
  const w = Math.max(200, width) - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const D = params.durationMonths;
  const x = (m: number) => pad.left + (Math.min(m, D) / D) * w;
  const y = (f: number) => pad.top + (1 - f) * h;

  const schedule = vestingSchedule(params);
  let line = `M ${x(0)} ${y(0)}`;
  for (let i = 1; i < schedule.length; i++) {
    const prev = schedule[i - 1]!;
    const cur = schedule[i]!;
    line += ` H ${x(cur.month)}`;
    if (cur.fraction !== prev.fraction) line += ` V ${y(cur.fraction)}`;
  }
  const area = `${line} V ${y(0)} H ${x(0)} Z`;

  const maxTicks = Math.max(2, Math.floor(w / (compact ? 64 : 84)));
  const step = TICK_STEPS.find((s) => D / s <= maxTicks) ?? 48;
  const ticks: number[] = [];
  for (let m = 0; m <= D; m += step) ticks.push(m);
  if (D - (ticks.at(-1) ?? 0) >= step * 0.6) ticks.push(D);

  const marker = Math.min(leaverMonth, D);
  const markerFraction = schedule[marker]?.fraction ?? 1;
  const mx = x(marker);
  const labelRight = mx < pad.left + w * (compact ? 0.5 : 0.62);
  const cliff = params.cliffMonths;

  const monthFromEvent = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    return Math.round(Math.max(0, Math.min(1, (px - pad.left) / w)) * D);
  };

  return (
    <div ref={wrapRef} className="vesting-chart">
      <svg
        width={Math.max(200, width)}
        height={height}
        role="img"
        aria-label={c.aria(cliff, D, marker, formatPercent(markerFraction * 100))}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onLeaverChange(monthFromEvent(e));
        }}
        onPointerMove={(e) => dragging.current && onLeaverChange(monthFromEvent(e))}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line className="grid-line" x1={pad.left} x2={pad.left + w} y1={y(f)} y2={y(f)} />
            <text className="axis-label" x={pad.left - 8} y={y(f) + 4} textAnchor="end">
              {formatPercent(f * 100, 0)}
            </text>
          </g>
        ))}
        {ticks.map((m) => (
          <g key={m}>
            <line className="tick" x1={x(m)} x2={x(m)} y1={y(0)} y2={y(0) + 5} />
            <text className="axis-label" x={x(m)} y={y(0) + 20} textAnchor={m === 0 ? 'start' : m === D ? 'end' : 'middle'}>
              {formatMonthYear(addMonths(start, m))}
            </text>
          </g>
        ))}
        <path className="vest-area" d={area} />
        <path className="vest-line" d={line} />
        {cliff > 0 && cliff < D && (
          <g>
            <line className="cliff-line" x1={x(cliff)} x2={x(cliff)} y1={pad.top - 6} y2={y(0)} />
            <text className="cliff-label" x={x(cliff) + 6} y={pad.top - 10}>
              {c.cliff(cliff)}
            </text>
          </g>
        )}
        <g className="marker">
          <line x1={mx} x2={mx} y1={pad.top} y2={y(0)} />
          <circle cx={mx} cy={y(markerFraction)} r={7} />
          <text
            className="marker-label"
            x={labelRight ? mx + 12 : mx - 12}
            y={Math.min(y(markerFraction) + (markerFraction > 0.85 ? 24 : -16), y(0) - 10)}
            textAnchor={labelRight ? 'start' : 'end'}
          >
            {compact ? c.markerShort(marker, formatPercent(markerFraction * 100)) : c.markerLong(marker, formatPercent(markerFraction * 100))}
          </text>
        </g>
        <text className="axis-title" x={pad.left + w} y={height - 6} textAnchor="end">
          {compact ? '' : c.drag}
        </text>
      </svg>
    </div>
  );
}
