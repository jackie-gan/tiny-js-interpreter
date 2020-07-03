import * as ESTree from 'estree';
import { AstPath } from '../types/type';
import { es5 } from './es/es5';

const vistorsMap = {
  ...es5
};

export function evaluate(astPath: AstPath<ESTree.Node>) {
  const visitor = vistorsMap[astPath.node.type];

  return visitor(astPath);
}
