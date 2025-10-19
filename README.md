<p align="center">
  <a href="https://github.com/barehera/query-key-factory" target="\_parent"><img src="https://images.emojiterra.com/mozilla/512px/1f3ed.png" alt="Factory emoji" height="130"></a>
</p>

<h1 align="center">Query Key Factory</h1>

<p align="center">
  <strong>Typesafe query key management for <a href="https://tanstack.com/query" target="\_parent">@tanstack/query</a> with complete type safety across queryClient.</strong>
</p>

<p align="center">
  Built with <code>queryOptions</code> wrapper to ensure type-safe query key management<br/>throughout your entire application, from definitions to queryClient methods.
</p>

---

> **Inspired by [@lukemorales/query-key-factory](https://github.com/lukemorales/query-key-factory)**  
> This package builds upon the excellent ideas from Luke Morales' query-key-factory, with a key enhancement: wrapping all query configurations with `queryOptions` from `@tanstack/react-query` to provide complete type safety when using `queryClient` methods like `getQueryData`, `setQueryData`, and `invalidateQueries`.

---

## 🎯 Why This Package?

The key difference from other query key management solutions is the use of **`queryOptions`** wrapper, which ensures:

- ✅ **Complete type safety** when using `queryClient.getQueryData(queryKey)` - TypeScript knows the exact return type
- ✅ **Type-safe mutations** with `queryClient.setQueryData(queryKey, data)` - TypeScript validates the data structure
- ✅ **Accurate invalidations** with `queryClient.invalidateQueries({ queryKey })` - no more runtime errors from mismatched keys
- ✅ **Better developer experience** with autocomplete for query keys and data types throughout your app

## 📦 Install

```bash
npm install @barehera/query-key-factory
```

```bash
yarn add @barehera/query-key-factory
```

```bash
pnpm add @barehera/query-key-factory
```

## ⚡ Quick Start

### Declare your queries colocated by features

```ts
// queries/users.ts
import { createQueryKeys } from "@barehera/query-key-factory";

export const users = createQueryKeys("users", {
  all: {
    queryKey: null,
    queryFn: async () => api.getUsers(),
  },
  detail: (userId: string) => ({
    queryKey: [userId],
    queryFn: async () => api.getUser(userId),
  }),
});

// queries/todos.ts
export const todos = createQueryKeys("todos", {
  detail: (todoId: string) => ({
    queryKey: [todoId],
    queryFn: async () => api.getTodo(todoId),
  }),
  list: (filters: TodoFilters) => ({
    queryKey: [{ filters }],
    queryFn: async () => api.getTodos(filters),
    contextQueries: {
      search: (query: string, limit = 15) => ({
        queryKey: [query, limit],
        queryFn: async () => api.searchTodos({ filters, query, limit }),
      }),
    },
  }),
});

// queries/index.ts
import { mergeQueryKeys } from "@barehera/query-key-factory";

export const queries = mergeQueryKeys({ users, todos });
```

### Use throughout your codebase with complete type safety

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "../queries";

// ✅ Simple queries
export function useUsers() {
  return useQuery(queries.users.all);
}

// ✅ Dynamic queries
export function useUserDetail(id: string) {
  return useQuery(queries.users.detail(id));
}

// ✅ Context queries for related data
export function useSearchTodos(filters: TodoFilters, query: string) {
  return useQuery({
    ...queries.todos.list(filters)._ctx.search(query),
    enabled: Boolean(query),
  });
}

// ✅ Type-safe mutations with queryClient
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    onSuccess(newTodo) {
      // ✅ TypeScript knows the exact type of data
      queryClient.setQueryData(
        queries.todos.detail(newTodo.id).queryKey,
        newTodo
      );

      // ✅ Invalidate all todo list queries
      queryClient.invalidateQueries({
        queryKey: queries.todos.list._def,
      });
    },
  });
}
```

## 🔑 Complete Type Safety with queryClient

The key advantage of using `queryOptions` wrapper is **type safety when working with queryClient**:

```ts
const queryClient = useQueryClient();

// ❌ Without queryOptions wrapper (plain objects)
const data = queryClient.getQueryData(["users", "detail", userId]); 
// type: unknown - you have to manually cast

// ✅ With queryOptions wrapper (this package)
const data = queryClient.getQueryData(queries.users.detail(userId).queryKey);
// type: User - TypeScript infers the exact type from queryFn!

// ✅ Type-safe setQueryData
queryClient.setQueryData(
  queries.users.detail(userId).queryKey,
  newUser // ✅ TypeScript validates this matches User type
);

// ✅ Type-safe invalidations with _def
queryClient.invalidateQueries({
  queryKey: queries.users.detail._def, // ['users', 'detail']
});
```

## 📝 Features

### Standardized Query Keys
All keys follow @tanstack/query conventions with array format:

```ts
export const todos = createQueryKeys("todos", {
  detail: (todoId: string) => ({
    queryKey: [todoId],
    queryFn: async () => api.getTodo(todoId),
  }),
  list: (filters: TodoFilters) => ({
    queryKey: [{ filters }],
    queryFn: async () => api.getTodos(filters),
  }),
});

