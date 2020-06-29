import { execute } from '../src/execute';

describe('tiny js interpreter', () => {
  test('binay expression', () => {
    execute('console.log(3 + 4)');
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

  test('test for while', () => {
    execute(`
      var i = 0;
      while(i < 11) {
        i++;
      }
      console.log('test for while', i);
    `);
  });

  test('test for do while', () => {
    execute(`
      var i = 0;
      do {
        i++;
      } while(i < 11)
      console.log('test for do while', i);
    `);
  });

  test('test for for-in', () => {
    execute(`
      var obj = { a: '1', b: '2' };
      var result = '';
      for (var key in obj) {
        result += key;
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

  test('test closure', () => {
    execute(`
      function func() {
        var checkVal = 33;
        function log() {
          console.log(checkVal);
        }
        return log;
      }
      func()();
    `);
  });
});