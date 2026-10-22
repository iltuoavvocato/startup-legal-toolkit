import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export function ExternalLink({ children, ...rest }: Props) {
  return (
    <a target="_blank" rel="noopener" {...rest}>
      {children}
      <span className="sr-only"> (si apre in una nuova scheda)</span>
    </a>
  );
}
