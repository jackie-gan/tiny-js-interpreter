import { execute } from '../src/execute';

describe('tiny js interpreter', () => {
  test('binay expression', () => {
    execute('console.log(3 + 4)');
  });

  test('test console', () => {
    execute('console.log("test")');
  });

  test('test assign', () => {
    execute(`
      var i = 1;
      i = 2;
      console.log(i);
    `);
  });

  test('test for loop', () => {
    execute(`
      var result = 0;
      for (var i = 0; i < 3; i++) {
        result += 2;
      }
      console.log(result);
    `);
  });

  test('test for loop break', () => {
    execute(`
      var result = 0;
      for (var i = 0; i < 3; i++) {
        result += 2;
        if (result >= 4) break;
      }
      console.log(result);
    `);
  });

  test('test for update expression', () => {
    execute(`
      var i = 1, j = 1;
      console.log('++', ++i);
      console.log('++', j++);
      var m = 2, n = 2;
      console.log('--', --m);
      console.log('--', n--);
    `);
  });

  test('test for function 1', () => {
    execute(`
      var checkVal = 11;
      function func() {
        var checkVal = 22;
        console.log(checkVal);
      }
      func();
    `);
  });
});