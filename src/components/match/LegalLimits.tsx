import { useI18n } from '../../i18n/context';
import { Rich } from '../../i18n/Rich';

export function LegalLimits({ headingId }: { headingId: string }) {
  const { t } = useI18n();
  const l = t.match.ui.limits;
  return (
    <div className="mi-limits">
      <h2 id={headingId} className="mi-limits-title">
        {l.title}
      </h2>
      <ul className="mi-limits-list">
        {l.items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}.</strong> {item.text}
          </li>
        ))}
      </ul>
      <p className="mi-limits-more">
        <Rich text={l.more} />
      </p>
    </div>
  );
}
