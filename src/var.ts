import { KindType } from '../types/type';

export interface IVar {
  getVal(): any
  setVal(value: unknown): boolean
}

/**
 * 定义变量记录，方便做读写控制
 */
export class Var implements IVar {
    constructor(public kind: KindType, private value: unknown) {}

    public getVal(): any {
        return this.value;
    }

    public setVal(value: unknown): boolean {
        // 类型为 const，不设置值
        if (this.kind === 'const') {
            return false;
        } else {
            this.value = value;
            return true;
        }
    }
}