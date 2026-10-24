import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { exportQuery, type DocKind } from '../../lib/exportDoc';

interface Props {
  kind: DocKind;
  /** A name the user typed in the form: passed as router state only (never stored or put in the URL). */
  name?: string | null;
  /** A fictional demo investor's thesis sheet. */
  investorId?: string;
  className?: string;
}

/** Link to the local export page (one-pager or thesis sheet, A4 print / PDF, Markdown). */
export function ExportLink({ kind, name, investorId, className = 'btn btn-outline btn-sm' }: Props) {
  const { locale, t, path } = useI18n();
  const E = t.exportDoc.entry;
  const label = investorId ? E.demoInvestor : E[kind];
  return (
    <Link
      to={{ pathname: path('matchExport'), search: exportQuery(kind, locale, investorId) }}
      state={name?.trim() ? { name: name.trim() } : undefined}
      className={`${className} mi-export-link`}
      title={E.hint}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
        <path d="M5 2.5h7l3.5 3.5v11.5H5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {label}
    </Link>
  );
}
