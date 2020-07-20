import * as ESTree from 'estree';
import { AstPath } from '../../types/type';
import { Scope } from '../scope';
import { Signal } from '../signal';

export const es6 = {
  ArrowFunctionExpression: (astPath: AstPath<ESTree.ArrowFunctionExpression>) => {
    const { node, scope, evaluate } = astPath;
    const { body, params } = node;

    const newScope = new Scope('function', scope);

    const func = (...args) => {
      // 形参
      const paramLen = params.length;
      for (let i = 0; i < paramLen; i++) {
        const { name } = (<ESTree.Identifier>params[i]);
        newScope.const(name, args[i]);
      }

      newScope.const('arguments', args);

      const result = evaluate({ node: body, scope: newScope, evaluate });

      if (result instanceof Signal) {
        return result.value;
      } else {
        return result
      }
    }

    Object.defineProperty(func, 'length', {
      value: params.length || 0,
      writable: false,
      enumerable: false,
      configurable: true
    });

    return func;
  },
  SpreadElement: (astPath: AstPath<ESTree.SpreadElement>) => {
    const { node, scope, evaluate } = astPath;
    const { argument } = node;

    return evaluate({ node: argument, scope, evaluate });
  },
  TemplateLiteral: (astPath: AstPath<ESTree.TemplateLiteral>) => {
    const { node, scope, evaluate } = astPath;
    const { expressions, quasis } = node;

    const templateLen = expressions.length + quasis.length;
    let res = '';
    for (let i = 0, j = 0, k = 0; i < templateLen; i++) {
      let val = i % 2 === 0 ? evaluate({ node: quasis[j++], scope, evaluate }) : evaluate({ node: expressions[k++], scope, evaluate });
      res += val;
    }
    return res;
  },
  TemplateElement: (astPath: AstPath<ESTree.TemplateElement>) => {
    const { node } = astPath;
    const { value } = node;
    return value.raw;
  }
};