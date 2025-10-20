import { queryOptions } from "@tanstack/react-query";
import type { QueryConfig, QueryResult } from "./types";

export const buildQuery = <T extends QueryConfig>(key: readonly unknown[], config: T): QueryResult<T> => {
  const result = queryOptions({ queryKey: key, queryFn: config.queryFn });
  if (!config.contextQueries) return result as unknown as QueryResult<T>;

  const ctx = Object.entries(config.contextQueries).reduce((acc, [k, c]) => {
    acc[k] = buildQuery([...key, k, ...(c.queryKey ?? [])], c);
    return acc;
  }, {} as Record<string, any>);

  return { ...result, _ctx: ctx } as unknown as QueryResult<T>;
};
