import * as ESTree from 'estree';
import { AstPath } from '../../types/type';

export const es6 = {
  ArrowFunctionExpression: (astPath: AstPath<ESTree.ArrowFunctionExpression>) => {
    const { node, scope, evaluate  } = astPath;
  }
};