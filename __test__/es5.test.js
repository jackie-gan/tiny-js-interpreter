import { execute } from '../src/execute';

describe('tiny js interpreter es5', () => {
  test('binay expression', () => {
    expect(execute(`
      module.exports = 3 + 4;
    `)).toBe(7);
  });

  test('test assign', () => {
    expect(execute(`
      var i = 1;
      i = 2;
      module.exports = i;
    `)).toBe(2);
  });

  test('test regex', () => {
    expect(execute(`
      module.exports = /abc/.test('abc');
    `)).toBeTruthy();
  });

  test('test for loop', () => {
    expect(execute(`
      var result = 0;
      for (var i = 0; i < 3; i++) {
        result += 2;
      }
      module.exports = result;
    `)).toBe(6);
  });

  test('test for loop break', () => {
    expect(execute(`
      var result = 0;
      for (var i = 0; i < 3; i++) {
        result += 2;
        if (result >= 4) break;
      }
      module.exports = result;
    `)).toBe(4);
  });

  test('test for while', () => {
    expect(execute(`
      var i = 0;
      while(i < 11) {
        i++;
      }
      module.exports = i;
    `)).toBe(11);
  });

  test('test for do while', () => {
    expect(execute(`
      var i = 0;
      do {
        i++;
      } while(i < 11)
      module.exports = i;
    `)).toBe(11);
  });

  test('test for for-in', () => {
    expect(execute(`
      var obj = { a: '1', b: '2' };
      var result = '';
      for (var key in obj) {
        result += key;
      }
      module.exports = result;
    `)).toBe('ab');
  });

  test('test for update expression', () => {
    expect(execute(`
      var i = 1, j = 1;
      ++i;
      j++;
      var m = 2, n = 2;
      --m;
      n--;
      module.exports = { i, j, m, n };
    `)).toMatchObject({ i: 2, j: 2, m: 1, n: 1 });
  });

  test('test for function 1', () => {
    expect(execute(`
      var checkVal = 11;
      var result;
      function func() {
        var checkVal = 22;
        result = checkVal;
      }
      func();
      module.exports = result;
    `)).toBe(22);
  });

  test('test closure', () => {
    expect(execute(`
      var result;
      function func() {
        var checkVal = 33;
        function log() {
          result = checkVal;
        }
        return log;
      }
      func()();
      module.exports = result;
    `)).toBe(33);
  });

  test('test throw', () => {
    expect(() => {
      execute(`
        throw 'this is error';
      `)
    }).toThrowError('this is error');
  });

  test('test try catch 1', () => {
    expect(execute(`
      var result;
      try {
        throw 'this is catch';
      } catch(e) {
        result = e;
      }
      module.exports = result;
    `)).toBe('this is catch');
  });

  test('test try catch 2', () => {
    expect(execute(`
      var result;
      try {
        1 + 2;
      } finally {
        result = 'this is finally';
      }
      module.exports = result;
    `)).toBe('this is finally');
  });

  test('test conditional expression', () => {
    expect(execute(`
      module.exports = 2 > 1 ? 2 : 1;
    `)).toBe(2);
  });

  test('test logical expression', () => {
    expect(execute(`
      module.export = true || false;
    `)).toBeTruthy();
  });

  test('test object expression', () => {
    expect(execute(`
      function func() {
        return 2;
      }
      module.exports = [1, func(), 3];
    `)).toMatchObject([1, 2, 3]);
  });

  test('test variable declaration', () => {
    expect(execute(`
      const options = { a: 1, b: 2 };
      const { a: ret1, b: ret2 } = options;
      const { ret3 } = { ret3: 3 };
      module.exports = { val1: ret1, val2: ret2, val3: ret3 };
    `)).toMatchObject({ val1: 1, val2: 2, val3: 3 });
  });
});