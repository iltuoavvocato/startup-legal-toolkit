interface Props {
  items: { id: string; name: string; whyNot: string[] }[];
  noun: string;
}

export function ExcludedList({ items, noun }: Props) {
  if (!items.length) return null;
  return (
    <details className="details mi-excluded">
      <summary>
        Esclusi ({items.length}): perché questi {noun} non compaiono
      </summary>
      <ul>
        {items.map((x) => (
          <li key={x.id}>
            <strong>{x.name}</strong>
            <ul>
              {x.whyNot.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </details>
  );
}
