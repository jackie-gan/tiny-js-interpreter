import * as ESTree from 'estree';
import { TAG } from './utils';
import { Scope } from './scope';

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
  MemberExpression: (node: ESTree.MemberExpression, scope: Scope) => {
    const { object, property, computed } = node;

    // computed 为 true，表示为object[property]，即property不是Identifier
    if (computed) {
      return evaluate(object, scope)[evaluate(property, scope)];
    } else {
      return evaluate(object, scope)[(<ESTree.Identifier>property).name];
    }
  },
  CallExpression: (node: ESTree.CallExpression, scope: Scope) => {
    const { callee } = node;
    const func = evaluate(callee, scope);
    const args = node.arguments.map((argument) => evaluate(argument, scope));

    if (typeof func !== 'function') throw `${TAG} callee ${String(func)} is not a function`;

    // 查找this
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
  }
};

export function evaluate(node: ESTree.Node, scope) {
  const visitor = vistorsMap[node.type];

  return visitor(node, scope);
}
