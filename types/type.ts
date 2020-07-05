import { Scope } from '../src/scope';

export type AstPath<T> = {
  node: T,
  evaluate: (path: Object) => any,
  scope: Scope
} 

export type ScopeType = 'root' | 'function' | 'block' | 'for' | 'for-in' | 'switch' | 'if';

export type KindType = "var" | "const" | "let";
