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

## Mocking react-router-dom (Navigate + useNavigate)

Variables referenced inside `vi.mock` factories must be hoisted with `vi.hoisted()` or they hit the temporal dead zone (Vitest hoists the factory before `const` declarations are initialised).

```ts
const { mockNavigate, MockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  MockNavigate: vi.fn(() => null),
}));

vi.mock("react-router-dom", () => ({
  Navigate: MockNavigate,
  useNavigate: vi.fn(() => mockNavigate),
}));
```

When asserting that `MockNavigate` (a function component mock) was called, React only passes one argument (the props object). Use `undefined` as the second argument — `expect.anything()` will fail:

```ts
expect(MockNavigate).toHaveBeenCalledWith(
  expect.objectContaining({ to: "/", replace: true }),
  undefined,
);
```

## Mocking BetterAuth (useSession + signIn)

```ts
const { mockSignInEmail } = vi.hoisted(() => ({
  mockSignInEmail: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(() => ({ data: null, isPending: false })),
  signIn: { email: mockSignInEmail },
}));

import { useSession } from "@/lib/auth-client";
const mockUseSession = vi.mocked(useSession);
```

`signIn.email` returns `{ error: null }` on success, `{ error: { message: "..." } }` on failure.

## Mocking sonner toast

`<Toaster />` is only in `main.tsx`, not in the test render wrapper — sonner toasts are invisible in jsdom. Mock the module and assert on the spy instead of querying the DOM.

```ts
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

// In test:
await waitFor(() => {
  expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Expected message.");
});
```

## Dual-endpoint GET mock (multiple resources)

When a component calls `apiClient.get` for two different URLs, use `mockImplementation` to route by URL:

```ts
mockGet.mockImplementation((url: string) => {
  if (url.includes("assignable-agents")) {
    return Promise.resolve({ data: [] });
  }
  return Promise.resolve({ data: ticket });
});
```

## Mocking apiClient.patch alongside get

```ts
vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

import apiClient from "@/lib/api-client";
const mockPatch = vi.mocked(apiClient.patch);

// Happy path:
mockPatch.mockResolvedValue({ data: updatedResource });

// Verify call:
await waitFor(() => {
  expect(mockPatch).toHaveBeenCalledWith("/api/resource/42", { field: value });
});
```

## Reset

```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```
