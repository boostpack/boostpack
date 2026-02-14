// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OptionalClassInstance<C> = C extends new (...args: any[]) => any ? InstanceType<C> : undefined;
