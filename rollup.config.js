import resolve from '@rollup/plugin-node-resolve';

const external = (id) =>
  id === 'react' ||
  id === 'react-dom' ||
  id.startsWith('react/') ||
  id.startsWith('react-dom/') ||
  id === 'detonger-web-bt' ||
  id.startsWith('detonger-web-bt/');

const plugins = [resolve({ browser: true, preferBuiltins: false })];

export default [
  {
    input: 'dist/esm/index.js',
    output: {
      file: 'dist/detonger-web-bt.js',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins,
  },
  {
    input: 'dist/esm/react/index.js',
    output: {
      file: 'dist/react/index.js',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins,
  },
];
