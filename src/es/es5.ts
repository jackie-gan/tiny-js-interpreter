import * as ESTree from 'estree';
import { AstPath } from '../../types/type';
import { TAG } from '../utils';
import { Scope } from '../scope';
import { Signal } from '../signal';

export const es5 = {
  Program: (astPath: AstPath<ESTree.Program>) => {
    const { node, scope, evaluate } = astPath; 
    node.body.forEach((bodyNode) => {
      evaluate({ node: bodyNode, scope, evaluate });
    });
  },
  ExpressionStatement: (astPath: AstPath<ESTree.ExpressionStatement>) => {
    const { node, scope, evaluate } = astPath;
    evaluate({ node: node.expression, scope, evaluate });
  },
  BlockStatement: (astPath: AstPath<ESTree.BlockStatement>) => {
    const { node, scope, evaluate } = astPath;
    const blockScope = scope.invasive ? scope : new Scope('block', scope);

    const { body } = node;
    const len = body.length;

    for (let i = 0; i < len; i++ ) {
      const result = evaluate({ node: body[i], scope: blockScope, evaluate });

      if (Signal.isBreak(result) || Signal.isContinue(result) || Signal.isReturn(result)) {
        return result;
      }
    }
  },
  ThisExpression: (astPath: AstPath<ESTree.ThisExpression>) => {
    const { scope } = astPath;
    const thisVariable = scope.search('this');
    return thisVariable ? thisVariable.getVal() : null;
  },
  ObjectExpression: (astPath: AstPath<ESTree.ObjectExpression>) => {
    const { node, scope, evaluate } = astPath;
    const result = {};

    node.properties.forEach((property) => {
      const { kind, key, value } = (<ESTree.Property>property);

      let objKey;

      if (key.type === 'Identifier') {
        objKey = key.name;
      } else if (key.type === 'Literal') {
        objKey = key.value;
      } else throw `${TAG} illegal object key`;

      const objVal = evaluate({ node: value, scope, evaluate });

      if (kind === 'init') {
        result[objKey] = objVal;
      } else if (kind === 'set') {
        Object.defineProperty(result, objKey, {
          set: objVal
        });
      } else if (kind === 'get') {
        Object.defineProperty(result, objKey, {
          get: objVal
        });
      } else throw `${TAG} unknow object expression kind`;
    });

    return result;
  },
  BinaryExpression: (astPath: AstPath<ESTree.BinaryExpression>) => {
    const { node, scope, evaluate } = astPath;
    const leftVal = evaluate({ node: node.left, scope, evaluate });
    const rightVal = evaluate({ node: node.right, scope, evaluate });
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
  Literal: (astPath: AstPath<ESTree.Literal>) => {
    const { node } = astPath;
    if ((<ESTree.RegExpLiteral>node).regex) {
      const { pattern, flags } = (<ESTree.RegExpLiteral>node).regex;
      return new RegExp(pattern, flags);
    } else return node.value;
  },
  Identifier: (astPath: AstPath<ESTree.Identifier>) => {
    const { node, scope } = astPath;
    const rawName = node.name;
    const variable = scope.search(rawName);
    if (variable) return variable.getVal();
    else throw `${TAG} ${rawName} is not defined`; 
  },
  VariableDeclaration: (astPath: AstPath<ESTree.VariableDeclaration>) => {
    const { node, scope, evaluate } = astPath;
    node.declarations.forEach((declar) => {
      evaluate({ node: declar, scope, evaluate });
    });
  },
  VariableDeclarator: (astPath: AstPath<ESTree.VariableDeclarator>) => {
    const { node, scope, evaluate } = astPath;
    const { id, init } = node;
    const key = (<ESTree.Identifier>id).name;
    const value = init ? evaluate({ node: init, scope, evaluate }) : undefined;
    if (!scope.var(key, value)) {
      throw `${TAG} ${key} has defined`;
    }
  },
  MemberExpression: (astPath: AstPath<ESTree.MemberExpression>) => {
    const { node, scope, evaluate } = astPath;
    const { object, property, computed } = node;

    // computed 为 true，表示为object[property]，即property不是Identifier
    const prop = computed ? evaluate({ node: property, scope, evaluate }) : (<ESTree.Identifier>property).name;

    const obj = evaluate({ node: object, scope, evaluate });

    return obj[prop];
  },
  CallExpression: (astPath: AstPath<ESTree.CallExpression>) => {
    const { node, scope, evaluate } = astPath;
    const { callee } = node;
    const func = evaluate({ node: callee, scope, evaluate });
    const args = node.arguments.map((argument) => evaluate({ node: argument, scope, evaluate }));

    if (typeof func !== 'function') throw `${TAG} callee ${String(func)} is not a function`;

    // 查找 context
    if (callee.type === 'MemberExpression') {
      const context = evaluate({ node: callee.object, scope, evaluate });
      return func.apply(context, args);
    } else {
      const context = scope.search('this');
      return func.apply(context ? context.getVal() : null, args);
    }
  },
  WithStatement: () => {
    throw `${TAG} WithStatement is not implement`;
  },
  AssignmentExpression: (astPath: AstPath<ESTree.AssignmentExpression>) => {
    const { node, scope, evaluate } = astPath;
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
      const obj = evaluate({ node: object, scope, evaluate });
      const key = computed ? evaluate({ node: property, scope, evaluate }) : (<ESTree.Identifier>property).name;

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
    })[operator](evaluate({ node: right, scope, evaluate }));
  },
  ForStatement: (astPath: AstPath<ESTree.ForStatement>) => {
    const { node, scope, evaluate } = astPath;
    const { init, test, update, body } = node;
    const loopScope = new Scope('loop', scope);

    for (
      init ? evaluate({ node: init, scope: loopScope, evaluate }) : undefined;
      test ? evaluate({ node: test, scope: loopScope, evaluate }) : true;
      update ? evaluate({ node: update, scope: loopScope, evaluate }) : undefined) {
      const result = evaluate({ node: body, scope: loopScope, evaluate });
      if (Signal.isBreak(result)) break;
      else if (Signal.isContinue(result)) continue;
      else if (Signal.isReturn(result)) return result.result;
    }
  },
  WhileStatement: (astPath: AstPath<ESTree.WhileStatement>) => {
    const { node, scope, evaluate } = astPath;
    const { test, body } = node;

    while (evaluate({ node: test, scope, evaluate })) {
      const result = evaluate({ node: body, scope, evaluate });

      if (Signal.isBreak(result)) break;
      if (Signal.isContinue(result)) continue;
      if (Signal.isReturn(result)) return result.result;
    }
  },
  DoWhileStatement: (astPath: AstPath<ESTree.DoWhileStatement>) => {
    const { node, scope, evaluate } = astPath;
    const { test, body } = node;
    
    do {
      const result = evaluate({ node: body, scope, evaluate });

      if (Signal.isBreak(result)) break;
      if (Signal.isContinue(result)) continue;
      if (Signal.isReturn(result)) return result.result;
    } while (evaluate({ node:test, scope, evaluate }));
  },
  ForInStatement: (astPath: AstPath<ESTree.ForInStatement>) => {
    const { node, scope, evaluate } = astPath;
    const { left, right, body } = node;

    const declar = (<ESTree.VariableDeclaration>left).declarations[0];
    const kind = (<ESTree.VariableDeclaration>left).kind;
    const name = (<ESTree.Identifier>declar.id).name;
    const rightVal = evaluate({ node: right, scope, evaluate });

    for (const value in rightVal) {
      scope.declare(kind, name, value);

      const result = evaluate({ node: body, scope, evaluate });
      if (Signal.isBreak(result)) break;
      if (Signal.isContinue(result)) continue;
      if (Signal.isReturn(result)) return result.result;      
    }
  },
  UpdateExpression: (astPath: AstPath<ESTree.UpdateExpression>) => {
    const { node, scope, evaluate } = astPath;
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
      const obj = evaluate({ node: object, scope, evaluate });
      const key = computed ? evaluate({ node: property, scope, evaluate }) : (<ESTree.Identifier>property).name;

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
  ReturnStatement: (astPath: AstPath<ESTree.ReturnStatement>) => {
    const { node, scope, evaluate } = astPath;
    return new Signal('return', node.argument ? evaluate({ node: node.argument, scope, evaluate }) : undefined);
  },
  IfStatement: (astPath: AstPath<ESTree.IfStatement>) => {
    const { node, scope, evaluate } = astPath;
    const { test, consequent, alternate } = node;

    const testResult = evaluate({ node: test, scope, evaluate });

    if (testResult) return evaluate({ node: consequent, scope, evaluate });
    else return alternate ? evaluate({ node: alternate, scope, evaluate }) : undefined;
  },
  FunctionExpression: (astPath: AstPath<ESTree.FunctionExpression>) => {
    const { node, scope, evaluate } = astPath;
    const { params, body } = node;
    const newScope = new Scope('function', scope, true);
    return function(...args) {
      params.forEach((param, index) => {
        newScope.const((<ESTree.Identifier>param).name, args[index]);
      });
      newScope.const('arguments', arguments);

      newScope.const('this', this);

      const result = evaluate({ node: body, scope: newScope, evaluate });

      if (result instanceof Signal) {
        return result.value;
      } else {
        return result
      }
    }
  },
  FunctionDeclaration: (astPath: AstPath<ESTree.FunctionDeclaration>) => {
    const { node, scope } = astPath;
    const { name } = node.id;

    const func = es5.FunctionExpression(<any>astPath);

    if (!scope.const(name, func)) throw `${TAG} function ${name} has defined`;
  },
  ThrowStatement: (astPath: AstPath<ESTree.ThrowStatement>) => {
    const { node, scope, evaluate } = astPath;
    throw evaluate({ node: node.argument, scope, evaluate });
  },
  TryStatement: (astPath: AstPath<ESTree.TryStatement>) => {
    // TODO 缺少catch或finally的时候，抛错
    const { node, scope, evaluate } = astPath;
    try {
      return evaluate({ node: node.block, scope, evaluate });
    } catch (e) {
      if (node.handler) {
        const { param, body } = node.handler;
        const newScope = new Scope('block', scope);
        scope.const((<ESTree.Identifier>param).name, e);
        return evaluate({ node: body, scope: newScope, evaluate });
      } else {
        // 没有写catch，则继续抛错
        throw e;
      }
    } finally {
      if (node.finalizer) return evaluate({ node: node.finalizer, scope, evaluate });
    }
  },
  ConditionalExpression: (astPath: AstPath<ESTree.ConditionalExpression>) => {
    const { node, scope, evaluate } = astPath;
    const { test, consequent, alternate } = node;
    return evaluate({ node: test, scope, evaluate }) ? 
      evaluate({ node: consequent, scope, evaluate }) : evaluate({ node: alternate, scope, evaluate });
  },
  LogicalExpression: (astPath: AstPath<ESTree.LogicalExpression>) => {
    const { node, scope, evaluate } = astPath;
    const { left, operator, right } = node;

    const leftVal = evaluate({ node: left, scope, evaluate });
    const rightVal = evaluate({ node: right, scope, evaluate });

    return {
      '||': (l, r) => l || r,
      '&&': (l, r) => l && r 
    }[operator](leftVal, rightVal);
  },
  DebuggerStatement: (astPath: AstPath<ESTree.DebuggerStatement>) => {
    debugger;
  }
};