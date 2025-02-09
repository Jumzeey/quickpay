import React, {
  useState,
  useEffect,
  Fragment,
  ChangeEvent,
  useCallback,
} from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/button";
import Dropdown from "@/components/Dropdown";
import Filter from "@/components/Filter";
import useClickEvent from "@/stores/useClickEvent";
import useFilter from "@/stores/useFilter";
import TableSkeleton from "@/components/TableSkeleton";
import "react-loading-skeleton/dist/skeleton.css";
import WebPageTitle from "@/components/WebPageTitle";
import useSubaccount from "@/stores/useSubAccount";
import { useRouter } from "next/router";
import {
  capitalizeFirstLetter,
  downloadFile,
  formatDate,
  notifyError,
} from "@/util/utils";
import Pagination from "@/components/pagination";
import { getSubaccountTransactions } from "@/services/sub-account";
import { debounce } from "chart.js/helpers";
interface SubaccountsTransactionsProps {
  subaccountsTransactionsHistory: any[];
  isLoading: boolean;
  showSubaccountsTransactions: boolean;
  dropdownIndex: null | number;
  showFilter: boolean;
}

const columns = [
  "s/n",
  "merchant name",
  "amount",
  "charge",
  "status",
  "total",
  "created at",
];

const SubaccountTransactions = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { id } = router.query;
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const {
    fetchSubaccountTransactionsHistory,
    subaccount_transactions,
    pagination,
    getSubaccountTransactionsHistoryLoading,
  } = useSubaccount();

  const { showFilter, toggleFilter } = useFilter();

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExport = async () => {
    try {
      const response = await getSubaccountTransactions({ export: true });
      downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  useEffect(() => {
    fetchSubaccountTransactionsHistory(id, {
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),

      ...(filter.startDate
        ? {
            start_date: formatDate(filter.startDate),
            end_date: formatDate(filter.endDate),
          }
        : {}),
    });
  }, [searchInput, currentPage, filter.endDate, filter.startDate]);

  return (
    <>
      <Layout pageTitle="Subaccount Transactions" icon="SUBACCOUNT">
        <WebPageTitle title="Subaccount Transactions| Ramp Merchant Portal" />
        <div>
          <h2 className="text-xl font-semibold">
            Manage Subaccount Transactions
          </h2>
          <p className="text-sm pt-3 pb-5">
            Manage Subaccount Transactions Within Your Company
          </p>
        </div>
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
          {getSubaccountTransactionsHistoryLoading ? (
            <Fragment>
              <TableSkeleton />
            </Fragment>
          ) : subaccount_transactions?.length !== 0 ? (
            <Fragment>
              <Card className="mt-10">
                <div className="flex flex-col md:flex-row justify-between pb-5 gap-4">
                  <div className="relative flex-1">
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
                    <Button
                      ariaLabel="Filter button"
                      text="Filter"
                      onClick={() => toggleFilter()}
                      className="!w-full md:!w-24 !h-10"
                      plain
                    />
                    <Button
                      ariaLabel="Export button"
                      text="Export"
                      className="!w-full md:!w-24 !h-10"
                      onClick={handleExport}
                      plain
                    />
                  </div>
                </div>

                <div className="relative flex justify-end mt-4 md:mt-0">
                  <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                    <Filter filterCallback={setFilter} />
                  </Dropdown>
                </div>
                <Table columns={columns} className="mt-7">
                  {subaccount_transactions?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">
                        {capitalizeFirstLetter(item.merchant_name) || "N/A"}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.amount || "N/A"}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.charge || "N/A"}
                      </td>
                      <td className="text-xs px-5 py-6">
                        <div
                          className={`text-center rounded-lg py-1 px-3 ${
                            item.status === "Active"
                              ? "text-success bg-[#E9F7EF]"
                              : "text-danger bg-[#e0440326]"
                          }`}
                        >
                          {item.status}
                        </div>
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.total || "N/A"}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.created_at || "N/A"}
                      </td>
                    </tr>
                  ))}
                </Table>
                <Pagination
                  lastPage={lastPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </Card>
            </Fragment>
          ) : (
            <EmptyState
              title="No Subaccount Transactions found"
              subTitle="We couldn't find any Subaccount Transactions"
              image="/images/dashboard/your-business/subaccount-empty.svg"
            >
              <Button
                text="Add Subaccount"
                ariaLabel="Add Subaccount button"
                className="!w-[191px] !h-[48px]"
                onClick={() =>
                  router.push(`/your-business/sub-accounts/create`)
                }
                primary
              />
            </EmptyState>
          )}
        </div>
      </Layout>
    </>
  );
};

export default SubaccountTransactions;
