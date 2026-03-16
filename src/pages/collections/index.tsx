import Chargebacks from "@/components/collections/Chargebacks";
import CollectionHistory from "@/components/collections/History";
import PaymentLinks from "@/components/collections/payment-links";
import StableCoin from "@/components/collections/StableCoin";
import VirtualAccounts from "@/components/collections/virtual-accounts";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import TabHeader from "@/components/TabHeader";
import WebPageTitle from "@/components/WebPageTitle";
import { useModuleOptions, useModuleSubModuleSlugs } from "@/hooks/useModuleAccess";
import useCurrency from "@/stores/useCurrency";
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

/** Tab config with submodule slug from API – only tabs in the user's config are shown. */
const COLLECTION_TABS = [
  { title: "Collection History", link: "?tab=collection-history", subModuleSlug: "collections-history" },
  { title: "Virtual Accounts", link: "?tab=virtual-accounts", subModuleSlug: "virtual-accounts" },
  { title: "Payment Links", link: "?tab=payment-links", subModuleSlug: "payment-link" },
  { title: "Crypto", link: "?tab=stable-coin", subModuleSlug: "crypto" },
  { title: "Chargebacks & Refunds", link: "?tab=chargebacks", subModuleSlug: "chargebacks" },
];

const tabIdFromLink = (link: string) => link.replace("?tab=", "");

const Collection = () => {
  const router = useRouter();
  const { selectedCurrency, setCurrency } = useCurrency();
  const subModuleSlugs = useModuleSubModuleSlugs("collections");

  const visibleTabs = useMemo(
    () => COLLECTION_TABS.filter((t) => subModuleSlugs.includes(t.subModuleSlug)),
    [subModuleSlugs]
  );

  const { tab: urlTab } = router.query;
  const tabParam = typeof urlTab === "string" ? urlTab : undefined;
  const defaultTab = visibleTabs.length > 0 ? tabIdFromLink(visibleTabs[0].link) : "collection-history";
  const tab = tabParam || defaultTab;

  // If current tab is not in the user's config (e.g. bookmarked Crypto but no access), redirect to first visible tab
  useEffect(() => {
    if (visibleTabs.length === 0) return;
    const currentTabId = tabParam || defaultTab;
    const isVisible = visibleTabs.some((t) => tabIdFromLink(t.link) === currentTabId);
    if (!isVisible && tabParam) {
      router.replace({ pathname: router.pathname, query: { tab: defaultTab } }, undefined, { shallow: true });
    }
  }, [tabParam, defaultTab, visibleTabs, router.pathname]);

  const collectionHistoryOptions = useModuleOptions("collections", "collections-history");
  const collectionModuleOptions = useModuleOptions("collections");
  const virtualAccountOptions = useModuleOptions("collections", "virtual-accounts");
  const paymentLinkOptions = useModuleOptions("collections", "payment-link");
  const cryptoOptions = useModuleOptions("collections", "crypto");

  useEffect(() => {
    if (tab === 'virtual-accounts' && !selectedCurrency) {
      setCurrency('NGN');
    }
  }, [tab, selectedCurrency, setCurrency]);

  const currencies = useMemo(() => {
    if (tab === "collection-history") return collectionHistoryOptions.length > 0 ? collectionHistoryOptions : collectionModuleOptions;
    if (tab === "virtual-accounts") return virtualAccountOptions;
    if (tab === "payment-links") return paymentLinkOptions;
    if (tab === "stable-coin") return cryptoOptions;
    return [];
  }, [tab, collectionHistoryOptions, collectionModuleOptions, virtualAccountOptions, paymentLinkOptions, cryptoOptions]);

  return (
    <Layout pageTitle="Pay In History" icon="collection-history">
      <WebPageTitle title="Pay In History | Cray Merchant Portal" />

      <PageHeader
        title="Collections"
        description="Stay on top of all the payments coming in, hassle-free."
      />

      <div className="flex items-center justify-between">
        <TabHeader tabs={visibleTabs} />

        {currencies?.length > 0 && <CurrencySwitcher currencies={currencies} />}
      </div>

      {tab === "collection-history" && <CollectionHistory />}
      {tab === "virtual-accounts" && <VirtualAccounts />}
      {tab === "payment-links" && <PaymentLinks />}
      {tab === "stable-coin" && <StableCoin />}
      {tab === "chargebacks" && <Chargebacks />}
    </Layout>
  );
};

export default Collection;
