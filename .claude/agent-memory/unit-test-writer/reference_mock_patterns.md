---
name: Core mock and render patterns
description: Canonical mock setup, custom render import, and async patterns used across all unit tests in this project
type: reference
---

## Module-level mock

```ts
vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "@/lib/api-client";
const mockGet = vi.mocked(apiClient.get);
```

Import `apiClient` **after** `vi.mock` — hoisting means the mock is already in place.

## Custom render

Always import from `@/test/render`, not `@testing-library/react`. It wraps with `QueryClientProvider` (retry: false).

```ts
import { render } from "@/test/render";
```

## Three API states

```ts
// Happy path
mockGet.mockResolvedValue({ data: [...] });

// Pending / loading
mockGet.mockReturnValue(new Promise(() => {}));

// Error
mockGet.mockRejectedValue(new Error("Network error"));
```

## Skeleton detection

Skeletons render with Tailwind's `animate-pulse` in their className. Query with:
```ts
const skeletons = document.querySelectorAll("[class*='animate-pulse']");
expect(skeletons.length).toBeGreaterThan(0);
```

## Row scoping with `within`

```ts
const row = await screen.findByRole("row", { name: /some text/i });
expect(within(row).getByText("detail")).toBeInTheDocument();
```

`findByRole("row", { name: /.../ })` matches against the accessible name derived from all text in the row.

## Badge variant assertion (shadcn)

shadcn Badge default variant has no "secondary" class; secondary variant does:
```ts
expect(badge.className).not.toMatch(/secondary/);  // default variant
expect(badge.className).toMatch(/secondary/);        // secondary variant
```

## Date formatting

```ts
const expected = new Date(isoString).toLocaleDateString();
expect(await screen.findByText(expected)).toBeInTheDocument();
```

## Reset

```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```
