import { companyRegistrationDto } from './fixtures';

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
};
export const referenceListService = { listLocations: jest.fn() };
export const matchService = { list: jest.fn() };
export const jobService = { list: jest.fn() };
export const candidateEvaluationService = { listWaiting: jest.fn() };
export const conversationService = {
  list: jest.fn(),
  open: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
};

/** Repõe os simuladores com respostas por omissão que não atrapalham: sem conversas, sem matches, uma localidade. */
export function resetServiceMocks(): void {
  jest.resetAllMocks();
  authService.logout.mockResolvedValue(undefined);
  authService.changePassword.mockResolvedValue(undefined);
  companyService.getRegistration.mockResolvedValue(companyRegistrationDto());
  conversationService.list.mockResolvedValue([]);
  matchService.list.mockResolvedValue([]);
  jobService.list.mockResolvedValue([]);
  candidateEvaluationService.listWaiting.mockResolvedValue([]);
  referenceListService.listLocations.mockResolvedValue([{ id: 'loc-1', name: 'Braga (Braga)' }]);
}
