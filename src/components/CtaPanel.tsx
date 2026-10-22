import type { ToolCampaign } from '../site';
import { LawyerCta } from './LawyerCta';

interface Props {
  campaign: ToolCampaign;
  title: string;
  text: string;
}

export function CtaPanel({ campaign, title, text }: Props) {
  return (
    <aside className="cta-panel no-print" aria-label="Parla con un avvocato">
      <div>
        <h2 className="cta-panel-title">{title}</h2>
        <p>{text}</p>
      </div>
      <LawyerCta campaign={campaign} />
    </aside>
  );
}
