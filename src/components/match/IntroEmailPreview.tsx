import type { IntroEmail } from '../../lib/optin';

export function IntroEmailPreview({ email }: { email: IntroEmail }) {
  return (
    <article className="mi-email" aria-label="Anteprima dell’email di presentazione">
      <dl className="mi-email-head">
        <div>
          <dt>Da</dt>
          <dd>{email.da}</dd>
        </div>
        <div>
          <dt>A</dt>
          <dd>{email.a.join(', ')}</dd>
        </div>
        <div>
          <dt>Oggetto</dt>
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
      <p className="mi-email-foot">Anteprima: nessuna email viene inviata. Nomi e indirizzi sono di esempio.</p>
    </article>
  );
}
