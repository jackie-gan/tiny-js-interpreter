import * as acorn from 'acorn';
import * as ESTree from 'estree';
import { evaluate } from './evaluate';
import { Scope } from './scope';
import { AstPath } from '../types/type';
import { defaultApis } from './utils';
import { Var } from './var';

export function execute(code: string, externalApis: Record<string, unknown> = {}): Var | null {
    // 根作用域
    const scope = new Scope('root');
    scope.const('this', null);

    for (const name of Object.getOwnPropertyNames(defaultApis)) {
        scope.const(name, defaultApis[name]);
    }

    for (const name of Object.getOwnPropertyNames(externalApis)) {
        scope.const(name, externalApis[name]);
    }

    // 模块导出，使用commonjs
    const $exports = {};
    const $module = { exports: $exports };
    scope.const('module', $module);
    scope.var('exports', $exports);

    // 使用acorn解析AST语法树
    const rootNode = acorn.parse(code, {
        sourceType: 'script'
    }) as ESTree.Node;

    const astPath: AstPath<ESTree.Node> = {
        node: rootNode,
        evaluate,
        scope
    }

    evaluate(astPath);

    // 导出结果
    const moduleExport = scope.search('module');

    return moduleExport ? moduleExport.getVal().exports : null;
}