import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import ApiKeysTab from "@/components/settings/apiKeysTab";
import IPWhiteListing from "@/components/settings/IpWhiteListingTab";
import ManageUserTab from "@/components/settings/manageUserTab";
import ProfileTab from "@/components/settings/profileTab";
import SecurityTab from "@/components/settings/securityTab";
import WebhooksTab from "@/components/settings/webhooksTab";
import WebPageTitle from "@/components/WebPageTitle";
import useTabs from "@/stores/useTabs";
import { useEffect } from "react";

interface ProfileLeftPanelProps {
  title: string;
  description?: string;
}

const ProfileLeftPanel = ({ title, description }: ProfileLeftPanelProps) => {
  return (
    <div className="col-span-2 pr-2">
      <h3 className="text-sm font-semibold text-black">{title}</h3>

      {description && (
        <p className="text-[13px] text-[#7F7F7F] font-medium mt-2">
          {description}
        </p>
      )}
    </div>
  )
}

const Settings = () => {
  const { selectedTab, handleTabClick } = useTabs();

  useEffect(() => {
    if (selectedTab === 4) {
      handleTabClick(4);
    } else {
      handleTabClick(selectedTab);
    }
  }, []);

  return (
    <Layout pageTitle="Business Settings" icon="settings">
      <WebPageTitle title="Business Settings | Ramp Merchant Portal" />

      <PageHeader
        title="Account Settings"
        description="Secure your account, manage your business profile, configure API keys, and control user access—all in one place."
      />

      <div className="flex flex-col gap-10">
        <section className="grid md:grid-cols-7">
          <ProfileLeftPanel title="Business Profile" />

          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <ProfileTab />
          </div>
        </section>
        <section className="grid md:grid-cols-7">
          <ProfileLeftPanel
            title="Security"
            description="Reduce your risk of exposure by changing your password. Using a passphrase of random words (like: S3ndc@shdear) is secure and easy to remember"
          />

          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <SecurityTab />
          </div>
        </section>
        <section className="grid md:grid-cols-7">
          <ProfileLeftPanel
            title="Webhooks"
            description="Webhooks allow you to receive real-time notifications about events in your Ramp account."
          />

          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <WebhooksTab />
          </div>
        </section>
        <section className="grid md:grid-cols-7">
          <ProfileLeftPanel
            title="API Keys"
            description="Keep your API keys secure to prevent unauthorized access.
              Treat them like passwords—store them safely."
          />

          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <ApiKeysTab />
          </div>
        </section>
        <section className="grid md:grid-cols-7">
          <ProfileLeftPanel
            title="IP Whitelist"
            description="Restrict access to your account by allowing only trusted IP addresses."
          />

          <div className="col-span-5 border border-[#C4C4C452] rounded-lg p-4">
            <IPWhiteListing />
          </div>
        </section>
        <section className="grid md:grid-cols-7">
          <ProfileLeftPanel
            title="Manage users"
            description="Efficiently manage users and their roles within your company. Assign permissions and control access levels"
          />

          <div className="col-span-5 border border-[#C4C4C452] rounded-lg p-4">
            <ManageUserTab />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Settings;
