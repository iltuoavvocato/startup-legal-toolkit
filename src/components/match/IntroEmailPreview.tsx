import { useI18n } from '../../i18n/context';
import type { IntroEmail } from '../../lib/optin';

export function IntroEmailPreview({ email }: { email: IntroEmail }) {
  const { t } = useI18n();
  const e = t.match.ui.email;
  return (
    <article className="mi-email" aria-label={e.aria}>
      <dl className="mi-email-head">
        <div>
          <dt>{e.from}</dt>
          <dd>{email.da}</dd>
        </div>
        <div>
          <dt>{e.to}</dt>
          <dd>{email.a.join(', ')}</dd>
        </div>
        <div>
          <dt>{e.subject}</dt>
          <dd>
            <strong>{email.oggetto}</strong>
          </dd>
        </div>
      </dl>
      <div className="mi-email-body">
        {email.corpo.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <p className="mi-email-foot">{e.foot}</p>
    </article>
  );
}
