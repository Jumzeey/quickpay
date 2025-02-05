import { ReactElement, useEffect } from "react";
import Layout from "@/components/layout";
import ProfileTab from "@/components/settings/profileTab";
import SecurityTab from "@/components/settings/securityTab";
import ApiKeysTab from "@/components/settings/apiKeysTab";
import ManageUserTab from "@/components/settings/manageUserTab";
import WebPageTitle from "@/components/WebPageTitle";
import useTabs from "@/stores/useTabs";

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
    <Layout pageTitle="Settings" icon="settings">
      <WebPageTitle title="Settings | Sarepay Merchant Portal" />
      <div className="px-4 sm:px-16 md:px-32 mt-8 sm:mt-12 md:mt-16">
        <h2 className="text-2xl sm:text-3xl font-semibold">Settings</h2>
        <p className="font-normal pt-1">Manage Your Profile</p>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-10 mt-7 border-b border-solid border-grey-200 cursor-pointer">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`text-sm sm:text-base ${
                selectedTab === tab.id &&
                "border-b-[3px] border-solid border-primary"
              } pb-2`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.title}
            </div>
          ))}
        </div>

        <div className="mt-7">{selectedSettingsTab}</div>
      </div>
    </Layout>
  );
};

export default Settings;
