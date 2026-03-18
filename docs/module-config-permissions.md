# Module configuration and permissions

The app uses a centralized module configuration from the backend (returned after login/OTP verification). Users only see modules, submodules, and options (e.g. currencies) that are enabled for them.

## Layout

- **`/src/types/module.ts`** – Types for `Module`, `SubModule`, and API response.
- **`/src/stores/module-store.ts`** – Zustand store with normalized maps and helpers.
- **`/src/hooks/useModuleAccess.ts`** – Hooks used by UI; avoid reading the store directly in components.

## Initialization

Modules are set in two places:

1. **After OTP verification** – `useAuthentication.verifyOtp` calls `useModuleStore.getState().setModules(data.modules)`.
2. **On app load** – `_app.tsx` syncs persisted `auth.modules` into the module store when the user is logged in.

## Hooks

| Hook | Purpose |
|------|---------|
| `useModuleAccess(moduleSlug, subModuleSlug?)` | Whether the user has access to a module (and optionally a submodule). |
| `useModuleOption(moduleSlug, subModuleSlug, option)` | Whether a specific option (e.g. currency) is allowed. |
| `useModuleOptions(moduleSlug, subModuleSlug?)` | List of options for a module or submodule (e.g. currencies). |
| `useModuleOptionsAll(moduleSlug)` | All options for a module (module + all submodules). |

## Usage examples

### Sidebar (hide items by module)

Sidebar links are filtered using `SIDEBAR_MODULE_SLUG` in `constants` and `useModuleAccess` in `components/sidebar/index.tsx`. Links that require a module are hidden when the user does not have that module.

### Page guard (redirect if no access)

Wrap page content with `PageGuard` so users without access are redirected (e.g. to `/dashboard`):

```tsx
import PageGuard from "@/components/PageGuard";

export default function ConversionsPage() {
  return (
    <PageGuard moduleSlug="conversions" redirectTo="/dashboard">
      <Layout>
        {/* ... */}
      </Layout>
    </PageGuard>
  );
}
```

### Feature flag (e.g. show USD payout only if allowed)

Use `useModuleOption` to show or disable a currency-specific action:

```tsx
const canUseUSD = useModuleOption("payout", "single-payout", "USD");

return (
  <>
    {canUseUSD && (
      <Button onClick={() => startPayout("USD")}>Payout in USD</Button>
    )}
  </>
);
```

### Currencies from module config

- **Payouts page** – `useModuleOptionsAll("payout")` for the currency switcher.
- **Single payout (InitiateTransfer)** – `useModuleOptions("payout", "single-payout")`.
- **Bulk payout (BulkPayout)** – `useModuleOptions("payout", "bulk-payout")` with fallback to single-payout.
- **Conversions** – Wallet balances are filtered by `useModuleOptions("conversions")`.
- **Collections** – Per-tab options: `useModuleOptions("collections", "virtual-accounts")`, etc.

## Backend response shape

The login/OTP response includes `data.modules` with this shape (see `src/types/module.ts`):

- `id`, `name`, `slug`, `options` (e.g. currencies at module level), `sub_modules`.
- Each submodule: `id`, `name`, `slug`, `options`.

Slugs are used for lookups (e.g. `payout`, `single-payout`, `bulk-payout`, `collections`, `virtual-accounts`). When the backend adds a submodule (e.g. `bulk-payout`), the UI shows the Bulk Payout option and tab when that submodule is present.
