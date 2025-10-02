import Chargebacks from "@/components/collections/Chargebacks";
import CollectionHistory from "@/components/collections/History";
import PaymentLinks from "@/components/collections/payment-links";
import VirtualAccounts from "@/components/collections/virtual-accounts";
import CurrencySwitcher, { walletCurrencies } from "@/components/CurrencySwitcher";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import TabHeader from "@/components/TabHeader";
import WebPageTitle from "@/components/WebPageTitle";
import useAuthentication from "@/stores/useAuthentication";
import { Modules } from "@/util/utils";
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

  const { modules } = useAuthentication();

  const cardSubProduct = modules?.find((m: Modules) => m.product === 'Card Payments')?.sub_product;
  const cardCurrency: string[] = cardSubProduct?.currency || (cardSubProduct?.payment_type?.includes('all') ? walletCurrencies.map(currency => currency.value) : []);

  const virtualAccountCurrency: string[] = modules?.find((m: Modules) => m.product === 'Virtual Account')?.sub_product?.currency;
  const collectionHistoryCurrency = Array.from(new Set([...(cardCurrency || []), ...(virtualAccountCurrency || [])]));

  const currencies =
    tab === "collection-history" ? collectionHistoryCurrency
      // tab === "collection-history" ? virtualAccountCurrency
      : tab === "virtual-accounts" ? virtualAccountCurrency
        // : tab === "payment-links" ? cardCurrency
        : [];

  return (
    <Layout pageTitle="Pay In History" icon="collection-history">
      <WebPageTitle title="Pay In History | Cray Merchant Portal" />

      <PageHeader
        title="Collections"
        description="Stay on top of all the payments coming in, hassle-free."
      />

      <div className="flex items-center justify-between">
        <TabHeader tabs={tabs} />

        {currencies?.length > 0 && <CurrencySwitcher currencies={currencies} />}
      </div>

      {tab === "collection-history" && <CollectionHistory />}
      {tab === "virtual-accounts" && <VirtualAccounts />}
      {tab === "payment-links" && <PaymentLinks />}
      {tab === "chargebacks" && <Chargebacks />}
    </Layout>
  );
};

export default Collection;
