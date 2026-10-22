import type { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
}

export function PageHero({ eyebrow, title, children }: Props) {
  return (
    <section className="page-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        <div className="page-hero-lead">{children}</div>
      </div>
    </section>
  );
}
