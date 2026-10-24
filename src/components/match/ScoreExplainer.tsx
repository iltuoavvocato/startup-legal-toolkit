import { useI18n } from '../../i18n/context';
import { bandList } from '../../lib/explain';
import { AREA_POINTS, FASE_POINTS, LEAD_COVERAGE, SETTORE_POINTS, WEIGHTS } from '../../lib/matching';

/** The scoring table, generated from the constants in matching.ts (results pages and "Come funziona il matching"). */
export function ScoreRulesTable() {
  const { t, f } = useI18n();
  const x = t.match.ui.explainer;
  return (
    <div className="table-scroll">
      <table className="data-table mi-table">
        <thead>
          <tr>
            <th scope="col">{x.head.part}</th>
            <th scope="col">{x.head.max}</th>
            <th scope="col">{x.head.how}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{x.rows.settore}</th>
            <td>{WEIGHTS.settore}</td>
            <td>{x.settore(SETTORE_POINTS.principale, SETTORE_POINTS.secondario, SETTORE_POINTS.generalista)}</td>
          </tr>
          <tr>
            <th scope="row">{x.rows.ticket}</th>
            <td>{WEIGHTS.ticket}</td>
            <td>{x.ticket(f.percent(LEAD_COVERAGE * 100, 0))}</td>
          </tr>
          <tr>
            <th scope="row">{x.rows.fase}</th>
            <td>{WEIGHTS.fase}</td>
            <td>{x.fase(FASE_POINTS.principale, FASE_POINTS.secondaria)}</td>
          </tr>
          <tr>
            <th scope="row">{x.rows.area}</th>
            <td>{WEIGHTS.area}</td>
            <td>{x.area(AREA_POINTS.stessaRegione, AREA_POINTS.area, AREA_POINTS.italia)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ScoreExplainer() {
  const { locale, t } = useI18n();
  const x = t.match.ui.explainer;
  const bands = bandList(locale);
  return (
    <details className="details mi-explainer">
      <summary>{x.summary}</summary>
      <p>{x.intro}</p>
      <ScoreRulesTable />
      <p className="small-note">{x.bands(bands)}</p>
    </details>
  );
}
