/**
 * Configuração do Babel, só para o Jest.
 *
 * O Jest não lê TypeScript nem JSX; o build da aplicação é feito pelo Vite e a verificação de tipos pelo tsc.
 *
 * @returns Os presets do Babel.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
