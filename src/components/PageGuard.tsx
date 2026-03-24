import { useModuleAccess } from "@/hooks/useModuleAccess";
import { FORBIDDEN_MESSAGE } from "@/util/utils";

export { FORBIDDEN_MESSAGE };

interface PageGuardProps {
  /** Module slug required to view the page (e.g. "payout", "conversions") */
  moduleSlug: string;
  /** Optional submodule slug (e.g. "virtual-accounts") */
  subModuleSlug?: string;
  /**
   * Optional override for access checks (useful for non-module permissions like "manage users" or 403).
   * When provided, PageGuard uses this instead of module config.
   */
  hasAccessOverride?: boolean;
  /** Custom message when access is denied (e.g. for 403 use FORBIDDEN_MESSAGE). */
  customMessage?: string;
  /** Custom title when access is denied. */
  customTitle?: string;
  /** Content to render when the user has access */
  children: React.ReactNode;
}

/**
 * Page guard: if user does not have access to the given module/submodule,
 * render a "no permission" message instead of the page content.
 */
export default function PageGuard({
  moduleSlug,
  subModuleSlug,
  hasAccessOverride,
  customMessage,
  customTitle,
  children,
}: PageGuardProps) {
  const hasAccess =
    typeof hasAccessOverride === "boolean"
      ? hasAccessOverride
      : useModuleAccess(moduleSlug, subModuleSlug);

  if (!hasAccess) {
    const title = customTitle ?? "You don't have permission to view this module.";
    const message = customMessage ?? "Please contact your administrator to enable access to this module for your account.";
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">{title}</h1>
          <p className="text-sm text-[#7F7F7F]">{message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Use when a 403 Forbidden is returned (e.g. from an API call). Renders the same guard UI with
 * FORBIDDEN_MESSAGE. Any component that catches 403 can set state and render <ForbiddenGuard /> instead of content.
 */
export function ForbiddenGuard() {
  return (
    <PageGuard
      moduleSlug=""
      hasAccessOverride={false}
      customMessage={FORBIDDEN_MESSAGE}
      customTitle="Access denied"
    >
      <div />
    </PageGuard>
  );
}
