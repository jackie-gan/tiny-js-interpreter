import { KindType } from '../types/type';
import { TAG } from './utils';

interface VarInterface {
  getVal(): any
  setVal(value: any): boolean
}

export class Var implements VarInterface {
  constructor(public kind: KindType, private value: any) {}

  public getVal(): any {
    return this.value;
  }

  public setVal(value: any): boolean {
    if (this.kind === 'const') {
      return false;
    } else {
      this.value = value;
      return true;
    }
  }
}