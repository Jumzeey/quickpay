import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import TabHeader from "@/components/TabHeader";
import WebPageTitle from "@/components/WebPageTitle";
import SubaccountHistory from "@/pages/your-business/sub-accounts";
import { useRouter } from "next/router";
import BusinessKYC from "./kyc-verification";
import Webhooks from "./webhook";
import UpgradeAccount from "./upgrade-account";

const tabs = [
    { title: "Business KYC", link: "?tab=business-kyc" },
    // { title: "Upgrade Account", link: "?tab=upgrade-account" }, 
    { title: "Webhooks", link: "?tab=webhooks" },
    { title: "Sub Accounts", link: "?tab=sub-accounts" },
];

const Business = () => {
    const router = useRouter();
    const { tab: urlTab } = router.query;
    const tab = urlTab || (tabs.length > 0 ? tabs[0].link.replace('?tab=', '') : '');

    return (
        <Layout pageTitle="Your Business" icon="business">
            <WebPageTitle title="Your Business | Merchant Portal" />

            <PageHeader
                title="Your Business"
                description="Keep everything running smoothly with easy access to your business insights."
            />

            <TabHeader tabs={tabs} />

            <div className="mt-8">
                {tab === "business-kyc" && <BusinessKYC />}
                {tab === "webhooks" && <Webhooks />}
                {tab === "sub-accounts" && <SubaccountHistory />}
                {tab === "upgrade-account" && <UpgradeAccount />}
            </div>
        </Layout>
    );
};

export default Business;