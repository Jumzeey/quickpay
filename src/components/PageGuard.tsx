import { useModuleAccess } from "@/hooks/useModuleAccess";

interface PageGuardProps {
  /** Module slug required to view the page (e.g. "payout", "conversions") */
  moduleSlug: string;
  /** Optional submodule slug (e.g. "virtual-accounts") */
  subModuleSlug?: string;
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
  children,
}: PageGuardProps) {
  const hasAccess = useModuleAccess(moduleSlug, subModuleSlug);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">You don&apos;t have permission to view this module.</h1>
          <p className="text-sm text-[#7F7F7F]">
            Please contact your administrator to enable access to this module for your account.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
