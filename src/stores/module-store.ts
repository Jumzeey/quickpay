import { create } from "zustand";
import type { Module, SubModule, ModuleMap, SubModuleMap, ApiModulesResponse } from "@/types/module";

function buildMaps(modules: Module[]): { moduleMap: ModuleMap; subModuleMap: SubModuleMap } {
  const moduleMap: ModuleMap = {};
  const subModuleMap: SubModuleMap = {};

  for (const mod of modules) {
    moduleMap[mod.slug] = mod;
    subModuleMap[mod.slug] = {};
    for (const sub of mod.sub_modules || []) {
      subModuleMap[mod.slug][sub.slug] = sub;
    }
  }

  return { moduleMap, subModuleMap };
}

export interface ModuleStoreState {
  modules: Module[];
  moduleMap: ModuleMap;
  subModuleMap: SubModuleMap;
  setModules: (modules: ApiModulesResponse) => void;
  hasModule: (moduleSlug: string) => boolean;
  hasSubModule: (moduleSlug: string, subModuleSlug: string) => boolean;
  hasOption: (moduleSlug: string, option: string, subModuleSlug?: string) => boolean;
  getModule: (moduleSlug: string) => Module | undefined;
  getSubModule: (moduleSlug: string, subModuleSlug: string) => SubModule | undefined;
  getModuleOptions: (moduleSlug: string, subModuleSlug?: string) => string[];
  /** All unique options for a module (module-level + every submodule). Useful for currency switchers. */
  getAllOptionsForModule: (moduleSlug: string) => string[];
  /** Submodule slugs for a module (from API). Use to filter tabs/features by config. */
  getSubModuleSlugs: (moduleSlug: string) => string[];
}

export const useModuleStore = create<ModuleStoreState>((set, get) => ({
  modules: [],
  moduleMap: {},
  subModuleMap: {},

  setModules: (modules: ApiModulesResponse) => {
    const list = Array.isArray(modules) ? modules : [];
    const { moduleMap, subModuleMap } = buildMaps(list);
    set({ modules: list, moduleMap, subModuleMap });
  },

  hasModule: (moduleSlug: string) => {
    return Boolean(get().moduleMap[moduleSlug]);
  },

  hasSubModule: (moduleSlug: string, subModuleSlug: string) => {
    const byModule = get().subModuleMap[moduleSlug];
    return Boolean(byModule?.[subModuleSlug]);
  },

  hasOption: (moduleSlug: string, option: string, subModuleSlug?: string) => {
    const opts = get().getModuleOptions(moduleSlug, subModuleSlug);
    return opts.includes(option);
  },

  getModule: (moduleSlug: string) => {
    return get().moduleMap[moduleSlug];
  },

  getSubModule: (moduleSlug: string, subModuleSlug: string) => {
    return get().subModuleMap[moduleSlug]?.[subModuleSlug];
  },

  getModuleOptions: (moduleSlug: string, subModuleSlug?: string) => {
    if (subModuleSlug) {
      const sub = get().getSubModule(moduleSlug, subModuleSlug);
      return sub?.options ?? [];
    }
    const mod = get().getModule(moduleSlug);
    return mod?.options ?? [];
  },

  getAllOptionsForModule: (moduleSlug: string) => {
    const mod = get().getModule(moduleSlug);
    if (!mod) return [];
    const set = new Set<string>(mod.options ?? []);
    (mod.sub_modules ?? []).forEach((sub) => (sub.options ?? []).forEach((o) => set.add(o)));
    return Array.from(set);
  },

  getSubModuleSlugs: (moduleSlug: string) => {
    const mod = get().getModule(moduleSlug);
    if (!mod?.sub_modules) return [];
    return mod.sub_modules.map((sub) => sub.slug);
  },
}));
