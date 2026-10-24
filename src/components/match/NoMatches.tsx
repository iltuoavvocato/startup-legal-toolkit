import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import type { Ranked } from '../../lib/matching';
import type { NearMisses } from '../../lib/relax';
import { EmptyArt } from './EmptyArt';

interface Props<T extends { id: string }, P> {
  near: NearMisses<T, P>;
  lead: string;
  nameOf: (item: T) => string;
  /** Explanation of the suggested edit, e.g. "Allargando settori entrano 2 startup." */
  relaxText: string | null;
  relaxLabel: string;
  onRelax: (patched: P) => void;
  onEdit: () => void;
  children?: ReactNode;
}

/** Empty results: why nothing fits, the closest misses, and a one-click edit that widens the criteria. */
export function NoMatches<T extends { id: string }, P>({ near, lead, nameOf, relaxText, relaxLabel, onRelax, onEdit }: Props<T, P>) {
  const { t } = useI18n();
  const x = t.polish.noMatches;
  const { closest, suggestion } = near;
  return (
    <div className="card mi-empty mi-nomatch">
      <EmptyArt kind="search" />
      <div className="mi-nomatch-body">
        <h3 className="mi-nomatch-title">{x.title}</h3>
        <p>{lead}</p>
        {closest.length > 0 && (
          <>
            <h4 className="mi-nomatch-sub">{x.closest}</h4>
            <ul className="mi-nomatch-list">
              {closest.map((r: Ranked<T>) => (
                <li key={r.item.id}>
                  <strong>{nameOf(r.item)}</strong>
                  <ul>
                    {r.evaluation.whyNot.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        )}
        <h4 className="mi-nomatch-sub">{x.relaxTitle}</h4>
        <p>{suggestion && relaxText ? relaxText : x.noRelax}</p>
        <div className="actions mi-nomatch-actions">
          {suggestion && (
            <button type="button" className="btn btn-navy" onClick={() => onRelax(suggestion.patched)}>
              {relaxLabel}
            </button>
          )}
          <button type="button" className={`btn ${suggestion ? 'btn-text' : 'btn-navy'}`} onClick={onEdit}>
            {x.edit}
          </button>
        </div>
      </div>
    </div>
  );
}