// Output:
// {
//   _def: ['todos'],
//   detail: (todoId: string) => ({
//     queryKey: ['todos', 'detail', todoId],
//     queryFn: (ctx) => api.getTodo(todoId),
//   }),
//   list: (filters: TodoFilters) => ({
//     queryKey: ['todos', 'list', { filters }],
//     queryFn: (ctx) => api.getTodos(filters),
//   }),
// }
```

### Context Queries for Related Data
Declare queries that depend on a parent context:

```ts
export const users = createQueryKeys("users", {
  detail: (userId: string) => ({
    queryKey: [userId],
    queryFn: async () => api.getUser(userId),
    contextQueries: {
      posts: {
        queryKey: null,
        queryFn: async () => api.getUserPosts(userId),
      },
      likes: (limit = 10) => ({
        queryKey: [limit],
        queryFn: async () => api.getUserLikes(userId, limit),
      }),
    },
  }),
});

// Usage:
function useUserPosts(userId: string) {
  return useQuery(users.detail(userId)._ctx.posts);
}

function useUserLikes(userId: string, limit?: number) {
  return useQuery(users.detail(userId)._ctx.likes(limit));
}

// Output:
// users.detail('123')._ctx.posts.queryKey => ['users', 'detail', '123', 'posts']
// users.detail('123')._ctx.likes(20).queryKey => ['users', 'detail', '123', 'likes', 20]
```

### Easy Invalidation with `_def`
Access query key scopes for invalidating multiple related queries:

```ts
// Invalidate all user detail queries
queryClient.invalidateQueries({
  queryKey: queries.users.detail._def, // ['users', 'detail']
});

// Invalidate all todos
queryClient.invalidateQueries({
  queryKey: queries.todos._def, // ['todos']
});

// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: queries.users.detail("123").queryKey, // ['users', 'detail', '123']
});
```

### Merge Query Keys from Multiple Features

```ts
import { createQueryKeys, mergeQueryKeys } from "@barehera/query-key-factory";

// Feature 1
const users = createQueryKeys("users", {
  all: { queryKey: null, queryFn: async () => api.getUsers() },
});

// Feature 2
const todos = createQueryKeys("todos", {
  all: { queryKey: null, queryFn: async () => api.getTodos() },
});

// Combine into single source of truth
export const queries = mergeQueryKeys({ users, todos });

// Access:
queries.users.all.queryKey; // ['users', 'all']
queries.todos.all.queryKey; // ['todos', 'all']
```

## 🎓 Examples

### Basic Query

```ts
const users = createQueryKeys("users", {
  all: {
    queryKey: null,
    queryFn: async () => api.getUsers(),
  },
});

// In component:
function UserList() {
  const { data } = useQuery(users.all);
  // data is properly typed!
}
```

### Dynamic Query with Parameters

```ts
const todos = createQueryKeys("todos", {
  list: (filters: { status: string; priority: number }) => ({
    queryKey: [{ filters }],
    queryFn: async () => api.getTodos(filters),
  }),
});

// In component:
function TodoList() {
  const filters = { status: "active", priority: 1 };
  const { data } = useQuery(todos.list(filters));
  // queryKey: ['todos', 'list', { filters: { status: 'active', priority: 1 } }]
}
```

### Mutations with Cache Updates

```ts
function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createTodo,
    onSuccess: (newTodo) => {
      // ✅ Update specific todo in cache
      queryClient.setQueryData(
        queries.todos.detail(newTodo.id).queryKey,
        newTodo
      );

      // ✅ Invalidate all list queries
      queryClient.invalidateQueries({
        queryKey: queries.todos.list._def,
      });
    },
  });
}
```

### Optimistic Updates

```ts
function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.toggleTodo,
    onMutate: async (todoId) => {
      const queryKey = queries.todos.detail(todoId).queryKey;
      
      await queryClient.cancelQueries({ queryKey });
      
      // ✅ TypeScript knows the exact type
      const previousTodo = queryClient.getQueryData(queryKey);
      
      // ✅ Optimistic update with type safety
      queryClient.setQueryData(queryKey, {
        ...previousTodo,
        completed: !previousTodo?.completed,
      });

      return { previousTodo };
    },
    onError: (err, todoId, context) => {
      // ✅ Rollback on error
      queryClient.setQueryData(
        queries.todos.detail(todoId).queryKey,
        context?.previousTodo
      );
    },
  });
}
```

## 🆚 Comparison with Other Solutions

### Without Query Key Factory
```ts
// ❌ Scattered key definitions
const userKeys = {
  all: ['users'],
  detail: (id: string) => ['users', id],
};

// ❌ No type safety
const data = queryClient.getQueryData(userKeys.detail(userId)); // type: unknown

// ❌ Easy to make mistakes
queryClient.invalidateQueries({ queryKey: ['user', userId] }); // typo!
```

### With This Package
```ts
// ✅ Centralized definitions
const users = createQueryKeys('users', {
  all: { queryKey: null, queryFn: async () => api.getUsers() },
  detail: (userId: string) => ({
    queryKey: [userId],
    queryFn: async () => api.getUser(userId),
  }),
});

// ✅ Complete type safety
const data = queryClient.getQueryData(users.detail(userId).queryKey); // type: User

// ✅ Autocomplete prevents mistakes
queryClient.invalidateQueries({ queryKey: users.detail._def });
```

## 🙏 Credits

This package is inspired by and builds upon the excellent work of:
- **[@lukemorales/query-key-factory](https://github.com/lukemorales/query-key-factory)** by [Luke Morales](https://github.com/lukemorales)

The core concept and API design are based on his original work. This package extends the idea by wrapping queries with `queryOptions` to provide complete type safety across queryClient operations.

## 📄 License

MIT License - Copyright (c) 2025 barehera

See [LICENSE](./LICENSE) for more information.

---

<p align="center">
  Made with ❤️ for the TanStack Query community
</p>

