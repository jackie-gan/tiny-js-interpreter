import { execute } from '../src/execute';

describe('tiny js interpreter', () => {
  test('binay expression', () => {
    execute('console.log(3 + 4)');
  });

  test('test console', () => {
    execute('console.log("test")');
  })

  test('test const', () => {

  })
});