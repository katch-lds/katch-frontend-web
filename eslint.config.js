// ESLint (QG-05): eslint:recommended + @typescript-eslint/recommended + react-hooks/recommended, com
// severidade error e sem exclusões de regras (convenções de código e quality gates, secção 5). O ESLint 9 usa a
// configuração plana (eslint.config.js) em vez do .eslintrc.json.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'sonarqube-report'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'test/**/*.ts'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
  {
    files: ['**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
);
