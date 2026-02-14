import { ClassConstructor } from './class-constructor.type';

export type OptionalClassConstructor<T = unknown> = ClassConstructor<T> | undefined;
