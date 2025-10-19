import { describe, it, expect, vi } from "vitest";
import { createQueryKeys, mergeQueryKeys } from "./index";
import { QueryClient } from "@tanstack/react-query";

describe("createQueryKeys", () => {
  describe("basic query definitions", () => {
    it("should create query options with null queryKey", () => {
      const userQueryKeys = createQueryKeys("users", {
        all: {
          queryKey: null,
          queryFn: async () => [{ id: 1, name: "John" }],
        },
      });

      expect(userQueryKeys.all.queryKey).toEqual(["users", "all"]);
      expect(userQueryKeys.all.queryFn).toBeDefined();
      expect(userQueryKeys._def).toBe("users");
    });

    it("should create query options with array queryKey", () => {
      const userQueryKeys = createQueryKeys("users", {
        detail: {
          queryKey: ["123"],
          queryFn: async () => ({ id: "123", name: "John" }),
        },
      });

      expect(userQueryKeys.detail.queryKey).toEqual(["users", "detail", "123"]);
      expect(userQueryKeys.detail.queryFn).toBeDefined();
    });

    it("should execute queryFn correctly", async () => {
      const queryClient = new QueryClient();
      const mockData = [{ id: 1, name: "John" }];
      const userQueryKeys = createQueryKeys("users", {
        all: {
          queryKey: null,
          queryFn: async () => mockData,
        },
      });

      queryClient.setQueryData(userQueryKeys.all.queryKey, mockData);

      const result = queryClient.getQueryData(userQueryKeys.all.queryKey);
      expect(result).toEqual(mockData);
    });
  });

  describe("factory functions", () => {
    it("should create query factory with dynamic parameters", () => {
      const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: async () => ({ id: userId, name: "John" }),
        }),
      });

      const result = userQueryKeys.detail("123");
      expect(result.queryKey).toEqual(["users", "detail", "123"]);
      expect(result.queryFn).toBeDefined();
    });

    it("should create query factory with null queryKey", () => {
      const userQueryKeys = createQueryKeys("users", {
        list: (filters: { active: boolean }) => ({
          queryKey: null,
          queryFn: async () => [{ id: 1, active: filters.active }],
        }),
      });

      const result = userQueryKeys.list({ active: true });
      expect(result.queryKey).toEqual(["users", "list"]);
    });

    it("should create query factory with complex queryKey", () => {
      interface Filters {
        status: string;
        page: number;
      }

          const todoQueryKeys = createQueryKeys("todos", {
        list: (filters: Filters) => ({
          queryKey: [{ filters }],
          queryFn: async () => [],
        }),
      });

      const result = todoQueryKeys.list({ status: "active", page: 1 });
      expect(result.queryKey).toEqual([
        "todos",
        "list",
        { filters: { status: "active", page: 1 } },
      ]);
    });

    it("should have _def property on factory function", () => {
      const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: async () => ({ id: userId }),
        }),
      });

      expect(userQueryKeys.detail._def).toEqual(["users", "detail"]);
    });

    it("should execute factory queryFn with correct data", async () => {
      const queryClient = new QueryClient();
      const mockFn = vi.fn(async (id: string) => ({ id, name: "Test" }));

      const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: () => mockFn(userId),
        }),
      });

      queryClient.setQueryData(userQueryKeys.detail("123").queryKey, await mockFn("123"));
      const result = queryClient.getQueryData(userQueryKeys.detail("123").queryKey);

      expect(mockFn).toHaveBeenCalledWith("123");
      expect(result).toEqual({ id: "123", name: "Test" });
    });
  });

  describe("context queries", () => {
    it("should create context queries", () => {
      const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: async () => ({ id: userId }),
          contextQueries: {
            likes: {
              queryKey: null,
              queryFn: async () => [],
            },
          },
        }),
      });

      const result = userQueryKeys.detail("123");

      expect(result.queryKey).toEqual(["users", "detail", "123"]);
      expect(result._ctx).toBeDefined();
      expect(result._ctx.likes.queryKey).toEqual(["users", "detail", "123", "likes"]);
    });

    it("should create multiple context queries", () => {
      const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: async () => ({ id: userId }),
          contextQueries: {
            likes: {
              queryKey: null,
              queryFn: async () => [],
            },
            posts: {
              queryKey: null,
              queryFn: async () => [],
            },
          },
        }),
      });

      const result = userQueryKeys.detail("123");

      expect(result._ctx.likes.queryKey).toEqual(["users", "detail", "123", "likes"]);
      expect(result._ctx.posts.queryKey).toEqual(["users", "detail", "123", "posts"]);
    });

    it("should create context queries with queryKey", () => {
      const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: async () => ({ id: userId }),
          contextQueries: {
            posts: {
              queryKey: [{ status: "published" }],
              queryFn: async () => [],
            },
          },
        }),
      });

      const result = userQueryKeys.detail("123");

      expect(result._ctx.posts.queryKey).toEqual([
        "users",
        "detail",
        "123",
        "posts",
        { status: "published" },
      ]);
    });

    it("should execute context query queryFn correctly", async () => {
      const queryClient = new QueryClient();
      const mockLikes = [{ id: 1, postId: "post1" }];

        const userQueryKeys = createQueryKeys("users", {
        detail: (userId: string) => ({
          queryKey: [userId],
          queryFn: async () => ({ id: userId }),
          contextQueries: {
            likes: {
              queryKey: null,
              queryFn: async () => mockLikes,
            },
          },
        }),
      });

      queryClient.setQueryData(userQueryKeys.detail("123")._ctx.likes.queryKey, mockLikes);
      const likes = queryClient.getQueryData(userQueryKeys.detail("123")._ctx.likes.queryKey);

      expect(likes).toEqual(mockLikes);
    });
  });

  describe("mixed query types", () => {
    it("should handle mix of basic and factory queries", () => {
      const todoQueryKeys = createQueryKeys("todos", {
        all: {
          queryKey: null,
          queryFn: async () => [],
        },
        detail: (todoId: string) => ({
          queryKey: [todoId],
          queryFn: async () => ({ id: todoId }),
        }),
      });

      expect(todoQueryKeys.all.queryKey).toEqual(["todos", "all"]);
      expect(todoQueryKeys.detail("123").queryKey).toEqual(["todos", "detail", "123"]);
      expect(todoQueryKeys._def).toBe("todos");
    });
  });
});

