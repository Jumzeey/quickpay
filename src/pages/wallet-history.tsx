import React, { useState, useEffect, Fragment } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Card from "@/components/Card";
import { getWalletHistory } from "@/services/transaction";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import Button from "@/components/button";
import Image from "next/image";
import { downloadFile, formatBalance, formatDate, notifyError } from "@/util/utils";
import useFilter from "@/stores/useFilter";
import Dropdown from "@/components/Dropdown";
import Filter from "@/components/Filter";
import useTransaction from "@/stores/useTransaction";
import Pagination from "@/components/pagination";

interface HistoryProps {
  history: any[];
  isLoading: boolean;
  showFilterStatus: boolean;
}
const WalletHistory = () => {
  const {
    fetchWalletHistory,
    wallet_history,
    pagination,
    getWalletHistoryLoading,
  } = useTransaction();

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;
  const [state, setState] = useState<HistoryProps>({
    history: [],
    isLoading: true,
    showFilterStatus: false,
  });
  const { showFilter, toggleFilter } = useFilter();
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns = [
    "s/n",
    "reference",
    "amount",
    "running balance",
    "transaction type",
    "created at",
    // "balance type",
    // "current balance",
    // "previous ledger balance",
    // "current ledger balance",
    // "previous locked balance",
    // "current locked balance",
    // "status",
    // "description",
  ];

  const closeDropdown = () => {
    setState({
      ...state,
      showFilterStatus: false,
    });
  };
  const handleExport = async () => {
    try {
      const response = await getWalletHistory({ export: true });
      downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

   useEffect(() => {
     fetchWalletHistory({
       page: currentPage,
       per_page: pagination.per_page,
       ...(filter.startDate
         ? {
             start_date: formatDate(filter.startDate),
             end_date: formatDate(filter.endDate),
           }
         : {}),
     });
   }, [currentPage, filter.endDate, filter.startDate, pagination.per_page]); // Added pagination.per_page to dependency array

   // Calculate the start and end index for the current page
   const startIndex = (currentPage - 1) * pagination.per_page;
   const endIndex = startIndex + pagination.per_page;

   // Slice the wallet_history array to display only the current page's items
   const currentPageHistory = wallet_history.slice(startIndex, endIndex);


  return (
    <Layout pageTitle="Balance History" icon="wallet-history">
      <WebPageTitle title="Balance History | Ramp Merchant Portal" />
      <div className="">
        {/* <h2 className="text-xl font-semibold">Manage Wallet History</h2>
        <p className="text-sm pt-3 pb-5">
          Manage wallet history within your company
        </p> */}
        {getWalletHistoryLoading ? (
          <TableSkeleton singleButton />
        ) : wallet_history?.length !== 0 ? (
          <Fragment>
            <Card>
              <div className="flex flex-col md:flex-row justify-end gap-4 mt-5">
                <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                  <Button
                    ariaLabel="Filter by date button"
                    text="Filter By Date"
                    onClick={() => toggleFilter()}
                    className="!w-full md:!w-32 !h-10"
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
              <div className="flex md:justify-end pb-5"></div>
              <Table columns={columns} className="mt-7">
                {currentPageHistory.map((item: any, index: number) => {
                  // const activeItem = item.status === "Active";
                  return (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">
                        {item.transaction_reference}
                      </td>
                      <td className="text-sm px-5 py-6">${item.amount}</td>
                      {/* <td className="text-sm px-5 py-6">{item.balance_type}</td> */}

                      {/* <td className="text-sm px-5 py-6">
                        {item.previous_balance}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.current_balance}
                      </td> */}

                      {/* <td className="text-sm px-5 py-6">
                        {item.previous_ledger_balance}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.current_ledger_balance}
                      </td>

                      <td className="text-sm px-5 py-6">
                        {item.previous_locked_balance}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.current_locked_balance}
                      </td> */}
                      <td className="text-sm px-5 py-6">
                        {formatBalance(item.running_balance)}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.transaction_type}
                      </td>

                      <td className="text-sm px-5 py-6">{item.created_at}</td>
                      {/* <td className="text-xs px-5 py-6">
                        <div
                          className={`text-center rounded-lg py-1 px-3 ${
                            item.status === "Successful"
                              ? "text-success bg-[#E9F7EF]"
                              : "text-danger bg-[#e0440326]"
                          }`}
                        >
                          {item.status}
                        </div>
                      </td>
                      <td className="text-sm px-5 py-6">{item.description}</td> */}
                    </tr>
                  );
                })}
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
            title="No Balance History found"
            subTitle="We couldn't find any balance history to this account"
            image="/images/dashboard/disbursement/disbursement-empty-state.svg"
          ></EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default WalletHistory;
