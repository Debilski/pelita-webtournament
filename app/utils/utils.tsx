export function Dot({ blink = false }: { blink?: boolean }) {
  const prop = blink ? { className: 'animate-pulse' } : {};

  return <span {...prop}>⚫&#xFE0E;</span>;
}

export function ColoredDot({ color }: { color: string }) {
  return (
    <span className="colored-dot text-2xl" style={{ color: color }}>
      ⚫&#xFE0E;
    </span>
  );
}

export function H1Underline({ children }: { children: string }) {
  return (
    <div>
      <h1>{children}</h1>
      <div>{'='.repeat(children.length)}</div>
    </div>
  );
}
