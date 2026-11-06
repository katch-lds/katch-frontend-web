// Serviços simulados partilhados pelos testes de I069: jest.mock('../services', () => jest.requireActual(...)).
export const authService = {
  createRecruiterAccount: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
};
export const companyService = { register: jest.fn(), getStatus: jest.fn() };
export const referenceListService = { listLocations: jest.fn() };
export const matchService = { list: jest.fn() };
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
  conversationService.list.mockResolvedValue([]);
  matchService.list.mockResolvedValue([]);
  referenceListService.listLocations.mockResolvedValue([{ id: 'loc-1', name: 'Braga (Braga)' }]);
}
