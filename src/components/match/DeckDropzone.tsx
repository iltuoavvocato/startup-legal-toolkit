import { useState, type DragEvent } from 'react';
import { useI18n } from '../../i18n/context';
import { formatFileSize, MAX_DECK_MB, validateDeck, type DeckMeta } from '../../lib/deck';

interface Props {
  id: string;
  file: DeckMeta | null;
  onChange: (file: DeckMeta | null) => void;
}

/**
 * PDF picker with drag and drop. Only the file's name, type and size are kept:
 * the content is never read, uploaded or turned into a URL.
 */
export function DeckDropzone({ id, file, onChange }: Props) {
  const { locale, t } = useI18n();
  const d = t.match.ui.dropzone;
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (f: File | undefined) => {
    if (!f) return;
    const meta = { name: f.name, type: f.type, size: f.size };
    const problem = validateDeck(meta, locale);
    setError(problem);
    onChange(problem ? null : meta);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  };

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="mi-deck">
      <p className="mi-label" id={`${id}-label`}>
        {d.label} <span className="mi-muted">{d.optional}</span>
      </p>
      {file ? (
        <div className="mi-drop has-file">
          <FileIcon />
          <div className="mi-drop-file">
            <strong>{file.name}</strong>
            <span>{d.kept(formatFileSize(file.size))}</span>
          </div>
          <button type="button" className="btn btn-text btn-sm" onClick={() => onChange(null)}>
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
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
            aria-invalid={error ? true : undefined}
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
        {d.hint(MAX_DECK_MB)}
      </p>
      {error && (
        <p className="mi-error" id={errorId} role="alert">
          {error}
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
