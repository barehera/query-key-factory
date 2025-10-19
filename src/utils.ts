import { queryOptions } from "@tanstack/react-query";
import type {
  QueryConfig,
  QueryConfigWithContext,
  QueryFactory,
  QueryDefinition,
  NormalizedQueryOptions,
  InferQueryConfigData,
  InferBaseConfigData,
  CreateQueryResult,
} from "./types";

export function isQueryFactory(value: QueryDefinition): value is QueryFactory {
  return typeof value === "function";
}

export function hasContextQueries(config: QueryConfig): config is QueryConfigWithContext {
  return "contextQueries" in config && config.contextQueries !== undefined;
}

export function createNormalizedOptions<TData>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
}): NormalizedQueryOptions<TData> {
  return queryOptions({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
  }) as NormalizedQueryOptions<TData>;
}

export function buildQueryResult<TConfig extends QueryConfig>(
  finalKey: readonly unknown[],
  config: TConfig
): CreateQueryResult<TConfig> {
  const queryResult = createNormalizedOptions<InferQueryConfigData<TConfig>>({
    queryKey: finalKey,
    queryFn: config.queryFn as () => Promise<InferQueryConfigData<TConfig>>,
  });

  if (hasContextQueries(config)) {
    const contextEntries = Object.entries(config.contextQueries).map(([ctxKey, ctxConfig]) => {
      const ctxFinalKey = (ctxConfig.queryKey
        ? [...finalKey, ctxKey, ...ctxConfig.queryKey]
        : [...finalKey, ctxKey]) as readonly unknown[];

      const ctxResult = createNormalizedOptions<InferBaseConfigData<typeof ctxConfig>>({
        queryKey: ctxFinalKey,
        queryFn: ctxConfig.queryFn as () => Promise<InferBaseConfigData<typeof ctxConfig>>,
      });

      return [ctxKey, ctxResult] as const;
    });

    const _ctx = Object.fromEntries(contextEntries) as CreateQueryResult<TConfig> extends {
      _ctx: infer TCtx;
    }
      ? TCtx
      : never;

    return { ...queryResult, _ctx } as unknown as CreateQueryResult<TConfig>;
  }

  return queryResult as CreateQueryResult<TConfig>;
}
