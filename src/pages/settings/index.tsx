import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import ApiKeysTab from "@/components/settings/apiKeysTab";
import ManageUserTab from "@/components/settings/manageUserTab";
import ProfileTab from "@/components/settings/profileTab";
import SecurityTab from "@/components/settings/securityTab";
import WebPageTitle from "@/components/WebPageTitle";
import useTabs from "@/stores/useTabs";
import { ReactElement, useEffect } from "react";

const tabs = [
  {
    id: 1,
    title: "Profile Info",
  },
  {
    id: 2,
    title: "Security",
  },
  {
    id: 3,
    title: "API Keys",
  },
  {
    id: 4,
    title: "Manage Users",
  },
];

interface TabMapping {
  [key: number]: ReactElement;
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

  const settingsTabMap: TabMapping = {
    1: <ProfileTab />,
    2: <SecurityTab />,
    3: <ApiKeysTab />,
    4: <ManageUserTab />,
  };

  const selectedSettingsTab = settingsTabMap[selectedTab];

  return (
    <Layout pageTitle="Business Settings" icon="settings">
      <WebPageTitle title="Business Settings | Ramp Merchant Portal" />

      <PageHeader
        title="Account Settings"
        description="Secure your account, manage your business profile, configure API keys, and control user access—all in one place."
      />

      <div className="flex flex-col gap-10">
        <section className="grid grid-cols-7">
          <div className="col-span-2 pr-2">
            <h3 className="text-sm font-semibold text-black">Business Profile</h3>
          </div>
          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <ProfileTab />
          </div>
        </section>
        <section className="grid grid-cols-7">
          <div className="col-span-2 pr-2">
            <h3 className="text-sm font-semibold text-black">Security</h3>

            <p className="text-[13px] text-[#7F7F7F] font-medium mt-2">
              Reduce your risk of exposure by changing your password.
              Using a passphrase of random words (like: S3ndc@shdear)
              is secure and easy to remember
            </p>
          </div>
          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <SecurityTab />
          </div>
        </section>
        <section className="grid grid-cols-7">
          <div className="col-span-2 pr-2">
            <h3 className="text-sm font-semibold text-black">API Keys</h3>

            <p className="text-[13px] text-[#7F7F7F] font-medium mt-2">
              Keep your API keys secure to prevent unauthorized access.
              Treat them like passwords—store them safely.
            </p>
          </div>
          <div className="col-span-5 border border-[#C4C4C452] rounded-lg">
            <ApiKeysTab />
          </div>
        </section>
        <section className="grid grid-cols-7">
          <div className="col-span-2 pr-2">
            <h3 className="text-sm font-semibold text-black">Manage users</h3>

            <p className="text-[13px] text-[#7F7F7F] font-medium mt-2">
              Efficiently manage users and their roles within your
              company. Assign permissions and control access levels
            </p>
          </div>
          <div className="col-span-5 border border-[#C4C4C452] rounded-lg p-4">
            <ManageUserTab />
          </div>
        </section>
      </div>

      {/* <div className="px-4 sm:px-16 md:px-32 mt-8 sm:mt-12 md:mt-16">
        <h2 className="text-2xl sm:text-3xl font-semibold">Business Settings</h2>
        <p className="font-normal pt-1">Manage Your Profile</p>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-10 mt-7 border-b border-solid border-grey-200 cursor-pointer">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`text-sm sm:text-base ${selectedTab === tab.id &&
                "border-b-[3px] border-solid border-primary"
                } pb-2`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.title}
            </div>
          ))}
        </div>

        <div className="mt-7">{selectedSettingsTab}</div>
      </div> */}
    </Layout>
  );
};

export default Settings;
