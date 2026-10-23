import { formatPercent } from '../../lib/format';
import { AREA_POINTS, FASE_POINTS, LEAD_COVERAGE, SCORE_BANDS, SETTORE_POINTS, WEIGHTS } from '../../lib/matching';

export function ScoreExplainer() {
  return (
    <details className="details mi-explainer">
      <summary>Come calcoliamo l’affinità</summary>
      <p>
        Prima i filtri: compaiono solo gli abbinamenti con fase, settore e area compatibili e con un ticket minimo non
        superiore al round. Poi un punteggio da 0 a 100, somma di quattro parti:
      </p>
      <div className="table-scroll">
        <table className="data-table mi-table">
          <thead>
            <tr>
              <th scope="col">Parte</th>
              <th scope="col">Max</th>
              <th scope="col">Come</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Settore</th>
              <td>{WEIGHTS.settore}</td>
              <td>
                {SETTORE_POINTS.principale} se è il settore principale, {SETTORE_POINTS.secondario} se è tra gli altri,{' '}
                {SETTORE_POINTS.generalista} per un investitore generalista
              </td>
            </tr>
            <tr>
              <th scope="row">Ticket</th>
              <td>{WEIGHTS.ticket}</td>
              <td>
                In proporzione alla parte di round che il ticket massimo può coprire; punteggio pieno da{' '}
                {formatPercent(LEAD_COVERAGE * 100, 0)} in su
              </td>
            </tr>
            <tr>
              <th scope="row">Fase</th>
              <td>{WEIGHTS.fase}</td>
              <td>
                {FASE_POINTS.principale} se è la fase principale, {FASE_POINTS.secondaria} altrimenti
              </td>
            </tr>
            <tr>
              <th scope="row">Area</th>
              <td>{WEIGHTS.area}</td>
              <td>
                {AREA_POINTS.stessaRegione} stessa regione, {AREA_POINTS.area} stessa macro-area, {AREA_POINTS.italia} se
                investe in tutta Italia
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="small-note">
        Fasce: {SCORE_BANDS.map((b) => `${b.label} da ${b.min}`).join(', ')}. A parità di punteggio conta la copertura
        del ticket, poi l’ordine alfabetico. Pesi e soglie sono valori provvisori.
      </p>
    </details>
  );
}
