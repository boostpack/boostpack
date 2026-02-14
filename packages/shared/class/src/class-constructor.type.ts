// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassConstructor<T = any> = abstract new (...args: any[]) => T;
