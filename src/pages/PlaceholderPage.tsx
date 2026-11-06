// I069 — página provisória dos destinos do encaminhamento que ainda não têm ecrã.
// Será substituída pela Issue do ecrã respetivo: `/vagas`, `/empresa` e `/admin/indicadores`.

export default function PlaceholderPage({ title }: Readonly<{ title: string }>) {
  return (
    <section className="recruiter-page">
      <h1>{title}</h1>
    </section>
  );
}
