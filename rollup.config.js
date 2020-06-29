import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const config = {
  input: [
    'src/execute.ts'
  ],
  output: {
    file: 'dist/interpreter.js',
    format: 'umd',
    name: 'interpreter'
  },
  plugins: [
    typescript(),
    resolve({
      preferBuiltins: false
    }),
    commonjs({ extensions: ['.js', '.ts'] })
  ]
};

export default config;