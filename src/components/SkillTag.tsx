/** Competência em etiqueta (modelo de classes do frontend web v02, secção 8.1); a coincidência com a vaga não depende só da cor. */
export function SkillTag({ name, highlighted }: Readonly<{ name: string; highlighted: boolean }>) {
  return (
    <li className={highlighted ? 'tag skill-tag skill-match' : 'tag skill-tag'}>
      {highlighted && <span aria-hidden="true">✓ </span>}
      {name}
      {highlighted && <span className="visually-hidden"> (coincide com a vaga)</span>}
    </li>
  );
}
