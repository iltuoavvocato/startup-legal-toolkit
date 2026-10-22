import { useCopy } from '../hooks/useCopy';

interface Props {
  label: string;
  getText: () => string;
}

export function CopyButton({ label, getText }: Props) {
  const [state, copy] = useCopy();
  return (
    <>
      <button type="button" className="btn btn-outline" onClick={() => copy(getText())}>
        <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
          {state === 'copied' ? (
            <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="6.5" y="6.5" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13.5 4.5v-.5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 4v7A1.5 1.5 0 0 0 5 12.5h.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </>
          )}
        </svg>
        {state === 'copied' ? 'Copiato!' : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'copied' ? 'Testo copiato negli appunti.' : state === 'error' ? 'Copia non riuscita: seleziona e copia il testo manualmente.' : ''}
      </span>
    </>
  );
}
