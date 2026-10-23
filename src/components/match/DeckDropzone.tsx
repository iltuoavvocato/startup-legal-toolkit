import { useState, type DragEvent } from 'react';
import { useI18n } from '../../i18n/context';
import { formatFileSize, MAX_DECK_MB, validateDeck, type DeckMeta } from '../../lib/deck';
import { countFindings } from '../../lib/deckExtract';
import { MAX_DECK_PAGES } from '../../lib/pdfText';
import { LockIcon } from './TeaserCard';
import type { DeckReadState } from './useDeckReader';

interface Props {
  id: string;
  file: DeckMeta | null;
  read: DeckReadState;
  onPick: (file: File) => void;
  onRemove: () => void;
}

/**
 * PDF picker with drag and drop and a fictional sample deck. The file is read on the device by the parent
 * (useDeckReader): it is never uploaded or turned into a URL.
 */
export function DeckDropzone({ id, file, read, onPick, onRemove }: Props) {
  const { locale, t } = useI18n();
  const d = t.match.ui.dropzone;
  const errs = t.match.deck;
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const accept = (f: File | undefined) => {
    if (!f) return;
    const problem = validateDeck({ name: f.name, type: f.type, size: f.size }, locale);
    setError(problem);
    if (!problem) onPick(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  // Same-origin static asset, bundled with the site; it is read locally like any picked file.
  const trySample = async () => {
    setLoadingSample(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}demo/${d.sampleFile}`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      accept(new File([blob], d.sampleFile, { type: 'application/pdf' }));
    } catch {
      setError(d.sampleError);
    } finally {
      setLoadingSample(false);
    }
  };

  const readError =
    read.status === 'error'
      ? read.code === 'tooManyPages'
        ? errs.readErrors.tooManyPages(read.pages ?? 0, MAX_DECK_PAGES)
        : errs.readErrors[read.code]
      : null;
  const shown = error ?? readError;
  const showFile = file && read.status !== 'error' && !error;

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const status =
    read.status === 'loading'
      ? d.loading
      : read.status === 'reading'
        ? d.reading(read.page, read.total)
        : read.status === 'ready'
          ? d.read(read.pages, countFindings(read.findings))
          : '';

  return (
    <div className="mi-deck">
      <p className="mi-label" id={`${id}-label`}>
        {d.label} <span className="mi-muted">{d.optional}</span>
      </p>
      <p className="mi-privacy">
        <LockIcon />
        <span>{d.privacy}</span>
      </p>
      {showFile ? (
        <div className={`mi-drop has-file${read.status === 'ready' ? ' is-read' : ''}`}>
          <FileIcon />
          <div className="mi-drop-file">
            <strong>{file.name}</strong>
            <span>{d.kept(formatFileSize(file.size))}</span>
            <span className="mi-drop-status" role="status">
              {status}
            </span>
            {read.status === 'reading' && (
              <span className="mi-drop-progress" aria-hidden="true">
                <span style={{ width: `${Math.round((read.page / read.total) * 100)}%` }} />
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-text btn-sm"
            onClick={() => {
              setError(null);
              onRemove();
            }}
          >
            {d.remove}
            <span className="sr-only">{d.removeSr(file.name)}</span>
          </button>
        </div>
      ) : (
        <div
          className={`mi-drop ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            id={id}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            aria-labelledby={`${id}-label ${id}-cta`}
            aria-describedby={`${hintId}${shown ? ` ${errorId}` : ''}`}
            aria-invalid={shown ? true : undefined}
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <label htmlFor={id} className="mi-drop-label">
            <FileIcon />
            <span className="mi-drop-text">
              <strong className="mi-drop-drag">{d.drag}</strong>
              <span id={`${id}-cta`}>
                <span className="mi-drop-or">{d.or}</span>
                <span className="mi-drop-pick">{d.pick}</span>
              </span>
            </span>
          </label>
        </div>
      )}
      <p className="field-hint" id={hintId}>
        {d.hint(MAX_DECK_MB, MAX_DECK_PAGES)}
      </p>
      {shown && (
        <div className="mi-error" id={errorId} role="alert">
          <p>{shown}</p>
          {readError && <p className="mi-error-fallback">{errs.fallback}</p>}
        </div>
      )}
      {!showFile && (
        <p className="mi-sample">
          <button type="button" className="btn btn-outline btn-sm" onClick={trySample} disabled={loadingSample}>
            {d.sample}
          </button>
          <span className="field-hint">{d.sampleHint}</span>
        </p>
      )}
    </div>
  );
}

function FileIcon() {
  return (
    <svg className="mi-drop-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M9 3.5h10l6 6v19H9z" />
      <path d="M19 3.5v6h6" />
      <path d="M13 17h8M13 21h8M13 25h5" strokeLinecap="round" />
    </svg>
  );
}
