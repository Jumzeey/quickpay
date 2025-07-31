import React, { useState, useEffect, Fragment, useCallback } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import IconWrapper from "@/components/IconWrapper";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/button";
import Dropdown from "@/components/Dropdown";
import TransactionDetails from "@/components/transactionDetails";
import Filter from "@/components/Filter";
import useClickEvent from "@/stores/useClickEvent";
import useFilter from "@/stores/useFilter";
import TableSkeleton from "@/components/TableSkeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { downloadFile, notifyError, notifySuccess } from "@/util/utils";
import WebPageTitle from "@/components/WebPageTitle";
import useCollectionHistory from "@/stores/useCollectionHistory";
import Pagination from "@/components/pagination";
import { getPaymentMandates, refreshStatus } from "@/services/collections";
import debounce from "@/util/debounce";
import Icon from "@/components/icon";
import Link from "next/link";

interface CollectionsProps {
  paymentMandates: any[];
  isLoading: boolean;
  showMandates: boolean;
  showFilterStatus: boolean;
  dropdownIndex: null | number;
}

const PaymentMandate = () => {
  const { selectedItem, handleClick } = useClickEvent();
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const {
    fetchPaymentMandates,
    mandates,
    pagination,
    getPaymentMandateLoading,
  } = useCollectionHistory();

  const { showFilter, toggleFilter } = useFilter();

  const [state, setState] = useState<CollectionsProps>({
    paymentMandates: [],
    isLoading: true,
    showMandates: false,
    showFilterStatus: false,
    dropdownIndex: null,
  });

  const [showMandates, setShowMandates] = useState(false);

  const closeDropdown = () => {
    setState({
      ...state,
      showFilterStatus: false,
    });
  };

  const columns = [
    "s/n",
    "ref",
    "type",
    "start date",
    "end date",
    "frequency",
    "amount",
    "status",
    "submitted",
    "action",
  ];

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handleExport = async () => {
    try {
      const response = await getPaymentMandates({ export: true });
      downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  useEffect(() => {
    fetchPaymentMandates({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filter.startDate
        ? { startDate: filter.startDate, endDate: filter.endDate || undefined }
        : {}),
    });
  }, [
    searchInput,
    currentPage,
    filter.endDate,
    filter.startDate,
    statusFilter,
    fetchPaymentMandates,
  ]);

  const handleDropdownToggle = (index: number | null, selectedItem: any) => {
    setState({
      ...state,
      dropdownIndex: state.dropdownIndex === index ? null : index,
    });
    handleClick(selectedItem, true);
  };

  const handleRefresh = async () => {
    try {
      const response = await refreshStatus(selectedItem.id);
      await fetchPaymentMandates({
        page: currentPage,
        ...(searchInput ? { search: searchInput } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(filter.startDate
          ? { startDate: filter.startDate, endDate: filter.endDate || undefined }
          : {}),
      });
      //@ts-ignore
      notifySuccess(response.message);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  return (
    <Layout pageTitle="Payment Mandate" icon="payment-mandate">
      <WebPageTitle title="Payment Mandate | Ramp Merchant Portal" />

      {showMandates ? (
        <TransactionDetails
          selectedItem={selectedItem}
          setState={setShowMandates}
          state={showMandates}
          selectedModule="paymentMandate"
        />
      ) : (
        <div>
          <h2 className="text-xl font-semibold">Manage Payment Mandates</h2>
          <p className="text-sm pt-3 pb-5">
            Manage Payment mandates within your company
          </p>
          {getPaymentMandateLoading ? (
            <Fragment>
              <TableSkeleton />
            </Fragment>
          ) : mandates?.length !== 0 ? (
            <Fragment>
              <Card className="mt-10">
                <div className="flex flex-col md:flex-row justify-between pb-5">
                  <Link href="/collections/payment-mandate/create">
                    <Button
                      ariaLabel="Create Payment Mandate"
                      text="Create Payment Mandate"
                      className="md:!w-48 !h-10 mb-5 md:mb-0"
                      primary
                    />
                  </Link>
                  <div className="relative">
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
                      className="absolute top-[10px] left-3"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 mt-5 md:mt-0">
                    {/* <Button
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
                    /> */}
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
                      className="md:!w-24 !h-10"
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
                    <p onClick={() => setStatusFilter("Pending")}>Pending</p>
                    <p onClick={() => setStatusFilter("Failed")}>Failed</p>
                    <p onClick={() => setStatusFilter("Successful")}>
                      Successful
                    </p>
                  </Dropdown>
                </div>
                <div className="relative flex justify-end -mt-4">
                  <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                    <Filter filterCallback={setFilter} />
                  </Dropdown>
                </div>
                <Table columns={columns} className="mt-7">
                  {mandates?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">{item.reference}</td>
                      <td className="text-sm px-5 py-6">
                        {item.frequency_type}
                      </td>
                      <td className="text-sm px-5 py-6">{item.start_date}</td>
                      <td className="text-sm px-5 py-6">{item.end_date}</td>
                      <td className="text-sm px-5 py-6">{item.frequency}</td>

                      <td className="text-sm px-5 py-6">{item.amount}</td>
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

                      <td className="text-sm px-5 py-6">{item.is_submitted}</td>

                      <td
                        className="text-sm px-5 py-6"
                        onClick={() => handleDropdownToggle(index, item)}
                      >
                        <Image
                          src="/images/dashboard/collections/more.svg"
                          className="cursor-pointer"
                          alt="More Icon"
                          width={4}
                          height={16}
                          priority
                        />

                        <div className="flex justify-end relative">
                          <Dropdown
                            onOpen={state.dropdownIndex === index}
                            onClose={closeDropdown}
                          >
                            <ul className="list-none p-0">
                              <li
                                className="flex items-center gap-2 pb-5 hover:text-primary"
                                onClick={() => setShowMandates(true)}
                              >
                                <IconWrapper
                                  src="/images/eye-on-dark.svg"
                                  className="cursor-pointer"
                                  alt="Eye Icon"
                                  width={24}
                                  height={24}
                                />
                                <span>View</span>
                              </li>
                              <li
                                className="flex items-center gap-2 ml-1 hover:text-primary"
                                onClick={handleRefresh}
                              >
                                <IconWrapper
                                  src="/images/dashboard/reboot.svg"
                                  width={14}
                                  height={14}
                                  alt="reload icon"
                                />
                                <span>Refresh</span>
                              </li>
                            </ul>
                          </Dropdown>
                        </div>
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
              title="No payment mandate found"
              subTitle="We couldn't find any payment mandate for this account"
              image="/images/dashboard/collections/paymentMandateEmpty.svg"
            >
              <Link href="/collections/payment-mandate/create">
                <Button
                  ariaLabel="Create Payment Mandate"
                  text="Create Payment Mandate"
                  className="!w-48 !h-10"
                  primary
                />
              </Link>
            </EmptyState>
          )}
        </div>
      )}
    </Layout>
  );
};

export default PaymentMandate;
