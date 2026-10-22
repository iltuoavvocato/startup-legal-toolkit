import { asset } from '../site';

interface LogoProps {
  variant?: 'light' | 'navy' | 'gold';
  height?: number;
  className?: string;
}

/** ilTuoAvvocato wordmark (aspect ratio 3976:368 ≈ 10.8:1, never distorted). */
export function Logo({ variant = 'light', height = 18, className }: LogoProps) {
  const width = Math.round((height * 3976) / 368);
  return (
    <img
      className={className}
      src={asset(`logo-${variant}.svg`)}
      width={width}
      height={height}
      alt="ilTuoAvvocato.com"
      decoding="async"
    />
  );
}
