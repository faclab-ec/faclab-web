# Architecture Decision Record — Feature Module Migration

**Status:** Active — migration completed (S0–S6) | **Date:** 2026-05-07 | **Applies from:** S0

## Context

Migrating from horizontal layers (`services/`, `hooks/`, `views/`) to vertical feature
modules to reduce cross-cutting change cost and enable isolated testing.
Each feature is self-contained and exposes a single public surface (`index.ts`).

## Boundary Rules (immutable)

1. **Feature-to-feature imports**: only via the target feature's `index.ts`.
   Never import `features/lots/api/getLots.ts` from `features/products`.

2. **`shared/` does not import from `features/`**. Ever. If shared code needs
   a feature type, that type belongs in `shared/`, not the feature.

3. **`app/` orchestrates features**. Contains no business logic.

4. **Schemas live with their feature** (`features/<x>/model/`). The legacy
   `src/schemas/` directory was deleted in S6.

5. **Services are pure functions**, not classes or singletons.
   `getSuppliers()`, not `new SupplierService().getSuppliers()`.

6. **Mappers are exceptional**, not mandatory. Add `mappers.ts` only when:
   snake_case→camelCase, numeric enum→label, or legacy shape mismatch.
   If the API returns the right shape, skip the mapper.

7. **`httpClient` returns `T`**, never `AxiosResponse<T>`.
   Axios is an implementation detail of `shared/lib/http`.

8. **Cross-feature data**: import from the feature barrel.
   `PurchaseOrders` needing `Supplier` type uses
   `import type { Supplier } from '@features/suppliers'`, not internal paths.

## Path Aliases

| Alias          | Resolves to      | Purpose                           |
|----------------|------------------|-----------------------------------|
| `@/*`          | `src/*`          | Legacy compat (permanent)         |
| `@app/*`       | `src/app/*`      | Bootstrap, providers, routing     |
| `@features/*`  | `src/features/*` | Vertical feature modules          |
| `@shared/*`    | `src/shared/*`   | Shared lib, utils, primitives     |
| `@stores/*`    | `src/stores/*`   | Global Zustand stores             |
| `@configs/*`   | `src/configs/*`  | App configuration                 |

## Key Shared Libraries

| Path | Purpose |
|---|---|
| `shared/lib/http/httpClient.ts` | The only HTTP client. Returns `T`; attaches the token, rejects with `ApiError`, refreshes on `TOKEN_EXPIRED` and retries once |
| `shared/lib/auth/session.ts` | `refreshSession()` / `forceSignOut()` — the only way to renew or drop tokens; all token writes go through `useAuthStore` (memory only) and are shared with other tabs |
| `shared/lib/auth/refreshManager.ts` | `refreshOnce()` — deduplicated `/auth/refresh` call with the HttpOnly refresh cookie (`withCredentials`, no body, no persistence) |
| `shared/lib/auth/sessionHint.ts` | Non-secret `fc.hasSession` flag: whether to restore the session with the cookie on load |
| `shared/lib/auth/authChannel.ts` | `BroadcastChannel` that shares new access tokens and logouts between tabs |
| `features/auth/lib/refreshScheduler.ts` | `start(expiresIn)` / `stop()` — proactive JWT refresh scheduler (auth-feature owned), uses `refreshSession()` |
| `shared/lib/format.ts` | `formatCurrency`, `formatDate`, `formatDatetime`, `formatPercent` |

## Company, branch and terminal (S2.9)

- The session (`/api/auth/me`) carries the company (`tenant`), the user's companies (`tenants`) and the active branches they may enter (`branches`). The company never travels as a header: it is the token's `tid`.
- `stores/useWorkplaceStore.ts` remembers, per browser, the branch chosen in each company and the POS terminal bound in each branch; `activeBranch()` validates the branch against the session every time.
- `shared/lib/http/httpClient.ts` adds `X-Branch-Id` to `/api/admin` and `/api/pos` calls and `X-Terminal-Id` to `/api/pos` ones, never to `/api/auth` or faclab-invoicing. A call can bring its own headers.
- `features/organization` owns branches, emission points and POS terminals (admin screens); `features/pos` only reads the active terminals of its branch (`GET /api/pos/terminals`) through `TerminalGuard`.

## Directory Structure

```
src/
├── app/          # bootstrap, providers, routes
├── features/     # vertical slices
├── shared/       # cross-cutting lib, ui, utils
├── stores/       # global Zustand state
├── configs/      # environment config
├── components/   # template UI kit, layouts, route guards (Elstar)
├── constants/    # permissions, roles, tax codes
├── utils/        # ApiError, template hooks
├── mock/         # MirageJS handlers
└── @types/       # global types
```

## Migration Sequence

| Session | Scope |
|---|---|
| S0 | Infrastructure (httpClient, format, refreshScheduler, Vitest, aliases, ESLint rule) |
| S1 | Feature pilot: `suppliers` (canonical template + tests) |
| S2 | Refactor remaining services to pure functions + httpClient |
| S3 | Break detail views >500 LOC into sub-components |
| S4 | Migrate leaf features (customers, categories, warehouses, locations) |
| S5 | Migrate cross-feature features (purchases, sales, pos, inventory, reports) |
| S6 | Delete legacy dirs, remove @legacy alias, complete Controlled* wrappers |

## API Response Envelope `{ data, meta }`

**Status:** Active | **Date:** 2026-05-14

### Convention

The backend wraps every JSON response in an envelope:

```ts
// list endpoint
{ data: T[], meta: { requestId, timestamp, pagination: { total, limit, offset } } }

// detail / mutation endpoint
{ data: T, meta: { requestId, timestamp } }

// error
{ errors: [{ code, message, field }], meta: { requestId, timestamp } }
```

`src/@types/api.ts` declares `PaginatedResponse<T>` and `DataResponse<T>` to type this raw shape.

### Where the unwrap happens

- **`features/<x>/api/client.ts`** — functions are typed against the *raw envelope*
  (`httpClient.get<PaginatedResponse<T>>(...)`). They return the envelope as-is.
- **`features/<x>/hooks/use*.ts`** — hooks unwrap before exposing data:
  `return { items: body.data, pagination: body.meta.pagination }`.
- **Consumers (pages, components)** never see the envelope.

### Why hooks own the unwrap (not `api/client`)

- `meta.pagination` is needed by table components alongside `data`. Centralizing the
  unwrap in `api/client` would either drop `meta` (breaking pagination) or return a
  bespoke shape per endpoint (no net simplification).
- The envelope is a *backend contract*, not a frontend concern. Keeping it visible in
  the type signature of `api/client` makes the boundary explicit; transforming inside
  hooks keeps the frontend model clean.
- React Query keys naturally live in hooks. Unwrap + cache key colocate there.

### Rule for new endpoints

1. Type the `api/client` function with `PaginatedResponse<T>` or `DataResponse<T>`.
2. In the hook, destructure `body.data` (and `body.meta.pagination` when paginated).
3. Never expose the envelope past the hook boundary.

### Errors

`httpClient` rejects every failure as `ApiError` (`src/utils/errors/ApiError.ts`), built from the
error envelope. Session decisions are made on `code`, not HTTP status: `TOKEN_EXPIRED` → refresh +
retry once; `INVALID_TOKEN` or failed refresh → `forceSignOut()`; `PASSWORD_CHANGE_REQUIRED` →
`/change-password`. Consumers branch with `isApiError(err) && err.code === '...'`.
