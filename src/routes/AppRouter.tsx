import { Navigate, Route, Routes } from 'react-router';
import AdminShell from '../layouts/AdminShell';
import RecruiterShell from '../layouts/RecruiterShell';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import AccountPage from '../pages/AccountPage';
import AccountsPage from '../pages/AccountsPage';
import CandidateProfilePage from '../pages/CandidateProfilePage';
import CandidatesPage from '../pages/CandidatesPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import CompaniesPage from '../pages/CompaniesPage';
import CompanyProfilePage from '../pages/CompanyProfilePage';
import CompanyRegistrationPage from '../pages/CompanyRegistrationPage';
import CompanyRequestStatusPage from '../pages/CompanyRequestStatusPage';
import ConversationsPage from '../pages/ConversationsPage';
import CreateRecruiterAccountPage from '../pages/CreateRecruiterAccountPage';
import IndicatorsPage from '../pages/IndicatorsPage';
import JobFormPage from '../pages/JobFormPage';
import JobListPage from '../pages/JobListPage';
import LoginPage from '../pages/LoginPage';
import MatchesPage from '../pages/MatchesPage';
import MatchConfirmedPage from '../pages/MatchConfirmedPage';
import PendingCompaniesPage from '../pages/PendingCompaniesPage';
import PendingCompanyDetailPage from '../pages/PendingCompanyDetailPage';
import PublishedJobsPage from '../pages/PublishedJobsPage';
import ReferenceListsPage from '../pages/ReferenceListsPage';
import WaitingCandidatesPage from '../pages/WaitingCandidatesPage';
import { paths } from './paths';
import { PublicOnly } from './PublicOnly';
import { ANY_COMPANY_ACCESS, RequireCompanyStatus } from './RequireCompanyStatus';
import { RequireSession } from './RequireSession';
import { RequireUserType } from './RequireUserType';
import { SessionHome } from './SessionHome';

// I069 — AppRouter (modelo de classes do frontend web v02, secção 7.2). Estas proteções são só de navegação: a
// autorização é sempre do servidor.

/**
 * Rotas da aplicação. As páginas da supervisão (pendentes, Empresas, vagas, contas, Candidatos e listas) são da
 * I073; o painel de indicadores (`/admin/indicadores`) é da I074.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnly area="Recruiter" />}>
        <Route path={paths.login} element={<LoginPage area="Recruiter" />} />
        <Route path={paths.createAccount} element={<CreateRecruiterAccountPage />} />
      </Route>
      <Route element={<PublicOnly area="Supervision" />}>
        <Route path={paths.adminLogin} element={<LoginPage area="Supervision" />} />
      </Route>

      <Route element={<RequireSession />}>
        <Route path={paths.accessDenied} element={<AccessDeniedPage />} />

        <Route element={<RequireUserType userType="RECRUITER" />}>
          <Route element={<RequireCompanyStatus allow={['NONE']} />}>
            <Route path={paths.companyRegistration} element={<CompanyRegistrationPage />} />
          </Route>
          <Route element={<RequireCompanyStatus allow={ANY_COMPANY_ACCESS} />}>
            <Route element={<RecruiterShell />}>
              <Route path={paths.account} element={<AccountPage />} />
              <Route
                element={<RequireCompanyStatus allow={['PENDING', 'REJECTED', 'SUSPENDED']} />}
              >
                <Route path={paths.companyStatus} element={<CompanyRequestStatusPage />} />
              </Route>
              <Route element={<RequireCompanyStatus allow={['APPROVED', 'SUSPENDED']} />}>
                <Route path={paths.conversations} element={<ConversationsPage />} />
              </Route>
              <Route element={<RequireCompanyStatus allow={['APPROVED']} />}>
                <Route path={paths.jobs} element={<JobListPage />} />
                <Route path={paths.newJob} element={<JobFormPage />} />
                <Route path={paths.editJob} element={<JobFormPage />} />
                <Route path={paths.candidates} element={<WaitingCandidatesPage />} />
                <Route path={`${paths.candidates}/:matchId`} element={<CandidateProfilePage />} />
                <Route
                  path={`${paths.candidates}/:matchId/match`}
                  element={<MatchConfirmedPage />}
                />
                <Route path={paths.matches} element={<MatchesPage />} />
                <Route path={paths.company} element={<CompanyProfilePage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<RequireUserType userType="ADMIN" />}>
          <Route element={<AdminShell />}>
            <Route path={paths.adminIndicators} element={<IndicatorsPage />} />
            <Route path={paths.adminPending} element={<PendingCompaniesPage />} />
            <Route path={paths.adminPendingDetail} element={<PendingCompanyDetailPage />} />
            <Route path={paths.adminCompanies} element={<CompaniesPage />} />
            <Route path={paths.adminJobs} element={<PublishedJobsPage />} />
            <Route path={paths.adminAccounts} element={<AccountsPage />} />
            <Route path={paths.adminCandidates} element={<CandidatesPage />} />
            <Route path={paths.adminLists} element={<ReferenceListsPage />} />
            <Route path={paths.adminAccount} element={<ChangePasswordPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<SessionHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
