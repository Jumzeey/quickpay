import React, { useState, useEffect, Fragment, useCallback } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import IconWrapper from "@/components/IconWrapper";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/button";
import Dropdown from "@/components/Dropdown";
import Filter from "@/components/Filter";
import useFilter from "@/stores/useFilter";
import TableSkeleton from "@/components/TableSkeleton";
import { getBankDetails } from "@/services/user";
import WebPageTitle from "@/components/WebPageTitle";
import useDisbursement from "@/stores/useDisbursement";
import { useRouter } from "next/router";
import Pagination from "@/components/pagination";
import "react-loading-skeleton/dist/skeleton.css";
import { getDisbursementHistory } from "@/services/disbursement";
import { downloadFile, notifyError, formatDate } from "@/util/utils";
import debounce from "@/util/debounce";
interface Disbursement {
  reference: string;
  amount: number;
  processing_fee: number;
  balance_before: number;
  current_balance: number;
  created_at: string;
  status: string;
  id: string;
}
interface DisbursementsProps {
  disbursementsHistory: {
    disbursements: Disbursement[];
  };
  isLoading: boolean;
  showDisbursements: boolean;
  showFilterStatus: boolean;
}

const DisbursementHistory = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [state, setState] = useState<DisbursementsProps>({
    disbursementsHistory: { disbursements: [] },
    isLoading: true,
    showDisbursements: false,
    showFilterStatus: false,
  });

  const {
    fetchDisbursementHistory,
    disbursements,
    pagination,
    getDisbursementHistoryLoading,
  } = useDisbursement();

  const { showFilter, toggleFilter } = useFilter();

  const columns = [
    "s/n",
    "ref",
    "amount",
    "charge",
    "session id",
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
      const response = await getDisbursementHistory({ export: true });
      downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  useEffect(() => {
    fetchDisbursementHistory({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
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
    <Layout pageTitle="Disbursement History" icon="disbursement">
      <WebPageTitle title="Disbursement History | Ramp Merchant Portal" />
      <div>
        <h2 className="text-xl font-semibold">Manage Disbursement History</h2>
        <p className="text-sm pt-3 pb-5">
          Manage disbursements within your company
        </p>
      </div>
      <div>
        {getDisbursementHistoryLoading ? (
          <Fragment>
            <TableSkeleton />
          </Fragment>
        ) : disbursements?.length !== 0 ? (
          <Fragment>
            <Card className="mt-10">
              <div className="flex flex-col md:flex-row justify-between pb-5 gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    placeholder="Search by reference or session ID"
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
                  <Button
                    ariaLabel="Export button"
                    text="Export"
                    className="!w-full md:!w-24 !h-10"
                    onClick={handleExport}
                    plain
                  />
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
                {disbursements?.map((item: any, index: number) => (
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
                    <td className="text-sm px-5 py-6">{item.session_id}</td>
                    <td className="text-sm px-5 py-6">{item.created_at}</td>
                    <td className="text-sm px-5 py-6">
                      <div
                        className={`text-center rounded-lg py-3 px-3 ${
                          item.status === "Successful"
                            ? "text-[green] bg-[#E9F7EF]"
                            : "text-danger bg-[#e0440326]"
                        }`}
                      >
                        {item.status}
                      </div>
                    </td>
                    <td
                      className="text-sm px-5 py-6"
                      onClick={() => router.push(`disbursements/${item.id}`)}
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
            title="No Disbursement Found"
            subTitle="We couldn't find any Disbursement for this account"
            image="/images/dashboard/disbursement/disbursement-empty-state.svg"
          >
            <Button
              text="Initiate Transfer"
              ariaLabel="Initiate Transfer button"
              className="!w-[191px] !h-[48px]"
              onClick={() => router.push(`/disbursements/disburse`)}
              primary
            />
          </EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default DisbursementHistory;
