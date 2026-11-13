import { type Column, DataTable } from '../components/DataTable';
import { ErrorAlert } from '../components/ErrorAlert';
import { Pagination } from '../components/Pagination';
import { usePublishedJobs } from '../hooks/usePublishedJobs';
import type { PublishedJobAdminDto } from '../types/api';
import { formatDate } from '../utils/date';
import './admin.css';
import './recruiter.css';

// I073 — PublishedJobsPage (modelo de classes do frontend web v02, secção 8.3; ecrã A06 do protótipo v02).

const columns: Column<PublishedJobAdminDto>[] = [
  { key: 'title', header: 'Função', render: (job) => <strong>{job.title}</strong> },
  { key: 'company', header: 'Empresa', render: (job) => job.companyName },
  {
    key: 'publishedAt',
    header: 'Data de publicação',
    render: (job) => formatDate(job.publishedAt),
  },
  { key: 'interests', header: 'Interesses', render: (job) => job.interestCount },
];

/** A06 — vagas publicadas de todas as Empresas, só de consulta, com paginação no cliente (RF098). */
export default function PublishedJobsPage() {
  const jobs = usePublishedJobs();
  return (
    <section className="recruiter-page admin-page">
      <h1>Vagas publicadas</h1>
      {jobs.loading && !jobs.data && <p>A carregar as vagas publicadas…</p>}
      {jobs.error && <ErrorAlert error={jobs.error} onRetry={jobs.reload} />}
      {jobs.data && (
        <>
          <DataTable
            columns={columns}
            rows={jobs.visibleRows}
            rowKey={(job) => job.jobId}
            emptyMessage="Não há vagas publicadas."
          />
          <Pagination page={jobs.page} pageCount={jobs.pageCount} onPageChange={jobs.goToPage} />
        </>
      )}
    </section>
  );
}
