import { useI18n } from '../../i18n/context';
import { breakdown, type BreakdownRow } from '../../lib/explain';
import { LEAD_COVERAGE, scoreBand, type Evaluation } from '../../lib/matching';
import { AREA_DI, labelsFor, type Investor, type StartupProfile } from '../../lib/matchTaxonomy';

interface Props {
  startup: StartupProfile;
  investor: Investor;
  /** The evaluation already computed by the results page (startup's view); recomputed when missing. */
  evaluation?: Evaluation;
}

/** "Perché questo match?": the points of each part, read from the real evaluation. */
export function MatchBreakdown({ startup, investor, evaluation }: Props) {
  const { locale, t, f } = useI18n();
  const b = t.explain.breakdown;
  const L = labelsFor(locale);
  const x = breakdown(startup, investor, locale, evaluation);
  const { score, eligible } = x.evaluation;
  const pct = f.percent(x.coverage * 100, 0);
  const lead = f.percent(LEAD_COVERAGE * 100, 0);
  const area = L.area[AREA_DI[startup.regione]];

  const why = (r: BreakdownRow): string => {
    switch (r.part) {
      case 'settore': {
        const s = L.settore[startup.settore];
        return r.rule === 'principale'
          ? b.settore.principale(s)
          : r.rule === 'secondario'
            ? b.settore.secondario(s)
            : r.rule === 'generalista'
              ? b.settore.generalista()
              : b.settore.nessuno(s);
      }
      case 'ticket':
        if (!r.passes) return b.ticket.excluded(f.euro(investor.ticketMin), f.euro(startup.round));
        return r.rule === 'pieno' ? b.ticket.pieno(pct, lead) : r.rule === 'parziale' ? b.ticket.parziale(pct, lead) : b.ticket.nessuno();
      case 'fase': {
        const fase = L.fase[startup.fase];
        return r.rule === 'principale' ? b.fase.principale(fase) : r.rule === 'secondario' ? b.fase.secondario(fase) : b.fase.nessuno(fase);
      }
      case 'area':
        return r.rule === 'stessaRegione'
          ? b.area.stessaRegione(L.regione[startup.regione])
          : r.rule === 'area'
            ? b.area.area(area)
            : r.rule === 'italia'
              ? b.area.italia()
              : b.area.nessuno(area);
    }
  };

  return (
    <div className="mi-breakdown">
      <div className="table-scroll" tabIndex={0} role="region" aria-label={b.caption}>
        <table className="data-table mi-table mi-breakdown-table">
          <caption className="sr-only">{b.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{b.head.part}</th>
              <th scope="col">{b.head.points}</th>
              <th scope="col">{b.head.why}</th>
            </tr>
          </thead>
          <tbody>
            {x.rows.map((r) => (
              <tr key={r.part} className={r.passes ? undefined : 'is-out'} data-part={r.part}>
                <th scope="row">{t.match.ui.explainer.rows[r.part]}</th>
                <td>
                  <span className="mi-breakdown-points">{b.points(f.number(r.points, 1), r.max)}</span>
                  <span className="mi-breakdown-bar" aria-hidden="true">
                    <span style={{ width: `${(r.points / r.max) * 100}%` }} />
                  </span>
                </td>
                <td>
                  {why(r)}
                  {!r.passes && <strong className="mi-breakdown-out"> ({b.filterOut})</strong>}
                </td>
              </tr>
            ))}
          </tbody>
          {eligible && (
            <tfoot>
              <tr>
                <th scope="row">{b.total}</th>
                <td colSpan={2} className="mi-breakdown-total">
                  {b.totalValue(score, scoreBand(score, locale).label)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="small-note">{eligible ? b.rounded : b.excluded}</p>
    </div>
  );
}
