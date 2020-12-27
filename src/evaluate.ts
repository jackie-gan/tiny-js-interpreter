import * as ESTree from 'estree';
import { AstPath, VistorFuncType } from '../types/type';
import { es5 } from './es/es5';
import { es6 } from './es/es6';

const vistorsMap = {
    ...es5,
    ...es6
};

export function evaluate(astPath: AstPath<ESTree.Node>): VistorFuncType {
    const visitor = vistorsMap[astPath.node.type];

    return visitor(astPath);
}
