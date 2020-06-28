import * as ESTree from 'estree';
import { TAG } from './utils';
import { Scope } from './scope';
import { Signal } from './signal';
import { Var } from './var';

const vistorsMap = {
  Program: (node: ESTree.Program, scope: Scope) => {
    node.body.forEach((bodyNode) => {
      evaluate(bodyNode, scope);
    });
  },
  ExpressionStatement: (node: ESTree.ExpressionStatement, scope: Scope) => {
    evaluate(node.expression, scope);
  },
  BlockStatement: (node: ESTree.BlockStatement, scope: Scope) => {
    const blockScope = scope.invasive ? scope : new Scope('block', scope);

    const { body } = node;
    const len = body.length;

    for (let i = 0; i < len; i++ ) {
      const result = evaluate(body[i], blockScope);

      if (Signal.isBreak(result) || Signal.isContinue(result) || Signal.isReturn(result)) {
        return result;
      }
    }
  },
  ObjectExpression: (node: ESTree.ObjectExpression, scope: Scope) => {
    const result = {};

    for (const property of node.properties) {
      const kind = property.kind;
    }
  },
  BinaryExpression: (node: ESTree.BinaryExpression, scope: Scope) => {
    const leftVal = evaluate(node.left, scope);
    const rightVal = evaluate(node.right, scope);
    const operator = node.operator;

    const calculateFunc = {
      '+': (l, r) => l + r,
      '-': (l, r) => l - r,
      '*': (l, r) => l * r,
      '/': (l, r) => l / r,
      '%': (l, r) => l % r,
      '<': (l, r) => l < r,
      '>': (l, r) => l > r,
      '<=': (l, r) => l <= r,
      '>=': (l, r) => l >= r,
      '==': (l, r) => l == r,
      '===': (l, r) => l === r,
      '!=': (l, r) => l != r,
      '!==': (l, r) => l !== r
    };

    if (calculateFunc[operator]) return calculateFunc[operator](leftVal, rightVal);
    else throw `${TAG} unknow operator: ${operator}`;
  },
  Literal: (node: ESTree.Literal) => {
    return node.value;
  },
  Identifier: (node: ESTree.Identifier, scope: Scope) => {
    const rawName = node.name;
    const variable = scope.search(rawName);
    if (variable) return variable.getVal();
    else throw `${TAG} ${rawName} is not defined`; 
  },
  VariableDeclaration: (node: ESTree.VariableDeclaration, scope: Scope) => {
    node.declarations.forEach((declar) => {
      evaluate(declar, scope);
    });
  },
  VariableDeclarator: (node: ESTree.VariableDeclarator, scope: Scope) => {
    const { id, init } = node;
    const key = (<ESTree.Identifier>id).name;
    const value = init ? evaluate(init, scope) : undefined;
    if (!scope.var(key, value)) {
      throw `${TAG} ${key} has defined`;
    }
  },
  MemberExpression: (node: ESTree.MemberExpression, scope: Scope) => {
    const { object, property, computed } = node;

    // computed 为 true，表示为object[property]，即property不是Identifier
    const prop = computed ? evaluate(property, scope) : (<ESTree.Identifier>property).name;

    const obj = evaluate(object, scope);

    return obj[prop];
  },
  CallExpression: (node: ESTree.CallExpression, scope: Scope) => {
    const { callee } = node;
    const func = evaluate(callee, scope);
    const args = node.arguments.map((argument) => evaluate(argument, scope));

    if (typeof func !== 'function') throw `${TAG} callee ${String(func)} is not a function`;

    // 查找 context
    if (callee.type === 'MemberExpression') {
      const context = evaluate(callee.object, scope);
      return func.apply(context, args);
    } else {
      const context = scope.search('this');
      return func.apply(context ? context.getVal() : null, args);
    }
  },
  WithStatement: () => {
    throw `${TAG} WithStatement is not implement`;
  },
  AssignmentExpression: (node: ESTree.AssignmentExpression, scope: Scope) => {
    const { left, operator, right } = node;
    // 待赋值的变量
    // TODO 目前使用var，后续需要考虑const的情况，目前这里先不考虑
    let assignVar: { setVal(v: any): boolean, getVal(): any };
    // 分开两种情况:
    // 1、对标识符Identifier赋值
    // 2、对成员表达式MemberExpression赋值
    if (left.type === 'Identifier') {
      const rawName = left.name;
      const variable = scope.search(rawName);
      if (!variable) throw `${TAG} ${rawName} is not defined`;
      else assignVar = variable;
    } else if (left.type === 'MemberExpression') {
      const { object, property, computed } = left;
      const obj = evaluate(object, scope);
      const key = computed ? evaluate(property, scope) : (<ESTree.Identifier>property).name;

      assignVar = {
        setVal(v) {
          obj[key] = v;
          return true
        },
        getVal() {
          return obj[key];
        }
      }
    } else throw `${TAG} unknow assginment expression`;

    return ({
      // AssignmentExpression需要返回Assign后的结果
      '=': (v) => (assignVar.setVal(v), v),
      '+=': (v) => (assignVar.setVal(assignVar.getVal() + v), assignVar.getVal()),
      '-=': (v) => (assignVar.setVal(assignVar.getVal() - v), assignVar.getVal()),
      '*=': (v) => (assignVar.setVal(assignVar.getVal() * v), assignVar.getVal()),
      '/=': (v) => (assignVar.setVal(assignVar.getVal() / v), assignVar.getVal()),
      '%=': (v) => (assignVar.setVal(assignVar.getVal() % v), assignVar.getVal())
    })[operator](evaluate(right, scope));
  },
  ForStatement: (node: ESTree.ForStatement, scope: Scope) => {
    const { init, test, update, body } = node;
    const loopScope = new Scope('loop', scope);

    for (
      init ? evaluate(init, loopScope) : undefined;
      test ? evaluate(test, loopScope) : true;
      update ? evaluate(update, loopScope) : undefined) {
      const result = evaluate(body, loopScope);
      if (Signal.isBreak(result)) break;
      else if (Signal.isContinue(result)) continue;
      else if (Signal.isReturn(result)) return result.result;
    }
  },
  WhileStatement: (node: ESTree.WhileStatement, scope: Scope) => {
    const { test, body } = node;

    while (evaluate(test, scope)) {
      const result = evaluate(body, scope);

      if (Signal.isBreak(result)) break;
      if (Signal.isContinue(result)) continue;
      if (Signal.isReturn(result)) return result.result;
    }
  },
  DoWhileStatement: (node: ESTree.DoWhileStatement, scope: Scope) => {
    const { test, body } = node;
    
    do {
      const result = evaluate(body, scope);

      if (Signal.isBreak(result)) break;
      if (Signal.isContinue(result)) continue;
      if (Signal.isReturn(result)) return result.result;
    } while (evaluate(test, scope));
  },
  ForInStatement: (node: ESTree.ForInStatement, scope: Scope) => {
    const { left, right, body } = node;

    const declar = (<ESTree.VariableDeclaration>left).declarations[0];
    const kind = (<ESTree.VariableDeclaration>left).kind;
    const name = (<ESTree.Identifier>declar.id).name;

    for (const value in evaluate(right, scope)) {
      scope.declare(kind, name, value);

      const result = evaluate(body, scope);
      if (Signal.isBreak(result)) break;
      if (Signal.isContinue(result)) continue;
      if (Signal.isReturn(result)) return result.result;      
    }
  },
  UpdateExpression: (node: ESTree.UpdateExpression, scope: Scope) => {
    const { operator, argument, prefix } = node;

    // 待改变的变量
    // TODO 目前只考虑var，后续需要考虑const的情况
    let updateVar: { getVal(): any, setVal(v: string): boolean };

    if (argument.type === 'Identifier') {
      const rawName = argument.name;
      const variable = scope.search(rawName);
      if (!variable) throw `${TAG} ${rawName} is not defined`;
      else updateVar = variable;
    } else if (argument.type === 'MemberExpression') {
      const { object, property, computed } = (<ESTree.MemberExpression>argument);
      const obj = evaluate(object, scope);
      const key = computed ? evaluate(property, scope) : (<ESTree.Identifier>property).name;

      updateVar = {
        getVal() {
          return obj[key];
        },
        setVal(v) {
          obj[key] = v;
          return true;
        }
      };
    } else throw `${TAG} unknow update expression`;

    return ({
      '++': (v) => {
        const source = v.getVal();
        v.setVal(source + 1);
        return prefix ? v.getVal() : source; 
      },
      '--': (v) => {
        const source = v.getVal();
        v.setVal(source - 1);
        return prefix ? v.getVal() : source;
      }
    })[operator](updateVar);
  },
  BreakStatement: () => {
    return new Signal('break');
  },
  ContinueStatement: () => {
    return new Signal('continue');
  },
  ReturnStatement: (node: ESTree.ReturnStatement, scope: Scope) => {
    return new Signal('return', node.argument ? evaluate(node.argument, scope) : undefined);
  },
  IfStatement: (node: ESTree.IfStatement, scope: Scope) => {
    const { test, consequent, alternate } = node;

    const testResult = evaluate(test, scope);

    if (testResult) return evaluate(consequent, scope);
    else return alternate ? evaluate(alternate, scope) : undefined;
  },
  FunctionExpression: (node: ESTree.FunctionExpression, scope: Scope) => {
    const { params, body } = node;
    const newScope = new Scope('function', scope, true);
    return function(...args) {
      params.forEach((param, index) => {
        newScope.const((<ESTree.Identifier>param).name, args[index]);
      });
      newScope.const('arguments', arguments);

      newScope.const('this', this);

      const result = evaluate(body, newScope);

      if (result instanceof Signal) {
        return result.value;
      } else {
        return result
      }
    }
  },
  FunctionDeclaration: (node: ESTree.FunctionDeclaration, scope: Scope) => {
    const { name } = node.id;

    const func = vistorsMap.FunctionExpression(<any>node, scope);

    if (!scope.const(name, func)) throw `${TAG} function ${name} has defined`;
  }
};

export function evaluate(node: ESTree.Node, scope) {
  const visitor = vistorsMap[node.type];

  return visitor(node, scope);
}
