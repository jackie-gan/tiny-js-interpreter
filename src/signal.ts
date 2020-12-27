type SignalType = 'break' | 'continue' | 'return';

export class Signal {
    public type: SignalType
    public value?: unknown

    constructor(type: SignalType, value?: unknown) {
        this.type = type;
        this.value = value;
    }

    private static check(v: unknown, t: unknown): boolean {
        return v instanceof Signal && v.type === t;
    }

    public static isContinue(v: unknown): boolean {
        return this.check(v, 'continue');
    }

    public static isBreak(v: unknown): boolean {
        return this.check(v, 'break');
    }

    public static isReturn(v: unknown): boolean {
        return this.check(v, 'return');
    }
}