---
name: Wouter Route Pattern
description: wouter's Route component does not accept a `render` prop; use named wrapper components.
---

**Why:** wouter's `<Route>` only accepts `component` (a React component type) or children. The `render` prop pattern from React Router v5 does not exist in wouter.

**How to apply:** Instead of `<Route path="/foo" render={() => <ProtectedRoute component={Foo} />} />`, define a named wrapper:
```tsx
function FooRoute() { return <ProtectedRoute component={Foo} />; }
// ...
<Route path="/foo" component={FooRoute} />
```
This also satisfies TypeScript — `component` expects `React.ComponentType`, not a render function.
