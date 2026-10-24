import { useId, useState, type ReactNode, type RefObject } from 'react';
import { useI18n } from '../../i18n/context';
import type { StartupForm } from '../../lib/deck';
import { confidenceBand, type DeckFindings, type TractionSignal } from '../../lib/deckExtract';
import {
  acceptAll,
  findingText,
  missingCore,
  reviewRows,
  tally,
  tractionText,
  type Action,
  type Decision,
  type Decisions,
  type FindingKey,
  type ReviewRow,
} from '../../lib/deckSignals';
import { FASI, labelsFor, ONE_LINER_MAX, optionsOf, REGIONI, SETTORI } from '../../lib/matchTaxonomy';
import { EuroField } from './EuroField';
import { EmptyArt } from './EmptyArt';
import { LiveRegion } from './LiveRegion';
import { SelectField } from './SelectField';
import { LockIcon } from './TeaserCard';

interface Props {
  findings: DeckFindings;
  form: StartupForm;
  decisions: Decisions;
  onDecisions: (d: Decisions) => void;
  onBack: () => void;
  onContinue: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
}

/** "Cosa abbiamo trovato nel deck": every finding with its snippet and page; the founder uses, edits or ignores each. */
export function DeckFindingsReview({ findings, form, decisions, onDecisions, onBack, onContinue, headingRef }: Props) {
  const { t } = useI18n();
  const m = t.match.ui.findings;
  const [message, setMessage] = useState('');
  const rows = reviewRows(findings);
  const core = rows.filter((r) => !r.key.startsWith('traction:') && r.key !== 'team');
  const extras = rows.filter((r) => r.key.startsWith('traction:') || r.key === 'team');
  const missing = missingCore(findings);
  const count = tally(findings, decisions);

  const set = (key: FindingKey, d: Decision) => onDecisions({ ...decisions, [key]: d });

  return (
    <div className="card mi-flow-narrow mi-findings">
      <h2 className="card-title mi-step-title" tabIndex={-1} ref={headingRef}>
        {m.title}
      </h2>
      <p>{m.lead}</p>
      <p className="mi-privacy mi-privacy-strong">
        <LockIcon />
        <span>{m.privacy}</span>
      </p>
      <LiveRegion message={message} />

      {rows.length === 0 ? (
        <div className="card mi-empty mi-empty-state mi-findings-empty">
          <EmptyArt kind="deck" />
          <div>
            <h3>{t.polish.deckNoFindings.title}</h3>
            <p>{t.polish.deckNoFindings.text}</p>
            <p className="field-hint">{m.none}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mi-findings-bar">
            <p className="mi-findings-tally">{m.summary(count.used, count.ignored, count.pending)}</p>
            {count.pending > 0 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onDecisions(acceptAll(findings, decisions));
                  setMessage(m.acceptedAll);
                }}
              >
                {m.acceptAll}
              </button>
            )}
          </div>

          {core.length > 0 && (
            <section aria-labelledby="mi-findings-core">
              <h3 className="mi-findings-h" id="mi-findings-core">
                {m.profileTitle}
              </h3>
              <p className="field-hint">{m.profileNote}</p>
              <ul className="mi-findings-list">
                {core.map((r) => (
                  <FindingRow key={r.key} row={r} form={form} decision={decisions[r.key]} onChange={(d) => set(r.key, d)} />
                ))}
              </ul>
            </section>
          )}
          {missing.length > 0 && <p className="field-hint mi-findings-missing">{m.notFound(missing.map((k) => m.labels[k].toLowerCase()).join(', '))}</p>}

          {extras.length > 0 && (
            <section aria-labelledby="mi-findings-extra">
              <h3 className="mi-findings-h" id="mi-findings-extra">
                {m.tractionTitle}
              </h3>
              <p className="field-hint">{m.tractionNote}</p>
              <ul className="mi-findings-list">
                {extras.map((r) => (
                  <FindingRow key={r.key} row={r} form={form} decision={decisions[r.key]} onChange={(d) => set(r.key, d)} />
                ))}
              </ul>
            </section>
          )}
          {count.pending > 0 && <p className="field-hint">{m.pendingNote}</p>}
        </>
      )}

      <div className="mi-form-actions">
        <button type="button" className="btn btn-text" onClick={onBack}>
          <span aria-hidden="true">←</span> {m.back}
        </button>
        <button type="button" className="btn btn-navy" onClick={onContinue}>
          {m.continue} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

interface RowProps {
  row: ReviewRow;
  form: StartupForm;
  decision: Decision | undefined;
  onChange: (d: Decision) => void;
}

