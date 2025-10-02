import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import Card from "@/components/Card";
import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import Layout from "@/components/layout";
import Pagination from "@/components/pagination";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import useFilter from "@/stores/useFilter";
import useSubaccount from "@/stores/useSubAccount";
import { capitalizeFirstLetter } from "@/util/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const columns = [
  { key: 'index', title: 'S/N' },
  { key: 'merchant_name', title: 'Merchant Name' },
  { key: 'reference', title: 'Reference' },
  { key: 'amount', title: 'Amount' },
  { key: 'charge', title: 'Charge' },
  {
    key: 'status',
    title: 'Status',
    render: (value: string) => (
      <div
        className={`text-center rounded-lg py-1 px-3 ${value === "Active"
          ? "text-success bg-[#E9F7EF]"
          : "text-danger bg-[#e0440326]"
          }`}
      >
        {value}
      </div>
    )
  },
  { key: 'total', title: 'Total' },
  { key: 'created_at', title: 'Created At' }
];

const SubaccountTransactions = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const {
    fetchSubaccountTransactionsHistory,
    subaccount_transactions,
    pagination,
    getSubaccountTransactionsHistoryLoading: isLoading
  } = useSubaccount();

  const { showFilter, toggleFilter } = useFilter();

  usePaginatedEffect(
    (params) => fetchSubaccountTransactionsHistory(Number(id), params),
    {
      page: currentPage,
      search: searchInput,
      ...(filter.startDate ? {
        start_date: filter.startDate,
        end_date: filter.endDate,
      } : {}),
      _routerReady: router.isReady && !!id
    },
    {
      enabled: router.isReady && !!id,
      onError: (error) => {
        console.error("Failed to fetch subaccount transactions:", error);
      }
    }
  );

  // Transform data for DynamicTable
  const transformedData = subaccount_transactions?.map((item: any, index: number) => ({
    index: index + 1,
    merchant_name: capitalizeFirstLetter(item.merchant_name) || "N/A",
    reference: item.reference || "N/A",
    amount: item.amount || "N/A",
    charge: item.charge || "N/A",
    status: item.status || "N/A",
    total: item.total || "N/A",
    created_at: item.created_at || "N/A"
  }));

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Layout pageTitle="Sub Account Transactions" icon="SUBACCOUNT">
      <WebPageTitle title="Sub Account Transactions| Cray Merchant Portal" />

      <div className="mt-5 mb-5">
        <Image
          src="/images/arrow-back.svg"
          className="cursor-pointer"
          width={36}
          height={36}
          onClick={() => router.back()}
          alt="back icon"
        />
      </div>

      <div>
        {isLoading ? (
          <TableSkeleton />
        ) : subaccount_transactions?.length ? (
          <Card className="mt-10">
            <div className="flex flex-col md:flex-row justify-between pb-5 gap-4">
              <div className="relative flex-1 mb-7">
                <input
                  type="text"
                  id="searchInput"
                  name="searchInput"
                  placeholder="Search by reference"
                  onChange={handleParamsChange}
                  className="border-0 h-[40px] w-full md:w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                />
                <Image
                  src="/images/search.svg"
                  width={20}
                  height={20}
                  alt="Search Icon"
                  className="absolute top-1/2 left-3 transform -translate-y-1/2"
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                <ActionButton
                  ariaLabel="Filter button"
                  text="Filter"
                  onClick={toggleFilter}
                  className="!w-full md:!w-24 !h-10"
                />
              </div>
            </div>

            <div className="relative flex justify-end mt-4 md:mt-0">
              <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                <Filter filterCallback={setFilter} />
              </Dropdown>
            </div>

            <DynamicTable
              columns={columns}
              data={transformedData || []}
              maxColumns={3}
            />

            <Pagination
              lastPage={pagination.last_page}
              currentPage={currentPage}
              totalPages={pagination.last_page}
              onPageChange={handlePageChange}
            />
          </Card>
        ) : (
          <EmptyState
            title="No Subaccount Transactions found"
            subTitle="We couldn't find any Subaccount Transactions"
            image="/images/dashboard/your-business/subaccount-empty.svg"
          >
            <ActionButton
              text="Add Subaccount"
              ariaLabel="Add Subaccount button"
              onClick={() => router.push(`/your-business/sub-accounts/create`)}
            />
          </EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default SubaccountTransactions;
