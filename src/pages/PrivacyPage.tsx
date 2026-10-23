import { ExternalLink } from '../components/ExternalLink';
import { PageHero } from '../components/PageHero';
import { useI18n } from '../i18n/context';
import { LAWYER_URL } from '../site';

export function PrivacyPage() {
  const { t } = useI18n();
  const p = t.privacy;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title}>
        <p>{p.lead}</p>
      </PageHero>
      <section className="section section-cream">
        <div className="container">
          <div className="prose">
          <h2>{p.cookiesTitle}</h2>
          <p>{p.cookiesText}</p>
          <h2>{p.storageTitle}</h2>
          <p>{p.storageText}</p>
          <h2>{p.localTitle}</h2>
          <p>{p.localText}</p>
          <p>{p.urlText}</p>
          <h2>{p.linksTitle}</h2>
          <p>
            {p.linksBefore} <ExternalLink href={LAWYER_URL}>iltuoavvocato.com</ExternalLink>
            {p.linksAfter}
          </p>
          <h2>{p.whoTitle}</h2>
          <p>{p.whoText}</p>
          </div>
        </div>
      </section>
    </>
  );
}
