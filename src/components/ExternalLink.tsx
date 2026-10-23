import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useI18n } from '../i18n/context';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export function ExternalLink({ children, ...rest }: Props) {
  const { t } = useI18n();
  return (
    <a target="_blank" rel="noopener" {...rest}>
      {children}
      <span className="sr-only">{t.common.newTab}</span>
    </a>
  );
}
