import { DISCLAIMER } from '../site';

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`disclaimer ${className}`.trim()}>
      <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
        <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span>{DISCLAIMER}</span>
    </p>
  );
}
