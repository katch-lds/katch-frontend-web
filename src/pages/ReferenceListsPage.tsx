import { useState } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';
import { ReferenceListSection } from '../components/ReferenceListSection';
import { useReferenceLists } from '../hooks/useReferenceLists';
import './admin.css';
import './recruiter.css';

// I073 — ReferenceListsPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A09 e A09b do protótipo v02).

/**
 * A09 — competências e benefícios, com «Alterar designação» na própria lista e «Acrescentar» (RF099 a RF102).
 * A lista de localidades é só de leitura e não aparece.
 */
export default function ReferenceListsPage() {
  const lists = useReferenceLists();
  const [notice, setNotice] = useState<string | null>(null);

  /** Cada operação bem-sucedida deixa a mensagem; a falha segue para o formulário, que a mostra no campo. */
  const announce = (message: (name: string) => string, operation: Promise<void>, name: string) =>
    operation.then(() => setNotice(message(name)));

  return (
    <section className="recruiter-page admin-page">
      <h1>Listas pré-definidas</h1>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {lists.loading && !lists.data && <p>A carregar as listas…</p>}
      {lists.error && <ErrorAlert error={lists.error} onRetry={lists.reload} />}
      {lists.data && (
        <div className="reference-lists">
          <ReferenceListSection
            listKey="skills"
            title="Competências"
            addLabel="Nova competência"
            items={lists.data.skills}
            emptyMessage="Ainda não há competências."
            onAdd={(name) =>
              announce((n) => `Competência «${n}» acrescentada.`, lists.addSkill({ name }), name)
            }
            onRename={(id, name) =>
              announce(
                (n) => `Competência alterada para «${n}».`,
                lists.renameSkill(id, { name }),
                name,
              )
            }
          />
          <ReferenceListSection
            listKey="benefits"
            title="Benefícios"
            addLabel="Novo benefício"
            items={lists.data.benefits}
            emptyMessage="Ainda não há benefícios."
            onAdd={(name) =>
              announce((n) => `Benefício «${n}» acrescentado.`, lists.addBenefit({ name }), name)
            }
            onRename={(id, name) =>
              announce(
                (n) => `Benefício alterado para «${n}».`,
                lists.renameBenefit(id, { name }),
                name,
              )
            }
          />
        </div>
      )}
    </section>
  );
}
