/** Decorative preview of the tools (hidden from assistive tech, desktop only). */
export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hv-card hv-equity">
        <p className="hv-title">Ripartizione quote</p>
        <div className="hv-row">
          <svg viewBox="0 0 100 100" width="96" height="96">
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(245,242,234,0.12)" strokeWidth="14" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#C9A45C" strokeWidth="14" strokeDasharray="105 134" transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#E2C88E" strokeWidth="14" strokeDasharray="82 157" strokeDashoffset="-107" transform="rotate(-90 50 50)" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#7F95C4" strokeWidth="14" strokeDasharray="46 193" strokeDashoffset="-191" transform="rotate(-90 50 50)" />
          </svg>
          <ul className="hv-legend">
            <li><span style={{ background: '#C9A45C' }} />Founder 1</li>
            <li><span style={{ background: '#E2C88E' }} />Founder 2</li>
            <li><span style={{ background: '#7F95C4' }} />Founder 3</li>
          </ul>
        </div>
      </div>
      <div className="hv-card hv-vesting">
        <p className="hv-title">Vesting · 48 mesi, cliff 12</p>
        <svg viewBox="0 0 240 80" width="100%" height="80" preserveAspectRatio="none">
          <path d="M0 76 H60 V57 H80 V51 H100 V44 H120 V38 H140 V32 H160 V25 H180 V19 H200 V13 H220 V6 H240" fill="none" stroke="#E2C88E" strokeWidth="2" />
          <line x1="60" x2="60" y1="0" y2="80" stroke="rgba(226,200,142,0.5)" strokeDasharray="3 3" />
        </svg>
      </div>
      <div className="hv-card hv-quiz">
        <p className="hv-title">La tua checklist</p>
        <ul className="hv-checks">
          <li><span className="hv-dot" />Patti tra fondatori<em>Prioritario</em></li>
          <li><span className="hv-dot" />Clausole di vesting<em>Prioritario</em></li>
          <li><span className="hv-dot hv-dot-soft" />Cessione IP<em className="soft">Consigliato</em></li>
        </ul>
      </div>
    </div>
  );
}
