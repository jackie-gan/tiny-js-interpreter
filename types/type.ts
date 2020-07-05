import { Scope } from '../src/scope';

export type AstPath<T> = {
  node: T,
  evaluate: (path: Object) => any,
  scope: Scope
} 

export type ScopeType = 'root' | 'function' | 'block';

export type KindType = "var" | "const" | "let";
