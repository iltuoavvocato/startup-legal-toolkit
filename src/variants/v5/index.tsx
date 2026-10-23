// Variant V5 "Dark premium": black ilTuoAvvocato style, white/grey text, mono figures, minimal gold.
import './v5.css';

export { Landing } from './Landing';
export { Results } from './Results';
export { Investor } from './Investor';

/** Static decorative miniature for the gallery. */
export function Thumb() {
  return (
    <div className="v5-thumb" aria-hidden="true">
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <rect width="160" height="100" fill="#0B0B0B" />
        <rect x="10" y="10" width="22" height="2" fill="#6f6f6f" />
        <rect x="10" y="17" width="62" height="5" fill="#f2f2f2" />
        <rect x="10" y="25" width="48" height="5" fill="#f2f2f2" />
        <rect x="10" y="35" width="14" height="0.8" fill="#C9A24A" />
        <rect x="10" y="41" width="56" height="1.6" fill="#7a7a7a" />
        <rect x="10" y="45" width="44" height="1.6" fill="#7a7a7a" />
        <rect x="10" y="53" width="22" height="7" fill="#f2f2f2" />
        <rect x="35" y="53" width="22" height="7" fill="none" stroke="#6f6f6f" strokeWidth="0.6" />
        <rect x="88" y="10" width="62" height="52" fill="#141414" stroke="#2a2a2a" strokeWidth="0.6" />
        <circle cx="94" cy="16" r="1.2" fill="#C9A24A" />
        <rect x="98" y="15" width="18" height="2" fill="#6f6f6f" />
        <rect x="94" y="22" width="30" height="3" fill="#f2f2f2" />
        <text x="146" y="34" textAnchor="end" fill="#C9A24A" fontFamily="ui-monospace, monospace" fontSize="12">
          94
        </text>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="94" y={41 + i * 5} width="50" height="1" fill="#2a2a2a" />
            <rect x="94" y={41 + i * 5} width={[50, 36, 40, 22][i]} height="1" fill="#d8d8d8" />
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="10" y={70 + i * 9} width="140" height="0.5" fill="#2a2a2a" />
            <rect x="10" y={73 + i * 9} width="6" height="2" fill="#6f6f6f" />
            <rect x="22" y={72.5 + i * 9} width={[40, 32, 46][i]} height="3" fill={i === 0 ? '#f2f2f2' : '#3a3a3a'} />
            <rect x="140" y={72.5 + i * 9} width="10" height="3" fill={i === 0 ? '#C9A24A' : '#8a8a8a'} />
          </g>
        ))}
      </svg>
    </div>
  );
}
