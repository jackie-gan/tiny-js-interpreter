import * as ESTree from 'estree';
import { TAG } from './utils';
import { Scope } from './scope';
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
  BinaryExpression: (node: ESTree.BinaryExpression, scope: Scope) => {
    const leftVal = evaluate(node.left, scope);
    const rightVal = evaluate(node.right, scope);
    const operator = node.operator;

    const calculateFunc = {
      '+': (l, r) => l + r,
      '-': (l, r) => l - r,
      '*': (l, r) => l * r,
      '/': (l, r) => l / r,
      '%': (l, r) => l % r
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
    // TODO 使用Var，考虑const的情况，目前这里先不考虑
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
      const prop = computed ? evaluate(property, scope) : (<ESTree.Identifier>property).name;

      assignVar = {
        setVal(v) {
          obj[prop] = v;
          return true
        },
        getVal() {
          return obj[prop];
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
  }
};

export function evaluate(node: ESTree.Node, scope) {
  const visitor = vistorsMap[node.type];

  return visitor(node, scope);
}
