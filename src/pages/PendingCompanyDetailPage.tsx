import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/ApiError';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorAlert } from '../components/ErrorAlert';
import { ReasonDialog } from '../components/ReasonDialog';
import { StatusBadge } from '../components/StatusBadge';
import { usePendingCompanies } from '../hooks/usePendingCompanies';
import { paths } from '../routes/paths';
import { industryLabels } from '../types/labels';
import { isConflictWithCode } from '../utils/apiErrors';
import { formatDateTime } from '../utils/date';
import './admin.css';
import './recruiter.css';

// I073 — PendingCompanyDetailPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A04, A04b, A04c, A04d e
// A04e do protótipo v02).

type Dialog = 'approve' | 'reject' | null;

/** A04 — os oito dados submetidos, a data de submissão e o estado; aprovar ou recusar o registo (RF092 a RF094). */
export default function PendingCompanyDetailPage() {
  const { companyId = '' } = useParams();
  const { selected, selectedLoading, selectedError, reloadSelected, approve, reject } =
    usePendingCompanies(companyId);
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  // A04e: a Empresa já foi decidida (409 ERR-30); a mensagem é a do servidor.
  const [alreadyDecided, setAlreadyDecided] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const goToList = (notice: string) => void navigate(paths.adminPending, { state: { notice } });

  /** Devolve true se o erro foi tratado aqui (decisão já registada); os outros seguem para quem chamou. */
  const handledAsDecided = (caught: unknown): boolean => {
    if (!isConflictWithCode(caught, 'ERR-30')) {
      return false;
    }
    setDialog(null);
    setAlreadyDecided((caught as ApiError).message);
    return true;
  };

  const confirmApprove = async () => {
    setBusy(true);
    setFailure(null);
    try {
      await approve(companyId);
      goToList(`Registo de «${selected?.companyName}» aprovado.`);
    } catch (caught) {
      if (!handledAsDecided(caught)) {
        setDialog(null);
        setFailure(ApiError.from(caught));
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async (reason: string) => {
    try {
      await reject(companyId, { reason });
      goToList(`Registo de «${selected?.companyName}» recusado.`);
    } catch (caught) {
      // O ERR-10 (motivo inválido) fica no campo do diálogo; só a decisão já registada é tratada nesta página.
      if (!handledAsDecided(caught)) {
        throw caught;
      }
    }
  };

  return (
    <section className="recruiter-page admin-page">
      <h1>Registo da Empresa</h1>
      <p>
        <Link to={paths.adminPending}>Voltar às Empresas pendentes</Link>
      </p>
      {selectedLoading && !selected && !selectedError && <p>A carregar os dados submetidos…</p>}
      {selectedError && <ErrorAlert error={selectedError} onRetry={reloadSelected} />}
      {failure && (
        <ErrorAlert
          error={failure}
          onRetry={() => {
            setFailure(null);
            setDialog('approve');
          }}
        />
      )}
      {alreadyDecided && (
        <div role="alert" className="alert">
          <p>{alreadyDecided}</p>
          <button type="button" onClick={() => void navigate(paths.adminPending)}>
            Ver lista atualizada
          </button>
        </div>
      )}
      {selected && (
        <>
          <dl className="detail-list">
            <dt>Designação social</dt>
            <dd>{selected.companyName}</dd>
            <dt>NIF</dt>
            <dd>{selected.taxId}</dd>
            <dt>Setor de atividade</dt>
            <dd>{industryLabels[selected.industry]}</dd>
            <dt>Morada</dt>
            <dd>{selected.address}</dd>
            <dt>Localidade</dt>
            <dd>{selected.locationName}</dd>
            <dt>Correio eletrónico de contacto</dt>
            <dd>{selected.contactEmail}</dd>
            <dt>Contacto telefónico</dt>
            <dd>{selected.contactPhone}</dd>
            <dt>Responsável</dt>
            <dd>{selected.responsibleName}</dd>
            <dt>Data de submissão</dt>
            <dd>{formatDateTime(selected.submittedAt)}</dd>
            <dt>Estado</dt>
            <dd>
              <StatusBadge status="PENDING" />
            </dd>
          </dl>
          {!alreadyDecided && (
            <div className="page-actions">
              <button type="button" className="primary" onClick={() => setDialog('approve')}>
                Aprovar registo
              </button>
              <button type="button" onClick={() => setDialog('reject')}>
                Recusar registo
              </button>
            </div>
          )}
        </>
      )}
      {dialog === 'approve' && selected && (
        <ConfirmDialog
          title="Aprovar registo"
          confirmLabel="Aprovar registo"
          busy={busy}
          onConfirm={() => void confirmApprove()}
          onCancel={() => setDialog(null)}
        >
          <p>
            O registo de «{selected.companyName}» passa a aprovado. O Recrutador passa a poder usar
            a área de gestão da Empresa e consulta a decisão no estado do pedido.
          </p>
        </ConfirmDialog>
      )}
      {dialog === 'reject' && selected && (
        <ReasonDialog
          title="Recusar registo"
          confirmLabel="Recusar registo"
          onConfirm={confirmReject}
          onCancel={() => setDialog(null)}
        />
      )}
    </section>
  );
}
