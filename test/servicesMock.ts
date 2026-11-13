import { companyPageDto, companyRegistrationDto, indicators } from './fixtures';

// Serviços simulados partilhados pelos testes de I069: jest.mock('../services', () => jest.requireActual(...)).
export const authService = {
  createRecruiterAccount: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
};
export const companyService = {
  register: jest.fn(),
  getStatus: jest.fn(),
  getRegistration: jest.fn(),
  resubmit: jest.fn(),
  updateRegistration: jest.fn(),
  getPage: jest.fn(),
  updatePage: jest.fn(),
  uploadLogo: jest.fn(),
  addGalleryPhoto: jest.fn(),
};
export const referenceListService = {
  listLocations: jest.fn(),
  listSkills: jest.fn(),
  listBenefits: jest.fn(),
  addSkill: jest.fn(),
  renameSkill: jest.fn(),
  addBenefit: jest.fn(),
  renameBenefit: jest.fn(),
};
export const adminAccountService = {
  listAccounts: jest.fn(),
  listCandidates: jest.fn(),
  block: jest.fn(),
  suspendCandidate: jest.fn(),
  reactivate: jest.fn(),
};
export const adminCompanyService = {
  listPending: jest.fn(),
  getSubmittedData: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  suspend: jest.fn(),
  reactivate: jest.fn(),
  listCompanies: jest.fn(),
  listPublishedJobs: jest.fn(),
};
export const indicatorService = { get: jest.fn() };
export const jobService = {
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  publish: jest.fn(),
  suspend: jest.fn(),
  republish: jest.fn(),
  close: jest.fn(),
  delete: jest.fn(),
  addPhoto: jest.fn(),
};
export const matchService = { list: jest.fn() };
export const candidateEvaluationService = {
  listWaiting: jest.fn(),
  openProfile: jest.fn(),
  getCv: jest.fn(),
  accept: jest.fn(),
  reject: jest.fn(),
};
export const conversationService = {
  list: jest.fn(),
  open: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
};

/**
 * Repõe os simuladores com respostas por omissão que não atrapalham: sem conversas, sem matches, sem vagas, uma
 * localidade, uma competência e um benefício.
 */
export function resetServiceMocks(): void {
  jest.resetAllMocks();
  authService.logout.mockResolvedValue(undefined);
  authService.changePassword.mockResolvedValue(undefined);
  companyService.getRegistration.mockResolvedValue(companyRegistrationDto());
  companyService.getPage.mockResolvedValue(companyPageDto());
  conversationService.list.mockResolvedValue([]);
  matchService.list.mockResolvedValue([]);
  candidateEvaluationService.listWaiting.mockResolvedValue([]);
  referenceListService.listLocations.mockResolvedValue([{ id: 'loc-1', name: 'Braga (Braga)' }]);
  referenceListService.listSkills.mockResolvedValue([{ id: 'skill-1', name: 'Atendimento' }]);
  referenceListService.listBenefits.mockResolvedValue([
    { id: 'benefit-1', name: 'Refeição no local' },
  ]);
  jobService.list.mockResolvedValue([]);
  // I073 — a barra lateral do Administrador lê as Empresas pendentes em todas as páginas.
  adminCompanyService.listPending.mockResolvedValue([]);
  adminCompanyService.listCompanies.mockResolvedValue([]);
  adminCompanyService.listPublishedJobs.mockResolvedValue([]);
  adminAccountService.listAccounts.mockResolvedValue([]);
  adminAccountService.listCandidates.mockResolvedValue([]);
  indicatorService.get.mockResolvedValue(indicators());
}
