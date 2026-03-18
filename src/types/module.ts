/**
 * Module and submodule types matching the backend API response after login/OTP verification.
 * Used for centralized module configuration and permission checks.
 */

export interface SubModule {
  id: number;
  name: string;
  slug: string;
  options: string[];
}

export interface Module {
  id: number;
  name: string;
  slug: string;
  options: string[];
  sub_modules: SubModule[];
}

/** Normalized lookup: module slug -> Module */
export type ModuleMap = Record<string, Module>;

/** Normalized lookup: module slug -> (submodule slug -> SubModule) */
export type SubModuleMap = Record<string, Record<string, SubModule>>;

/** API response shape for modules (e.g. data.modules from verify OTP) */
export type ApiModulesResponse = Module[];
