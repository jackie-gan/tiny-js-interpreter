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
    expect(execute(`
      var result;
      function ff() {
        this.a = 6;
        const fff = () => {
          this.a = 7;
        };
        fff();
      };
      const obj = { a: 5, func: ff };
      obj.func();
      module.exports = obj.a;
    `)).toBe(7);
  });

  test('test spread', () => {
    expect(execute(`
      var obj = { a: 1 };
      module.exports = { a: 2, ...obj };
    `)).toMatchObject({ a: 1 });
  });

  test('test template literal', () => {
    expect(execute("var val1 = 'val1'; var val2 = 'val2'; module.exports = `${val1} + ${val2}`")).toBe('val1 + val2');
  });
});