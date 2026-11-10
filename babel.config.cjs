// Babel só para o Jest (I120): o build da aplicação é feito pelo Vite e a verificação de tipos pelo tsc.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
