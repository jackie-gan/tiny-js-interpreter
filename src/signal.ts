type SignalType = 'break' | 'continue' | 'return';

export class Signal {
  public type: SignalType
  public value?: any

  constructor(type: SignalType, value?: any) {
    this.type = type;
    this.value = value;
  }

  private static check(v, t): boolean {
    return v instanceof Signal && v.type === t;
  }

  public static isContinue(v): boolean {
    return this.check(v, 'continue');
  }

  public static isBreak(v): boolean {
    return this.check(v, 'break');
  }

  public static isReturn(v): boolean {
    return this.check(v, 'return');
  }
}