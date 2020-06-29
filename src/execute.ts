const acorn = require('acorn');
import { evaluate } from './evaluate';
import { Scope } from './scope'; 
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

  return evaluate(acorn.parse(code, {
    sourceType: 'script'
  }), scope);
}