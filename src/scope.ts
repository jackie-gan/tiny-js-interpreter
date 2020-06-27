import { ScopeType, VariableObject } from '../types/type';

/**
 * 形成执行上下文的三种情况：全局作用域、函数作用域、eval
 * 
 * 执行上下文中，会产生作用域Scope
 */
export class Scope {
  private parent: Scope | null;
  private content: { [key: string]: VariableObject };
  public invasive: boolean;

  constructor(public readonly type: ScopeType, parent?: Scope) {
    this.parent = parent || null;
    this.content = {};
    this.invasive = false;
  }

  public var(name: string, value: any) {
    this.content[name] = value;

    if (this.type) {

    }
  }
}