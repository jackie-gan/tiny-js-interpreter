import { execute } from '../src/execute';

describe('tiny js interpreter', () => {
  test('binay expression', () => {
    execute('3 + 4');
  });
});