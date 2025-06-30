import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import Card from "@/components/Card";
import Dropdown from "@/components/Dropdown";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import IconWrapper from "@/components/IconWrapper";
import Layout from "@/components/layout";
import Pagination from "@/components/pagination";
import Table from "@/components/table";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { getPayoutHistory } from "@/services/payout";
import { getBankDetails } from "@/services/user";
import useFilter from "@/stores/useFilter";
import usePayout from "@/stores/usePayout";
import debounce from "@/util/debounce";
import { downloadFile, formatDate, notifyError } from "@/util/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

interface Payout {
  reference: string;
  amount: number;
  processing_fee: number;
  balance_before: number;
  current_balance: number;
  created_at: string;
  status: string;
  id: string;
}
interface PayoutsProps {
  payoutsHistory: {
    payouts: Payout[];
  };
  isLoading: boolean;
  showPayouts: boolean;
  showFilterStatus: boolean;
}

const OnlineStore = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [state, setState] = useState<PayoutsProps>({
    payoutsHistory: { payouts: [] },
    isLoading: true,
    showPayouts: false,
    showFilterStatus: false,
  });

  const {
    fetchPayoutHistory,
    payouts,
    pagination,
    payoutHistoryLoading,
  } = usePayout();

  const { showFilter, toggleFilter } = useFilter();

  const columns = [
    "s/n",
    "name",
    "amount",
    "charge",
    "balance before",
    "balance after",
    "date",
    "status",
    "action",
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;
  const fetchBankDetails = async () => {
    const bankDetails = await getBankDetails();
    setState(prevState => ({
      ...prevState,
      bankDetails,
      isLoading: false,
    }));
  };

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const closeDropdown = () => {
    setState({
      ...state,
      showFilterStatus: false,
    });
  };

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handleExport = async () => {
    try {
      const response = await getPayoutHistory({ export: true });
      if (response.export_link) {
        downloadFile(response.export_link);
      }
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  useEffect(() => {
    fetchPayoutHistory({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(statusFilter ? { status: statusFilter as "pending" | "successful" | "failed" | "processing" } : {}),
      ...(filter.startDate
        ? {
          start_date: formatDate(filter.startDate),
          end_date: formatDate(filter.endDate),
        }
        : {}),
    });
  }, [
    searchInput,
    currentPage,
    filter.endDate,
    filter.startDate,
    statusFilter,
  ]);

  return (
    <Layout pageTitle="Online Store History" icon="ecommerce">
      <WebPageTitle title="Online Store History | Ramp Merchant Portal" />
      <div>
        <h2 className="text-xl font-semibold">Manage Your Online Store</h2>
        <p className="text-sm pt-3 pb-5">
          Manage the Online Store Within Your Company
        </p>
      </div>
      <div>
        {payoutHistoryLoading ? (
          <Fragment>
            <TableSkeleton />
          </Fragment>
        ) : payouts?.length !== 0 ? (
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
                    ariaLabel="Filter by status button"
                    text="Filter By Status"
                    onClick={() =>
                      setState({
                        ...state,
                        showFilterStatus: !state.showFilterStatus,
                      })
                    }
                    className="!w-full md:!w-32 !h-10"
                    plain
                  />
                  <Button
                    ariaLabel="Filter by date button"
                    text="Filter By Date"
                    onClick={() => toggleFilter()}
                    className="!w-full md:!w-32 !h-10"
                    plain
                  />
                  <Link href="/e-commerce/online-store/create">
                    <Button
                      ariaLabel="Create Online Store"
                      text="Create Online Store"
                      className="md:!w-48 !h-10 mb-5 md:mb-0"
                      primary
                    />
                  </Link>
                </div>
              </div>
              <div className="relative flex justify-end md:mt-0">
                <Dropdown
                  onOpen={state.showFilterStatus}
                  onClose={closeDropdown}
                >
                  <p
                    onClick={() => setStatusFilter("Pending")}
                    className="font-bold"
                  >
                    Pending
                  </p>
                  <p
                    onClick={() => setStatusFilter("Successful")}
                    className="font-bold"
                  >
                    Successful
                  </p>
                  <p
                    onClick={() => setStatusFilter("Failed")}
                    className="font-bold"
                  >
                    Failed
                  </p>
                </Dropdown>
              </div>
              <div className="relative flex justify-end mt-4 md:mt-0">
                <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                  <Filter filterCallback={setFilter} />
                </Dropdown>
              </div>

              <Table columns={columns} className="mt-7">
                {payouts?.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b last:border-none border-grey-200"
                  >
                    <td className="text-sm px-5 py-6">{index + 1}</td>
                    <td className="text-sm px-5 py-6">
                      {item.reference || "N/A"}
                    </td>
                    <td className="text-sm px-5 py-6">{item.amount}</td>
                    <td className="text-sm px-5 py-6">{item.processing_fee}</td>
                    <td className="text-sm px-5 py-6">{item.balance_before}</td>

                    <td className="text-sm px-5 py-6">
                      {item.current_balance}
                    </td>
                    <td className="text-sm px-5 py-6">{item.created_at}</td>
                    <td className="text-sm px-5 py-6">
                      <div
                        className={`text-center rounded-lg py-3 px-3 ${item.status === "Successful"
                          ? "text-[green] bg-[#E9F7EF]"
                          : "text-danger bg-[#e0440326]"
                          }`}
                      >
                        {item.status}
                      </div>
                    </td>
                    <td
                      className="text-sm px-5 py-6"
                      // TODO: this page does not exist yet
                      onClick={() => router.push(`payouts/${item.id}`)}
                    >
                      <IconWrapper
                        src="/images/eye-on-dark.svg"
                        className="cursor-pointer"
                        alt="Eye Icon"
                        width={24}
                        height={24}
                      />
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
            title="No Payout Found"
            subTitle="We couldn't find any Payout for this account"
            image="/images/dashboard/disbursement/disbursement-empty-state.svg"
          >
            <ActionButton
              text="Initiate Payout"
              ariaLabel="Initiate Payout button"
              onClick={() => router.push(`/payouts?action=initiate_transfer`)}
            />
          </EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default OnlineStore;
