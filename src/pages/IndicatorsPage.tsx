import { type FormEvent, useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorAlert } from '../components/ErrorAlert';
import { useIndicators } from '../hooks/useIndicators';
import { usePendingCompanies } from '../hooks/usePendingCompanies';
import { paths } from '../routes/paths';
import './admin.css';
import './recruiter.css';

// I074 — IndicatorsPage (modelo de classes do frontend web v02, secção 8.3; ecrãs A02, A02c e A02d do protótipo v02).

/** `aaaa-MM-dd` → `dd/mm/aaaa`, sem passar por Date (sem efeito do fuso). */
function displayDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function Card({ label, value, note }: Readonly<{ label: string; value: number; note?: string }>) {
  return (
    <div className="indicator-card">
      <p className="indicator-label">{label}</p>
      <p className="indicator-value">{value}</p>
      {note && <p className="indicator-note">{note}</p>}
    </div>
  );
}

/** Largura da barra em percentagem dos interesses; com 0 interesses fica vazia. */
function barWidth(value: number, interests: number): number {
  return interests > 0 ? Math.min(100, (value / interests) * 100) : 0;
}

/** A02 — indicadores da plataforma por período (RF096), só de consulta e sem dados pessoais (RF103). */
export default function IndicatorsPage() {
  const indicators = useIndicators();
  const pending = usePendingCompanies();
  const navigate = useNavigate();
  const fromId = useId();
  const toId = useId();
  const errorId = useId();
  const [draftFrom, setDraftFrom] = useState(indicators.from);
  const [draftTo, setDraftTo] = useState(indicators.to);
  const { data, periodError } = indicators;
  const pendingCount = pending.data?.length ?? 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    indicators.applyPeriod(draftFrom, draftTo);
  };

  const bars = data
    ? [
        { label: 'Interesses manifestados', value: data.interestsExpressed },
        { label: 'Matches confirmados', value: data.matchesConfirmed },
        { label: 'Conversas iniciadas', value: data.conversationsStarted },
      ]
    : [];

  return (
    <section className="recruiter-page admin-page indicators-page">
      <h1>Painel de indicadores</h1>
      <p className="summary">
        Valores agregados da plataforma para o período escolhido. Sem dados pessoais nem conteúdo de
        conversas.
      </p>

      {pendingCount > 0 && (
        <div className="pending-banner">
          <p>
            Há {pendingCount} {pendingCount === 1 ? 'Empresa' : 'Empresas'} a aguardar aprovação.
          </p>
          <button type="button" onClick={() => navigate(paths.adminPending)}>
            Ver pendentes
          </button>
        </div>
      )}

      <form className="period-box" onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor={fromId}>Data inicial</label>
          <input
            id={fromId}
            type="date"
            value={draftFrom}
            onChange={(event) => setDraftFrom(event.target.value)}
            aria-invalid={periodError !== null}
            aria-describedby={periodError ? errorId : undefined}
          />
        </div>
        <div className="form-field">
          <label htmlFor={toId}>Data final</label>
          <input
            id={toId}
            type="date"
            value={draftTo}
            onChange={(event) => setDraftTo(event.target.value)}
            aria-invalid={periodError !== null}
            aria-describedby={periodError ? errorId : undefined}
          />
        </div>
        <button type="submit">Aplicar período</button>
        <p className="period-days">
          Período: {indicators.periodDays} {indicators.periodDays === 1 ? 'dia' : 'dias'}
        </p>
      </form>
      {periodError && (
        <p id={errorId} role="alert" className="field-error">
          {periodError}
        </p>
      )}

      {indicators.error && <ErrorAlert error={indicators.error} onRetry={indicators.reload} />}
      {indicators.loading && !data && !indicators.error && !periodError && (
        <p>A carregar os indicadores…</p>
      )}

      {data && !periodError && (
        <>
          <h2 className="indicator-section">Estado na data final ({displayDate(indicators.to)})</h2>
          <div className="indicator-grid indicator-grid-3">
            <Card
              label="Candidatos com conta ativa"
              value={data.activeCandidates}
              note="estado = ativa"
            />
            <Card
              label="Empresas aprovadas"
              value={data.approvedCompanies}
              note="estado = aprovada"
            />
            <Card
              label="Empresas pendentes"
              value={data.pendingCompanies}
              note="estado = pendente"
            />
          </div>

          <h2 className="indicator-section">
            Atividade no período ({displayDate(indicators.from)} a {displayDate(indicators.to)})
          </h2>
          <div className="indicator-grid indicator-grid-4">
            <Card label="Vagas publicadas pela 1.ª vez" value={data.jobsFirstPublished} />
            <Card label="Interesses manifestados" value={data.interestsExpressed} />
            <Card label="Matches confirmados" value={data.matchesConfirmed} note="no período" />
            <Card
              label="Conversas iniciadas"
              value={data.conversationsStarted}
              note="1.ª mensagem no período"
            />
          </div>

          <div className="funnel-box">
            <h2>Do interesse à conversa</h2>
            <p className="summary">Mesmos valores, em proporção dos interesses</p>
            {bars.map((bar) => (
              <div key={bar.label} className="funnel-row">
                <span className="funnel-label">{bar.label}</span>
                <div className="funnel-track">
                  <div
                    className="funnel-bar"
                    data-testid="funnel-bar"
                    style={{ width: `${barWidth(bar.value, data.interestsExpressed)}%` }}
                  />
                </div>
                <span className="funnel-value">{bar.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