function FindingRow({ row, form, decision, onChange }: RowProps) {
  const { locale, t, f } = useI18n();
  const m = t.match.ui.findings;
  const L = labelsFor(locale);
  const id = useId();
  const { key, finding } = row;
  const action: Action = decision?.action ?? 'pending';
  const band = confidenceBand(finding.confidence);
  const isTraction = key.startsWith('traction:');
  const label = isTraction ? m.traction[(finding.value as TractionSignal).kind] : m.labels[key as keyof typeof m.labels];
  const currency = (finding as { currency?: string }).currency;

  // What the founder already typed in the form, when it differs from the deck.
  let formValue: string | null = null;
  if (key === 'settore' && form.settore && form.settore !== finding.value) formValue = L.settore[form.settore as keyof typeof L.settore] ?? null;
  if (key === 'fase' && form.fase && form.fase !== finding.value) formValue = L.fase[form.fase as keyof typeof L.fase] ?? null;
  if (key === 'regione' && form.regione && form.regione !== finding.value) formValue = L.regione[form.regione as keyof typeof L.regione] ?? null;
  if (key === 'round' && form.round && form.round !== finding.value) formValue = f.euro(form.round);
  if (key === 'oneLiner' && form.descrizione.trim()) formValue = form.descrizione.trim();

  const startEdit = (): Decision => {
    const v = finding.value;
    if (isTraction) return { action: 'edit', edited: tractionText(v as TractionSignal, locale) };
    return { action: 'edit', edited: v as string | number };
  };

  const choose = (a: Action) => onChange(a === 'edit' ? (decision?.action === 'edit' ? decision : startEdit()) : { action: a });

  let editor: ReactNode = null;
  if (action === 'edit') {
    const edited = decision?.edited;
    const editLabel = m.editLabel(label);
    if (key === 'settore' || key === 'fase' || key === 'regione') {
      const options = key === 'settore' ? optionsOf(SETTORI, L.settore) : key === 'fase' ? optionsOf(FASI, L.fase) : optionsOf(REGIONI, L.regione);
      editor = (
        <SelectField id={`${id}-edit`} label={editLabel} value={String(edited ?? '')} options={options} onChange={(v) => onChange({ action: 'edit', edited: v })} />
      );
    } else if (key === 'round') {
      editor = (
        <EuroField
          id={`${id}-edit`}
          label={editLabel}
          value={typeof edited === 'number' ? edited : null}
          onChange={(v) => onChange({ action: 'edit', edited: v })}
        />
      );
    } else if (key === 'team') {
      editor = (
        <div className="field mi-field">
          <label htmlFor={`${id}-edit`}>{editLabel}</label>
          <input
            id={`${id}-edit`}
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            value={typeof edited === 'number' ? edited : ''}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value));
              onChange({ action: 'edit', edited: e.target.value === '' || !Number.isFinite(n) ? null : Math.max(0, n) });
            }}
          />
        </div>
      );
    } else {
      editor = (
        <div className="field mi-field">
          <label htmlFor={`${id}-edit`}>{editLabel}</label>
          <input
            id={`${id}-edit`}
            type="text"
            maxLength={key === 'oneLiner' ? ONE_LINER_MAX : 80}
            value={typeof edited === 'string' ? edited : ''}
            aria-describedby={key === 'oneLiner' ? `${id}-edit-hint` : undefined}
            onChange={(e) => onChange({ action: 'edit', edited: e.target.value })}
          />
          {key === 'oneLiner' && (
            <p className="field-hint" id={`${id}-edit-hint`}>
              {m.taglineHint}
            </p>
          )}
        </div>
      );
    }
  }

  const actions: Exclude<Action, 'pending'>[] = ['accept', 'edit', 'ignore'];
  return (
    <li className={`mi-finding is-${action}`}>
      <div className="mi-finding-head">
        <p className="mi-finding-label" id={`${id}-label`}>
          {label}
        </p>
        <span className={`mi-conf is-${band}`}>{m.confidence[band]}</span>
      </div>
      <p className="mi-finding-value">{findingText(key, finding, locale)}</p>
      <figure className="mi-finding-quote">
        <blockquote>
          <p>“{finding.snippet}”</p>
        </blockquote>
        <figcaption>{m.quote(finding.page)}</figcaption>
      </figure>
      {currency && <p className="mi-finding-warn">{m.currency(currency)}</p>}
      {formValue && <p className="field-hint">{m.formSays(formValue)}</p>}
      {key === 'oneLiner' && action !== 'edit' && <p className="field-hint">{m.taglineHint}</p>}
      <fieldset className="mi-finding-actions">
        <legend className="sr-only">{m.actionsLegend(label)}</legend>
        <div className="segmented">
          {actions.map((a) => (
            <label key={a} className={action === a ? 'is-checked' : undefined}>
              <input type="radio" name={`${id}-action`} value={a} checked={action === a} onChange={() => choose(a)} />
              {m.actions[a]}
            </label>
          ))}
        </div>
      </fieldset>
      {editor}
    </li>
  );
}