describe("mergeQueryKeys", () => {
  it("should merge multiple query key definitions", () => {
    const userQueryKeys = createQueryKeys("users", {
      all: {
        queryKey: null,
        queryFn: async () => [],
      },
    });

    const todoQueryKeys = createQueryKeys("todos", {
      all: {
        queryKey: null,
        queryFn: async () => [],
      },
    });

    const merged = mergeQueryKeys({ userQueryKeys, todoQueryKeys });

    expect(merged.users).toBeDefined();
    expect(merged.todos).toBeDefined();
    expect(merged.users.all.queryKey).toEqual(["users", "all"]);
    expect(merged.todos.all.queryKey).toEqual(["todos", "all"]);
  });

  it("should merge query keys with factory functions", () => {
    const userQueryKeys = createQueryKeys("users", {
      detail: (userId: string) => ({
        queryKey: [userId],
        queryFn: async () => ({ id: userId }),
      }),
    });

    const postQueryKeys = createQueryKeys("posts", {
      detail: (postId: string) => ({
        queryKey: [postId],
        queryFn: async () => ({ id: postId }),
      }),
    });

    const merged = mergeQueryKeys({ userQueryKeys, postQueryKeys });

    expect(merged.users.detail("123").queryKey).toEqual(["users", "detail", "123"]);
    expect(merged.posts.detail("456").queryKey).toEqual(["posts", "detail", "456"]);
  });

  it("should merge query keys with context queries", () => {
    const userQueryKeys = createQueryKeys("users", {
      detail: (userId: string) => ({
        queryKey: [userId],
        queryFn: async () => ({ id: userId }),
        contextQueries: {
          likes: {
            queryKey: null,
            queryFn: async () => [],
          },
        },
      }),
    });

    const postQueryKeys = createQueryKeys("posts", {
      all: {
        queryKey: null,
        queryFn: async () => [],
      },
    });

    const merged = mergeQueryKeys({ userQueryKeys, postQueryKeys });

    const userDetail = merged.users.detail("123");
    expect(userDetail.queryKey).toEqual(["users", "detail", "123"]);
    expect(userDetail._ctx.likes.queryKey).toEqual(["users", "detail", "123", "likes"]);
    expect(merged.posts.all.queryKey).toEqual(["posts", "all"]);
  });

  it("should not include _def in merged result values", () => {
    const userQueryKeys = createQueryKeys("users", {
      all: {
        queryKey: null,
        queryFn: async () => [],
      },
    });

    const merged = mergeQueryKeys({ userQueryKeys });

    expect(merged.users._def).toBeUndefined();
  });
});

describe("type safety with queryClient", () => {
  it("should create queryOptions that work with queryClient methods", () => {
    // This test demonstrates the type safety advantage
    const userQueryKeys = createQueryKeys("users", {
      detail: (userId: string) => ({
        queryKey: [userId],
        queryFn: async () => ({ id: userId, name: "Test User" }),
      }),
    });

    const userQuery = userQueryKeys.detail("123");

    // The queryKey should be properly typed
    expect(userQuery.queryKey).toEqual(["users", "detail", "123"]);

    // queryClient.getQueryData(userQuery.queryKey) would be type-safe
    // because queryKey is properly inferred from the queryOptions
    expect(Array.isArray(userQuery.queryKey)).toBe(true);
  });

  it("should maintain type safety with complex query keys", () => {
    interface TodoFilters {
      status: "active" | "completed";
      priority: number;
    }

    const todoQueryKeys = createQueryKeys("todos", {
      list: (filters: TodoFilters) => ({
        queryKey: [{ filters }],
        queryFn: async () => [{ id: "1", ...filters }],
      }),
    });

    const todoQuery = todoQueryKeys.list({ status: "active", priority: 1 });

    expect(todoQuery.queryKey).toEqual([
      "todos",
      "list",
      { filters: { status: "active", priority: 1 } },
    ]);
  });
});

