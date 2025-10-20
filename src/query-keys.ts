import type { QueryDefinition, QueryKeys, MergedQueryKeys } from "./types";
import { buildQuery } from "./utils";

export const createQueryKeys = <TDef extends string, T extends Record<string, QueryDefinition>>(
  def: TDef,
  queries: T
): QueryKeys<T> & { _def: TDef } => {
  const result: any = { _def: def };

  for (const [k, q] of Object.entries(queries)) {
    if (typeof q === "function") {
      result[k] = Object.assign(
        (...args: any[]) => {
          const config = q(...args);
          const fullKey = config.queryKey ? [def, k, ...config.queryKey] : [def, k];
          return buildQuery(fullKey, config);
        },
        { _def: [def, k] as const }
      );
    } else {
      const fullKey = q.queryKey ? [def, k, ...q.queryKey] : [def, k];
      result[k] = buildQuery(fullKey, q);
    }
  }

  return result as QueryKeys<T> & { _def: TDef };
};

export const mergeQueryKeys = <T extends Record<string, { _def: string }>>(
  keys: T
): MergedQueryKeys<T> => {
  const merged: Record<string, any> = {};
  for (const k of Object.values(keys)) {
    const { _def, ...rest } = k;
    merged[_def] = { ...rest, _def: [_def] };
  }
  return merged as MergedQueryKeys<T>;
};


