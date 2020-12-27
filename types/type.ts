import { Scope } from '../src/scope';

export type VistorFuncType = any;

export type EvaluateType = (path: Record<string, unknown>) => any;

export type AstPath<T> = {
    node: T,
    evaluate: EvaluateType,
    scope: Scope
} 

export type ScopeType = 'root' | 'function' | 'block';

export type KindType = "var" | "const" | "let";
