import Chargebacks from "@/components/collections/Chargebacks";
import CollectionHistory from "@/components/collections/History";
import PaymentLinks from "@/components/collections/payment-links";
import VirtualAccounts from "@/components/collections/virtual-accounts";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import TabHeader from "@/components/TabHeader";
import WebPageTitle from "@/components/WebPageTitle";
import { useRouter } from 'next/router';

const tabs = [
  { title: "Collection History", link: "?tab=collection-history" },
  { title: "Virtual Accounts", link: "?tab=virtual-accounts" },
  { title: "Payment Links", link: "?tab=payment-links" },
  { title: "Chargebacks & Refunds", link: "?tab=chargebacks" }
]

const Collection = () => {
  const router = useRouter()

  const { tab: urlTab } = router.query;
  const tab = urlTab || (tabs.length > 0 ? tabs[0].link.replace('?tab=', '') : '');

  return (
    <Layout pageTitle="Pay In History" icon="collection-history">
      <WebPageTitle title="Pay In History | Ramp Merchant Portal" />

      <PageHeader
        title="Collections"
        description="Stay on top of all the payments coming in, hassle-free."
      />

      <div className="flex items-center justify-between">
        <TabHeader tabs={tabs} />

        <CurrencySwitcher />
      </div>

      {tab === "collection-history" && <CollectionHistory />}
      {tab === "virtual-accounts" && <VirtualAccounts />}
      {tab === "payment-links" && <PaymentLinks />}
      {tab === "chargebacks" && <Chargebacks />}
    </Layout>
  );
};

export default Collection;
