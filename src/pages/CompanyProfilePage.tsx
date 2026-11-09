import { type KeyboardEvent, useState } from 'react';
import { CompanyDataPanel } from '../components/CompanyDataPanel';
import { CompanyGalleryPanel } from '../components/CompanyGalleryPanel';
import { CompanyLogoPanel } from '../components/CompanyLogoPanel';
import { CompanyPageForm } from '../components/CompanyPageForm';
import { useCompanyPage } from '../hooks/useCompanyPage';
import './auth.css';
import './jobs.css';
import './recruiter.css';

// I121 — CompanyProfilePage (modelo de classes do frontend web v02, secção 8.2; ecrãs W07 e W08).

const TABS = [
  { id: 'page', label: 'Página da Empresa' },
  { id: 'data', label: 'Dados da Empresa' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * Página de apresentação (descrição, sítio, logótipo e galeria) e dados de registo da Empresa aprovada, em dois
 * separadores. Os dois painéis ficam montados para não perder o que está por gravar ao mudar de separador.
 */
export default function CompanyProfilePage() {
  const company = useCompanyPage();
  const [tab, setTab] = useState<TabId>('page');

  const moveTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      setTab(tab === 'page' ? 'data' : 'page');
    }
  };

  let content;
  if (company.error !== null) {
    content = (
      <div role="alert" className="form-banner">
        <p>{company.error.message}</p>
        <button type="button" onClick={company.reload}>
          Tentar de novo
        </button>
      </div>
    );
  } else if (company.page === null || company.loading) {
    content = <p>A carregar os dados da Empresa…</p>;
  } else {
    const { page } = company;
    content = (
      <>
        <div role="tablist" aria-label="Empresa" className="tabs">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`company-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`company-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={moveTab}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="company-panel-page"
          aria-labelledby="company-tab-page"
          hidden={tab !== 'page'}
          className="stack"
        >
          <CompanyPageForm page={page} onSave={company.savePage} />
          <CompanyLogoPanel logoUrl={page.logoUrl} onUpload={company.uploadLogo} />
          <CompanyGalleryPanel photoUrls={page.photoUrls} onUpload={company.addGalleryPhoto} />
        </div>
        <div
          role="tabpanel"
          id="company-panel-data"
          aria-labelledby="company-tab-data"
          hidden={tab !== 'data'}
        >
          <CompanyDataPanel registration={company.registration} onSave={company.saveRegistration} />
        </div>
      </>
    );
  }

  return (
    <section className="recruiter-page company-profile">
      <h1>Empresa</h1>
      {content}
    </section>
  );
}
