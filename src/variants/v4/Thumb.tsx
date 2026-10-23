// V4 gallery thumbnail: a stacked deck with a tilted top card and the two round action buttons. Decorative.
export function Thumb() {
  return (
    <div className="v4-thumb" aria-hidden="true">
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <defs>
          <linearGradient id="v4-thumb-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eef2fb" />
            <stop offset="1" stopColor="#f8efe0" />
          </linearGradient>
        </defs>
        <rect width="160" height="100" fill="url(#v4-thumb-bg)" />
        <rect x="20" y="8" width="120" height="3" rx="1.5" fill="#d7ddeb" />
        <rect x="20" y="8" width="46" height="3" rx="1.5" fill="#1b2a4e" />
        <rect x="56" y="22" width="52" height="62" rx="7" fill="#fff" stroke="#e1e5ef" transform="translate(4 6) scale(0.98)" />
        <rect x="54" y="20" width="52" height="62" rx="7" fill="#fff" stroke="#e1e5ef" transform="translate(2 3)" />
        <g transform="rotate(-8 80 50)">
          <rect x="52" y="16" width="56" height="64" rx="7" fill="#fff" stroke="#d3d9e8" />
          <circle cx="63" cy="28" r="5" fill="#1b2a4e" />
          <rect x="71" y="24" width="22" height="3.5" rx="1.75" fill="#1b2a4e" />
          <rect x="71" y="30" width="14" height="2.5" rx="1.25" fill="#9aa3ba" />
          <circle cx="97" cy="29" r="6" fill="none" stroke="#e3e8f2" strokeWidth="2.4" />
          <path d="M97 23 a6 6 0 1 1 -5.2 9" fill="none" stroke="#1b7f5a" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="58" y="42" width="44" height="2.5" rx="1.25" fill="#c5cbda" />
          <rect x="58" y="47" width="38" height="2.5" rx="1.25" fill="#c5cbda" />
          <rect x="58" y="55" width="20" height="7" rx="3.5" fill="#e7f4ee" />
          <rect x="80" y="55" width="18" height="7" rx="3.5" fill="#f6efdc" />
          <rect x="58" y="67" width="40" height="2.5" rx="1.25" fill="#dfe3ec" />
          <rect x="88" y="18" width="18" height="7" rx="2" fill="none" stroke="#1b7f5a" strokeWidth="1.4" />
        </g>
        <circle cx="62" cy="91" r="7" fill="#fff" stroke="#c9cfdd" />
        <path d="M59.5 88.5l5 5M64.5 88.5l-5 5" stroke="#b4233c" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="80" cy="91" r="4.5" fill="#fff" stroke="#c9cfdd" />
        <circle cx="98" cy="91" r="7" fill="#1b7f5a" />
        <path d="M95 91.2l2.2 2.2 4-4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
