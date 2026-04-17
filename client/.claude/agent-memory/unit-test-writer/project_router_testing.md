---
name: Router-dependent component testing pattern
description: How to test components that use useParams or react-router-dom hooks
type: project
---

Components that call `useParams` (or other react-router-dom hooks) must be wrapped in a `MemoryRouter` + `Routes` + `Route` at the test level — the custom `render` in `client/src/test/render.tsx` only provides `QueryClientProvider`, not a router.

**Pattern:**

```tsx
function renderPage(id = "1") {
  return render(
    <MemoryRouter initialEntries={[`/tickets/${id}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<MyPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
```

**Why:** `useParams` throws (or returns undefined) without an enclosing Router context. The `Route` with a matching path pattern is required so that `useParams` correctly extracts the param.

**How to apply:** Any time a page component reads params from the URL, wrap it this way in the `renderPage` helper.
