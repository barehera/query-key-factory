import { queryOptions } from "@tanstack/react-query";

export type AnyQueryFn = (...args: any[]) => unknown;

export  type EnsureQueryFn<T> = T extends { queryFn?: infer TFn }
  ? Omit<T, "queryFn"> & { queryFn: Extract<NonNullable<TFn>, AnyQueryFn> }
  : T;

export type BaseQueryConfig<TData = unknown> = {
  queryKey: readonly unknown[] | null;
  queryFn: () => Promise<TData>;
};

export type QueryConfigWithContext<TData = unknown> = BaseQueryConfig<TData> & {
  contextQueries: Record<string, BaseQueryConfig>;
};

export type QueryConfig = BaseQueryConfig | QueryConfigWithContext;

export type NormalizedQueryOptions<TData> = EnsureQueryFn<ReturnType<typeof queryOptions<TData>>>;

export type InferBaseConfigData<TConfig> = TConfig extends BaseQueryConfig<infer TData> ? TData : never;

export type InferQueryConfigData<TConfig extends QueryConfig> = TConfig extends QueryConfigWithContext<infer TData>
  ? TData
  : TConfig extends BaseQueryConfig<infer TData>
    ? TData
    : never;

export type CreateQueryResult<TConfig extends QueryConfig> =
  TConfig extends QueryConfigWithContext<infer TData>
    ? NormalizedQueryOptions<TData> & {
        _ctx: {
          [K in keyof TConfig["contextQueries"]]: TConfig["contextQueries"][K] extends BaseQueryConfig<
            infer TCtxData
          >
            ? NormalizedQueryOptions<TCtxData>
            : never;
        };
      }
    : TConfig extends BaseQueryConfig<infer TData>
      ? NormalizedQueryOptions<TData>
      : never;

export type QueryFactory = (...args: any[]) => QueryConfig;

export type QueryDefinition = QueryConfig | QueryFactory;

export type InferQueryResult<T extends QueryDefinition> = T extends (...args: infer TArgs) => infer TReturn
  ? TReturn extends QueryConfig
    ? ((...args: TArgs) => CreateQueryResult<TReturn>) & { _def: readonly [string, string] }
    : never
  : T extends QueryConfig
    ? CreateQueryResult<T>
    : never;

export type TransformQueries<T extends Record<string, QueryDefinition>> = {
  [K in keyof T]: InferQueryResult<T[K]>;
} & { _def: string };


