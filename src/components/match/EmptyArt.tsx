/** Small decorative illustrations for empty states. Inline SVG, brand tokens only, hidden from assistive tech. */
export type EmptyArtKind = 'search' | 'inbox' | 'doc' | 'deck' | 'chat';

export function EmptyArt({ kind }: { kind: EmptyArtKind }) {
  return (
    <svg className="mi-empty-art" viewBox="0 0 96 72" width="96" height="72" aria-hidden="true" focusable="false">
      <ellipse cx="48" cy="64" rx="34" ry="5" className="mi-art-shadow" />
      {kind === 'search' && (
        <>
          <rect x="14" y="10" width="44" height="44" rx="8" className="mi-art-card" />
          <path d="M22 24h28M22 32h20M22 40h24" className="mi-art-line" />
          <circle cx="62" cy="40" r="13" className="mi-art-lens" />
          <path d="M71 49l10 10" className="mi-art-handle" />
        </>
      )}
      {kind === 'inbox' && (
        <>
          <path d="M16 30l10-18h44l10 18v24a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" className="mi-art-card" />
          <path d="M16 30h18l4 8h20l4-8h18" className="mi-art-line" />
          <circle cx="70" cy="16" r="6" className="mi-art-dot" />
        </>
      )}
      {kind === 'doc' && (
        <>
          <path d="M28 6h28l14 14v38a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z" className="mi-art-card" />
          <path d="M56 6v14h14" className="mi-art-line" />
          <path d="M33 30h28M33 38h22M33 46h26" className="mi-art-line" />
        </>
      )}
      {kind === 'deck' && (
        <>
          <rect x="20" y="14" width="56" height="38" rx="5" className="mi-art-card" />
          <path d="M28 42l10-10 8 6 12-14 10 12" className="mi-art-line" />
          <circle cx="70" cy="18" r="9" className="mi-art-lens" />
          <path d="M70 14v5M70 22v0.5" className="mi-art-handle" />
        </>
      )}
      {kind === 'chat' && (
        <>
          <path d="M14 14h44a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H30l-10 8v-8h-6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" className="mi-art-card" />
          <path d="M40 30h38a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-4v6l-8-6H40a4 4 0 0 1-4-4V34a4 4 0 0 1 4-4z" className="mi-art-dot" />
          <path d="M20 24h28M20 31h18" className="mi-art-line" />
        </>
      )}
    </svg>
  );
}
