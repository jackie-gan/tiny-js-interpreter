import { execute } from '../src/execute';

describe('tiny js interpreter es6', () => {
  test('test const', () => {
    expect(execute(`
      var result;
      var i = 3;
      while(i > 0) {
        {
          const b = 5;
          result = b;
        }
        i--;
      };
      module.exports = result;
    `)).toBe(5);
  });
    
  test('test arrow function', () => {
    
  });
});