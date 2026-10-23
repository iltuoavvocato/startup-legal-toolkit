import { useI18n } from '../../i18n/context';
import { AREA_POINTS, FASE_POINTS, LEAD_COVERAGE, SCORE_BANDS, SETTORE_POINTS, WEIGHTS, scoreBand } from '../../lib/matching';

export function ScoreExplainer() {
  const { locale, t, f } = useI18n();
  const x = t.match.ui.explainer;
  return (
    <details className="details mi-explainer">
      <summary>{x.summary}</summary>
      <p>{x.intro}</p>
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
      <p className="small-note">
        {x.bands(SCORE_BANDS.map((b) => x.band(scoreBand(b.min, locale).label, b.min)).join(', '))}
      </p>
    </details>
  );
}
