import type {
  QueryDefinition,
  TransformQueries,
  InferQueryResult,
} from "./types";
import { isQueryFactory, buildQueryResult } from "./utils";

export const createQueryKeys = <TDef extends string, T extends Record<string, QueryDefinition>>(
  _def: TDef,
  queries: T
): TransformQueries<T> & { _def: TDef } => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(queries)) {
    if (isQueryFactory(value)) {
      const factoryFn = (...args: Parameters<typeof value>) => {
        const config = value(...args) as ReturnType<typeof value>;
        const baseKey: readonly unknown[] = [_def, key];
        const finalKey = (config.queryKey
          ? [...baseKey, ...config.queryKey]
          : baseKey) as readonly unknown[];

        return buildQueryResult(finalKey, config);
      };

      // Add _def to the factory function
      Object.defineProperty(factoryFn, "_def", {
        value: [_def, key],
        enumerable: false,
      });

      result[key] = factoryFn as InferQueryResult<typeof value>;
    } else {
      const baseKey: readonly unknown[] = [_def, key];
      const finalKey = (value.queryKey ? [...baseKey, ...value.queryKey] : baseKey) as readonly unknown[];

      result[key] = buildQueryResult(finalKey, value) as TransformQueries<T>[typeof key];
    }
  }

  result._def = _def;
  return result as TransformQueries<T> & { _def: TDef };
};

// Merge query keys by their _def property
export const mergeQueryKeys = <T extends Record<string, { _def: string }>>(
  queryKeys: T
): {
  [K in T[keyof T]["_def"]]: Extract<T[keyof T], { _def: K }>;
} => {
  const merged: Record<string, unknown> = {};

  for (const queryKey of Object.values(queryKeys)) {
    const { _def, ...rest } = queryKey;
    merged[_def] = rest;
  }

  return merged as {
    [K in T[keyof T]["_def"]]: Extract<T[keyof T], { _def: K }>;
  };
};


