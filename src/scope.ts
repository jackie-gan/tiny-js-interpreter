import { ScopeType, KindType } from '../types/type';
import { Var } from './var';

/**
 * 形成执行上下文的三种情况：全局作用域、函数作用域、eval
 * 
 * 执行上下文中，会产生作用域Scope
 */
export class Scope {
  private parent: Scope | null;
  private content: { [key: string]: Var };
  public invasive: boolean;

  constructor(public readonly type: ScopeType, parent?: Scope, invasive?: boolean) {
    this.parent = parent || null;
    this.content = {};
    this.invasive = invasive;
  }

  public var(rawName: string, value: any): boolean {
    let scope: Scope = this;

    while (scope.parent !== null && scope.type !== 'function') {
      scope = scope.parent;
    }

    if (scope.content.hasOwnProperty(rawName)) {
      // 新的值替换旧的值
      scope.content[rawName] = new Var('var', value);
    } else {
      // 新赋值
      scope.content[rawName] = new Var('var', value);
    }
    return true;
  }

  /**
   * 只在当前作用域定义
   */
  public const(rawName: string, value: any): boolean {
    if (!this.content.hasOwnProperty(rawName)) {
      this.content[rawName] = new Var('const', value);
      return true;
    } else {
      // 已经定义了
      return false;
    }
  }

  /**
   * 从作用域上查找变量
   */
  public search(rawName: string): Var | null {
    // 1.先从当前作用域查找
    if (this.content.hasOwnProperty(rawName)) {
      return this.content[rawName];
    // 2.如果没有，则继续往上级查找
    } else if (this.parent) {
      return this.parent.search(rawName);
    } else {
      return null
    }
  }

  public declare(kind: KindType, rawName: string, value: any): boolean {
    return ({
      'var': () => this.var(rawName, value),
      'const': () => this.const(rawName, value)
    })[kind]();
  }
}