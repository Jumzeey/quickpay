import CardSkeleton from "@/components/card-skeleton";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import Details from "@/components/settlements/details";
import History from "@/components/settlements/history";
import Transactions from "@/components/settlements/transactions";
import WebPageTitle from "@/components/WebPageTitle";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

const Settlements = () => {
  const router = useRouter();
  const { id, view } = router.query;
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    if (router.isReady) {
      setMounted(true);
    }
  }, [router.isReady]);

  if (!mounted) {
    return <CardSkeleton />;
  }

  return (
    <Layout pageTitle="Settlement History" icon="history">
      <WebPageTitle title="Settlement History | Merchant Portal" />

      <div className="flex flex-col md:flex-row justify-between mb-8">
        <div>
          <PageHeader
            className="!mb-0"
            title="Settlement"
            description="Stay informed about your payouts with a transparent and reliable settlement history."
          />
        </div>

        {id || view ? null : <div className="relative flex gap-4 justify-end mt-4 md:mt-0">
          <CurrencySwitcher currencies={['all']} className="items-center" />

          {/* <ActionButton
            ariaLabel='Filter by date button'
            text='Filter By Date'
            onClick={toggleFilter}
            className="!h-12"
          />

          <div className='relative flex justify-end mt-4 md:mt-0'>
            <Dropdown onOpen={showFilter} onClose={toggleFilter}>
              <Filter filterCallback={handleFilterChange} />
            </Dropdown>
          </div> */}
        </div>}
      </div>

      {id && view === "transactions" ? (
        <Transactions />
      ) : (
        <>
          {id && view !== "transactions" ? (
            <Details />
          ) : (
            <History />
          )}
        </>
      )}
    </Layout>
  );
};

export default Settlements;
