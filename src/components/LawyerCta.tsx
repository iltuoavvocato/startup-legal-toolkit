import { useI18n } from '../i18n/context';
import { lawyerUrl, type ToolCampaign } from '../site';
import { ExternalLink } from './ExternalLink';

interface Props {
  campaign: ToolCampaign;
  variant?: 'gold' | 'outline' | 'navy';
  className?: string;
  label?: string;
}

export function LawyerCta({ campaign, variant = 'gold', className = '', label }: Props) {
  const { t } = useI18n();
  return (
    <ExternalLink href={lawyerUrl(campaign)} className={`btn btn-${variant} ${className}`.trim()}>
      {label ?? t.common.talkToLawyer}
      <span aria-hidden="true" className="btn-arrow">
        →
      </span>
    </ExternalLink>
  );
}
