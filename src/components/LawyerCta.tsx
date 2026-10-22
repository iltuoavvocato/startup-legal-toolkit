import { lawyerUrl, type ToolCampaign } from '../site';
import { ExternalLink } from './ExternalLink';

interface Props {
  campaign: ToolCampaign;
  variant?: 'gold' | 'outline' | 'navy';
  className?: string;
  label?: string;
}

export function LawyerCta({ campaign, variant = 'gold', className = '', label = 'Parla con un avvocato' }: Props) {
  return (
    <ExternalLink href={lawyerUrl(campaign)} className={`btn btn-${variant} ${className}`.trim()}>
      {label}
      <span aria-hidden="true" className="btn-arrow">
        →
      </span>
    </ExternalLink>
  );
}
