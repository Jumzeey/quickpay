import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import ApiKeysTab from "@/components/settings/apiKeysTab";
import IPWhiteListing from "@/components/settings/IpWhiteListingTab";
import ManageUserTab from "@/components/settings/ManageUserTab";
import ProfileTab from "@/components/settings/profileTab";
import SecurityTab from "@/components/settings/securityTab";
import WebhooksTab from "@/components/settings/webhooksTab";
import WebPageTitle from "@/components/WebPageTitle";
import { useRouter } from "next/router";
import Link from "next/link";

const SETTINGS_SECTIONS = [
  {
    id: "business-profile",
    title: "Business Profile",
    description:
      "Manage your business information, logo, and account details.",
    component: ProfileTab,
  },
  {
    id: "security",
    title: "Security",
    description:
      "Reduce your risk of exposure by changing your password. Using a passphrase of random words (like: S3ndc@shdear) is secure and easy to remember.",
    component: SecurityTab,
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description:
      "Webhooks allow you to receive real-time notifications about events in your Cray account.",
    component: WebhooksTab,
  },
  {
    id: "api-keys",
    title: "API Keys",
    description:
      "Keep your API keys secure to prevent unauthorized access. Treat them like passwords—store them safely.",
    component: ApiKeysTab,
  },
  {
    id: "ip-whitelist",
    title: "IP Whitelist",
    description:
      "Restrict access to your account by allowing only trusted IP addresses.",
    component: IPWhiteListing,
  },
  {
    id: "manage-users",
    title: "Manage users",
    description:
      "Efficiently manage users and their roles within your company. Assign permissions and control access levels.",
    component: ManageUserTab,
  },
] as const;

type SectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

const Settings = () => {
  const router = useRouter();
  const { section: sectionParam } = router.query;
  const sectionId = (typeof sectionParam === "string" ? sectionParam : null) as SectionId | null;

  const activeSection =
    SETTINGS_SECTIONS.find((s) => s.id === sectionId) ?? SETTINGS_SECTIONS[0];
  const ActiveContent = activeSection.component;

  const handleSectionChange = (id: SectionId) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, section: id } },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Layout pageTitle="Business Settings" icon="settings">
      <WebPageTitle title="Business Settings | Cray Merchant Portal" />

      <PageHeader
        title="Account Settings"
        description="Secure your account, manage your business profile, configure API keys, and control user access—all in one place."
      />

      <div className="mt-8 flex flex-col lg:flex-row gap-8 lg:gap-10 h-[calc(100vh-10rem)] min-h-[480px]">
        {/* Vertical sidebar - fixed, no scroll */}
        <nav
          className="flex-shrink-0 w-full lg:w-56 xl:w-64 lg:self-start lg:sticky lg:top-8"
          aria-label="Settings sections"
        >
          <ul className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 lg:border-r border-[#E5E7EB] lg:pr-6">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = activeSection.id === section.id;
              return (
                <li key={section.id}>
                  <Link
                    href={{ pathname: "/settings", query: { section: section.id } }}
                    shallow
                    onClick={(e) => {
                      e.preventDefault();
                      handleSectionChange(section.id);
                    }}
                    className={`
                      block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      lg:rounded-r-none lg:rounded-l-lg lg:border-l-2 lg:border-l-transparent
                      ${isActive
                        ? "bg-[#EFF7FE] text-[#005BB0] lg:border-l-[#005BB0] lg:bg-[#EFF7FE]"
                        : "text-[#7F7F7F] hover:bg-[#F9FAFB] hover:text-[#090727]"
                      }
                    `}
                  >
                    {section.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main content - heading fixed, only this area scrolls */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div className="flex-shrink-0 mb-6">
            <h2 className="text-base font-semibold text-[#090727]">
              {activeSection.title}
            </h2>
            {activeSection.description && (
              <p className="mt-1 text-sm text-[#7F7F7F] font-medium">
                {activeSection.description}
              </p>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto border border-[#C4C4C452] rounded-lg">
            {activeSection.id === "manage-users" || activeSection.id === "ip-whitelist" ? (
              <div className="p-4">
                <ActiveContent />
              </div>
            ) : (
              <ActiveContent />
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Settings;
