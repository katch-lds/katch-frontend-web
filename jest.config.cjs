// Jest (I120): testes unitários e cobertura de linhas. A cobertura mínima de 40% das linhas é a do frontend web
// (convenções de código e quality gates, secção 6) e falha o comando quando não é atingida.
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  moduleNameMapper: {
    // import.meta.env só existe no Vite; nos testes usa-se uma configuração fixa.
    '^(\\.{1,2}/)*config/env$': '<rootDir>/test/envMock.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/config/env.ts',
    '!src/types/**',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { lines: 40 },
  },
};
