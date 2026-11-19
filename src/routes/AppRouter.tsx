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

/**
 * Rotas da aplicação. As proteções são só de navegação: a autorização é sempre do servidor. Cada rota indica os
 * requisitos do registo `m3-especificacao-requisitos-v02.md` (katch-docs) que implementa.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnly area="Recruiter" />}>
        {/** RF038: Iniciar sessão na área de gestão web (Recrutador) */}
        <Route path={paths.login} element={<LoginPage area="Recruiter" />} />
        {/** RF037: Criar conta de Recrutador */}
        <Route path={paths.createAccount} element={<CreateRecruiterAccountPage />} />
      </Route>
      <Route element={<PublicOnly area="Supervision" />}>
        {/** RF083: Iniciar sessão na área de gestão web (Administrador) */}
        <Route path={paths.adminLogin} element={<LoginPage area="Supervision" />} />
      </Route>

      <Route element={<RequireSession />}>
        {/** RF104: Reservar a área de supervisão ao Administrador */}
        <Route path={paths.accessDenied} element={<AccessDeniedPage />} />

        <Route element={<RequireUserType userType="RECRUITER" />}>
          <Route element={<RequireCompanyStatus allow={['NONE']} />}>
            {/** RF041, RF042: Registar a Empresa */}
            <Route path={paths.companyRegistration} element={<CompanyRegistrationPage />} />
          </Route>
          <Route element={<RequireCompanyStatus allow={ANY_COMPANY_ACCESS} />}>
            <Route element={<RecruiterShell />}>
              {/** RF040, RF106: Alterar a palavra-passe e terminar sessão (Recrutador) */}
              <Route path={paths.account} element={<AccountPage />} />
              <Route
                element={<RequireCompanyStatus allow={['PENDING', 'REJECTED', 'SUSPENDED']} />}
              >
                {/** RF043, RF044, RF045: Consultar o estado do pedido e submeter de novo */}
                <Route path={paths.companyStatus} element={<CompanyRequestStatusPage />} />
              </Route>
              <Route element={<RequireCompanyStatus allow={['APPROVED', 'SUSPENDED']} />}>
                {/** RF069, RF070, RF071, RF072, RF073, RF074, RF075, RF109: Conversas (Recrutador) */}
                <Route path={paths.conversations} element={<ConversationsPage />} />
              </Route>
              {/** RF039: Impedir operações reservadas sem Empresa aprovada */}
              <Route element={<RequireCompanyStatus allow={['APPROVED']} />}>
                {/** RF053, RF055, RF056, RF058, RF114, RF115: Gerir o estado das vagas */}
                <Route path={paths.jobs} element={<JobListPage />} />
                {/** RF050, RF051, RF052: Criar uma vaga */}
                <Route path={paths.newJob} element={<JobFormPage />} />
                {/** RF054: Alterar uma vaga */}
                <Route path={paths.editJob} element={<JobFormPage />} />
                {/** RF060: Consultar candidatos em espera por vaga */}
                <Route path={paths.candidates} element={<WaitingCandidatesPage />} />
                {/** RF061, RF062, RF063, RF064, RF117: Abrir o perfil do Candidato e decidir */}
                <Route path={paths.candidateProfile} element={<CandidateProfilePage />} />
                {/** RF066: Confirmar o match após aceitação */}
                <Route path={paths.candidateMatch} element={<MatchConfirmedPage />} />
                {/** RF067: Consultar os matches da Empresa */}
                <Route path={paths.matches} element={<MatchesPage />} />
                {/** RF046, RF047, RF048, RF049: Página e dados de registo da Empresa aprovada */}
                <Route path={paths.company} element={<CompanyProfilePage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/** RF104: Reservar a área de supervisão ao Administrador */}
        <Route element={<RequireUserType userType="ADMIN" />}>
          <Route element={<AdminShell />}>
            {/** RF096: Consultar o painel de indicadores por período */}
            <Route path={paths.adminIndicators} element={<IndicatorsPage />} />
            {/** RF091: Consultar as Empresas pendentes de aprovação */}
            <Route path={paths.adminPending} element={<PendingCompaniesPage />} />
            {/** RF092, RF093, RF094: Consultar, aprovar e recusar o registo de uma Empresa */}
            <Route path={paths.adminPendingDetail} element={<PendingCompanyDetailPage />} />
            {/** RF095, RF097, RF116: Consultar, suspender e reativar Empresas */}
            <Route path={paths.adminCompanies} element={<CompaniesPage />} />
            {/** RF098: Consultar a lista global de vagas publicadas */}
            <Route path={paths.adminJobs} element={<PublishedJobsPage />} />
            {/** RF085, RF086, RF087: Consultar, bloquear e reativar contas de utilizador */}
            <Route path={paths.adminAccounts} element={<AccountsPage />} />
            {/** RF088, RF089, RF090: Consultar, suspender e reativar Candidatos */}
            <Route path={paths.adminCandidates} element={<CandidatesPage />} />
            {/** RF099, RF100, RF101, RF102: Gerir as listas pré-definidas */}
            <Route path={paths.adminLists} element={<ReferenceListsPage />} />
            {/** RF084: Alterar a própria palavra-passe (Administrador) */}
            <Route path={paths.adminAccount} element={<ChangePasswordPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<SessionHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
