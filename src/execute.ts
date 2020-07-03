const acorn = require('acorn');
import * as ESTree from 'estree';
import { evaluate } from './evaluate';
import { Scope } from './scope';
import { AstPath } from '../types/type';
import { defaultApis } from './utils';

export function execute(code: string, externalApis: any = {}) {
  const scope = new Scope('root');
  scope.const('this', null);

  for (const name of Object.getOwnPropertyNames(defaultApis)) {
    scope.const(name, defaultApis[name]);
  }

  for (const name of Object.getOwnPropertyNames(externalApis)) {
    scope.const(name, externalApis[name]);
  }

  const rootNode = acorn.parse(code, {
    sourceType: 'script'
  });

  const astPath: AstPath<ESTree.Node> = {
    node: rootNode,
    evaluate,
    scope
  }

  return evaluate(astPath);
}