import * as ESTree from 'estree';
import { TAG } from './utils';

const vistorsMap = {
  Program: (node: ESTree.Program, scope) => {
    node.body.forEach((bodyNode) => {
      evaluate(bodyNode, scope);
    });
  },
  ExpressionStatement: (node: ESTree.ExpressionStatement, scope) => {
    evaluate(node.expression, scope);
  },
  BinaryExpression: (node: ESTree.BinaryExpression, scope) => {
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
  Literal: (node: ESTree.Literal, scope) => {
    return node.value;
  },
  CallExpression: (node: ESTree.CallExpression, scope) => {

  }
};

export function evaluate(node: ESTree.Node, scope): void {
  const visitor = vistorsMap[node.type];

  return visitor(node, scope);
}
