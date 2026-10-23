import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from './context';
import type { RouteId } from './routes';

// Minimal inline markup for dictionary strings: *emphasis*, **strong**, [label](@routeId) for internal links.
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(@[A-Za-z]+\))/g;

export function Rich({ text }: { text: string }) {
  const { path } = useI18n();
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
        const link = part.match(/^\[([^\]]+)\]\(@([A-Za-z]+)\)$/);
        if (link) {
          return (
            <Link key={i} to={path(link[2] as RouteId)}>
              {link[1]}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
