import type { ToolCampaign } from '../site';
import { useI18n } from '../i18n/context';
import { LawyerCta } from './LawyerCta';

interface Props {
  campaign: ToolCampaign;
  title: string;
  text: string;
}

export function CtaPanel({ campaign, title, text }: Props) {
  const { t } = useI18n();
  return (
    <aside className="cta-panel no-print" aria-label={t.common.talkToLawyer}>
      <div>
        <h2 className="cta-panel-title">{title}</h2>
        <p>{text}</p>
      </div>
      <LawyerCta campaign={campaign} />
    </aside>
  );
}
