// Serviços simulados partilhados pelos testes de I069 (jest.mock('../services', () => jest.requireActual(...))).
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
