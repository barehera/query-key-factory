import { queryOptions } from "@tanstack/react-query";

export type QueryConfig<T = unknown> = {
  queryKey: readonly unknown[] | null;
  queryFn: () => T | Promise<T>;
  contextQueries?: Record<string, QueryConfig>;
};


export type QueryDefinition = QueryConfig | ((...args: any[]) => QueryConfig);

export type QueryResult<T extends QueryConfig> = Pick<
  ReturnType<typeof queryOptions<T["queryFn"] extends () => infer R ? R extends Promise<infer D> ? D : R : unknown>>,
  "queryKey"
> &
  (T extends { contextQueries: infer C }
    ? { _ctx: { [K in keyof C]: C[K] extends QueryConfig ? QueryResult<C[K]> : never } }
    : {});

export type QueryKeys<T extends Record<string, QueryDefinition>> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => QueryConfig
    ? ((...args: Args) => QueryResult<ReturnType<T[K]>>) & { _def: readonly [string, string] }
    : T[K] extends QueryConfig
      ? QueryResult<T[K]>
      : never;
} & { _def: string };

export type MergedQueryKeys<T extends Record<string, { _def: string }>> = {
  [K in T[keyof T]["_def"]]: Omit<Extract<T[keyof T], { _def: K }>, "_def"> & { _def: [K] };
};


