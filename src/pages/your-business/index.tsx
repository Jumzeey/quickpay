import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import TabHeader from "@/components/TabHeader";
import WebPageTitle from "@/components/WebPageTitle";
import BusinessKYC from "./kyc-verification";
import { useRouter } from "next/router";
import Webhooks from "./webhook";

const tabs = [
    { title: "Business KYC", link: "?tab=business-kyc" },
    { title: "Webhooks", link: "?tab=webhooks" },
];

const Business = () => {
    const router = useRouter();
    const { tab: urlTab } = router.query;
    const tab = urlTab || (tabs.length > 0 ? tabs[0].link.replace('?tab=', '') : '');

    return (
        <Layout pageTitle="Your Business" icon="business">
            <WebPageTitle title="Your Business | Ramp Merchant Portal" />

            <PageHeader
                title="Your Business"
                description="Keep everything running smoothly with easy access to your business insights."
            />

            <TabHeader tabs={tabs} />

            <div className="mt-8">
                {tab === "business-kyc" &&  <BusinessKYC />}
                {tab === "webhooks" && <Webhooks />}
            </div>
        </Layout>
    );
};

export default Business;