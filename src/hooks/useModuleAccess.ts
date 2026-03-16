import { useShallow } from "zustand/react/shallow";
import { useModuleStore } from "@/stores/module-store";

/**
 * Check if the user has access to a module (and optionally a submodule).
 * Use for sidebar visibility, page guards, and feature flags.
 *
 * @example
 * const canAccessCollections = useModuleAccess("collections");
 * const canAccessVirtualAccounts = useModuleAccess("collections", "virtual-accounts");
 */
export function useModuleAccess(moduleSlug: string, subModuleSlug?: string): boolean {
  return useModuleStore(
    useShallow((state) => {
      if (!state.hasModule(moduleSlug)) return false;
      if (subModuleSlug) return state.hasSubModule(moduleSlug, subModuleSlug);
      return true;
    })
  );
}

/**
 * Check if a specific option (e.g. currency) is enabled for a module or submodule.
 * Use for showing/hiding currency-specific features (e.g. "USD payout" button).
 *
 * @example
 * const canUseUSD = useModuleOption("payout", "single-payout", "USD");
 * const canUseNGN = useModuleOption("conversions", undefined, "NGN"); // module-level options
 */
export function useModuleOption(
  moduleSlug: string,
  subModuleSlug: string | undefined,
  option: string
): boolean {
  return useModuleStore(
    useShallow((state) => state.hasOption(moduleSlug, option, subModuleSlug))
  );
}

/**
 * Get the list of options (e.g. currencies) for a module or submodule.
 * Use for dropdowns and filters (payout currencies, conversion currencies, etc.).
 *
 * @example
 * const payoutCurrencies = useModuleOptions("payout", "single-payout");
 * const conversionCurrencies = useModuleOptions("conversions");
 */
export function useModuleOptions(moduleSlug: string, subModuleSlug?: string): string[] {
  return useModuleStore(
    useShallow((state) => state.getModuleOptions(moduleSlug, subModuleSlug))
  );
}

/**
 * Get all unique options for a module (module-level + every submodule).
 * Use for currency switchers on module-level pages (e.g. payouts page).
 *
 * @example
 * const payoutCurrencies = useModuleOptionsAll("payout");
 */
export function useModuleOptionsAll(moduleSlug: string): string[] {
  return useModuleStore(
    useShallow((state) => state.getAllOptionsForModule(moduleSlug))
  );
}

/**
 * Get submodule slugs for a module (from API config).
 * Use to filter tabs/features so only configured submodules are shown.
 *
 * @example
 * const collectionTabs = tabs.filter((t) => subModuleSlugs.includes(t.subModuleSlug));
 */
export function useModuleSubModuleSlugs(moduleSlug: string): string[] {
  return useModuleStore(
    useShallow((state) => state.getSubModuleSlugs(moduleSlug))
  );
}
