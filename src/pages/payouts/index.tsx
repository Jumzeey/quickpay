import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import ExportModal from "@/components/export-modal";
import Filter from "@/components/Filter";
import { FilterExport } from "@/components/filter-export";
import Icon from "@/components/icon";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/pagination";
import InitiateTransfer from "@/components/payouts/InitiateTransfer";
import RaiseDispute from "@/components/payouts/RaiseDispute";
import RequestRefund from "@/components/payouts/RequestRefund";
import ReceiptModal from "@/components/payouts/ReceiptModal";
import { ReferenceSearch } from "@/components/reference-search";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { usePaginatedStoreQuery } from "@/hooks/useOptimizedFetch";
import { useApiResponse } from "@/hooks/useApiResponse";
import { getBanks } from "@/services/bank";
import { Payout } from "@/services/payout";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency from "@/stores/useCurrency";
import useFilter from "@/stores/useFilter";
import usePayout from "@/stores/usePayout";
import debounce from "@/util/debounce";
import { apiEndpoints } from "@/util/endpoints";
import { capitalizeFirstLetter, copyToClipboard, formatDate, formatDateTime2, Modules } from "@/util/utils";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

interface PayoutsProps {
  isLoading: boolean;
  showFilterStatus: boolean;
  isInitiateTransferModalOpen: boolean;
  isRequestRefundModalOpen: boolean;
  isRaiseDisputeModalOpen: boolean;
  isMoreActionsOpen: boolean;
  [key: string]: boolean;
}

const PayoutHistory = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const { selectedCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLog, setCurrentLog] = useState<Payout | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [state, setState] = useState<PayoutsProps>({
    isLoading: true,
    showFilterStatus: false,
    isInitiateTransferModalOpen: false,
    isRequestRefundModalOpen: false,
    isRaiseDisputeModalOpen: false,
    isMoreActionsOpen: false,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportParams, setExportParams] = useState<Record<string, any> | null>(null);

  const { modules } = useAuthentication();
  const payoutCurrency: string[] = modules?.find((m: Modules) => m.product === 'Payout')?.sub_product?.currency;

  console.log({ modules, payoutCurrency });

  const {
    requeryPayout,
    requeryLoading,
    // fetchPayoutHistory: getPayoutHistory,
    payouts,
    pagination,
    payoutHistoryLoading,
    exportPayoutHistory,
  } = usePayout();

  const { showFilter, toggleFilter } = useFilter();

  const prevCurrencyRef = useRef(selectedCurrency);
  const effectivePage = selectedCurrency !== prevCurrencyRef.current ? 1 : currentPage;

  useEffect(() => {
    prevCurrencyRef.current = selectedCurrency;
  }, [selectedCurrency]);

  const {
    refetch: fetchPayoutHistory,
    invalidate: invalidatePayoutHistory
  } = usePaginatedStoreQuery(
    usePayout,
    'fetchPayoutHistory',
    {
      page: effectivePage,
      search: searchInput,
      status: statusFilter,
      start_date: filter.startDate,
      end_date: filter.endDate,
      currency: selectedCurrency,
    },
    {
      enabled: Boolean(mounted && selectedCurrency),
      onError: (error) => {
        console.error('❌ Failed to fetch payout history:', error);
        handleError(error);
      },
      cacheTime: state.isInitiateTransferModalOpen ? 0 : 3000,
    }
  );

  // const _getHistory = async () => {
  //   try {
  //     // Call the store method directly
  //     await getPayoutHistory({
  //       page: currentPage,
  //       search: searchInput,
  //       status: statusFilter as any,
  //       ...(filter.startDate ? {
  //         start_date: formatDate(filter.startDate),
  //         end_date: formatDate(filter.endDate),
  //       } : {}),
  //       currency: selectedCurrency,
  //     });
  //   } catch (error) {
  //     console.error('Error fetching payout history:', error);
  //   }
  // }

  const columns = [{
    key: 'amount',
    title: 'Amount',
    render: (value: any, row: any) => row?.amount || 'N/A'
  }, {
    key: 'recipient_account_name',
    title: 'Account Name',
    render: (value: any, row: any) => capitalizeFirstLetter(row?.recipient_account_name) || 'N/A',
  }, {
    key: 'reference',
    title: 'Transaction Reference',
    render: (value: any, row: any) => (
      <p className="text-[#090727] text-sm font-medium w-3/5 flex items-center justify-between gap-5">
        <span>{row?.reference || 'N/A'}</span>
        {row?.reference && (
          <button onClick={() => copyToClipboard(row?.reference)}>
            <Icon name="copy3" className="size-3 text-[#7F7F7F]" />
          </button>
        )}
      </p>
    ),
  }, {
    key: 'status',
    title: 'Status',
    render: (value: any, row: any) => row?.status || 'N/A'
  }, {
    key: 'created_at',
    title: 'Time Stamp',
    render: (value: any, row: any) => {
      if (!row?.created_at) return 'N/A';
      const [date, time] = formatDateTime2(row.created_at);

      return (
        <p className="text-[#090727] text-sm font-medium">
          {date}

          <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
        </p>
      )
    },
  }, {
    key: 'recipient_bank',
    title: 'Bank',
    render: (value: any, row: any) => capitalizeFirstLetter(row?.recipient_bank) || 'N/A',
  }, {
    key: 'recipient_account_number',
    title: 'Account Number',
  }, {
    key: 'balance_before',
    title: 'Balance Before',
  }, {
    key: 'current_balance',
    title: 'Balance After',
  }, {
    key: 'net_amount',
    title: 'Net Amount',
  }, {
    key: 'processing_fee',
    title: 'Processing Fee',
  }, {
    key: 'channel',
    title: 'Channel',
  }, {
    key: 'failure_reason',
    title: 'Failure Reason',
    render: (value: any, row: any) => row?.failure_reason || 'N/A',
  }, {
    key: 'session_id',
    title: 'Provider Reference',
  }];

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  const fetchBankDetails = async () => {
    const bankDetails = await getBanks();
    setState(prevState => ({
      ...prevState,
      bankDetails,
      isLoading: false,
    }));
  };

  const debouncedHandleParamsChange = useCallback(
    (value: string) => {
      const debouncedFn = debounce(() => {
        setSearchInput(value);
        setCurrentPage(1);
      }, 300);
      debouncedFn();
    },
    []
  );

  const toggleModal = (name: string) => {
    setState(prevState => ({
      ...prevState,
      [name]: !prevState[name],
    }));
  };

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handleRefreshPayoutHistory = async () => {
    await invalidatePayoutHistory();
  };

  const handleExport = async () => {
    // try {
    //   const result = await exportPayoutHistory({
    //     ...(searchInput ? { search: searchInput } : {}),
    //     ...(statusFilter ? { status: statusFilter as "pending" | "successful" | "failed" | "processing" } : {}),
    //     ...(filter.startDate
    //       ? {
    //         start_date: formatDate(filter.startDate),
    //         end_date: formatDate(filter.endDate),
    //       }
    //       : {}),
    //   });

    //   if (result.success && result.export_link) {
    //     downloadFile(result.export_link);
    //   }
    // } catch (error: any) {
    //   handleError(error);
    // }
    try {
      // Show loading state
      setIsExportModalOpen(true);

      // Set the params with the resolved account ID
      setExportParams({
        ...(searchInput ? { search: searchInput } : {}),
        ...(filter.startDate
          ? {
            start_date: formatDate(filter.startDate),
            end_date: formatDate(filter.endDate),
          }
          : {}),
        currency: selectedCurrency,
      });
    } catch (error: any) {
      console.error("Failed to get account ID for export:", error);
      handleError(error, "Failed to prepare export. Please try again.");
      setIsExportModalOpen(false);
    }
  };

  const handleViewReceipt = (row: any) => {
    setSelectedPayout(row);
    setIsReceiptModalOpen(true);
  };

  const handleRequery = async (reference: string) => {
    if (!reference) {
      handleError({ message: "Transaction reference is required for requery" });
      return;
    }

    try {
      const response = await requeryPayout(reference);

      if (response.success && response.data) {
        const transactionData = response.data.Transaction.data;
        handleSuccess({ message: `Requery successful! Status: ${transactionData.status}` });

        // Close the dropdown after successful requery
        setState(prevState => ({
          ...prevState,
          isMoreActionsOpen: false,
        }));

        await invalidatePayoutHistory();
        await fetchPayoutHistory();
      }
    } catch (error: any) {
      handleError(error, "Failed to requery transaction");
    }
  };

  const handleAction = (action: string) => {
    console.log(`${action} for transaction:`);

    // Close dropdown after action
    setState(prevState => ({
      ...prevState,
      isMoreActionsOpen: false,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setState(prevState => ({
          ...prevState,
          isMoreActionsOpen: false,
        }));
      }
    };

    if (state.isMoreActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.isMoreActionsOpen]);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  useEffect(() => {
    const handleCurrencyChange = async () => {
      if (!mounted || !selectedCurrency) return;

      setCurrentPage(1);
      await invalidatePayoutHistory();
    };

    handleCurrencyChange();
  }, [selectedCurrency, mounted]);

  const handleFilterChange = async (newFilter: any) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  if (!mounted) {
    return (
      <Layout pageTitle="Pay Outs" icon="disbursement">
        <WebPageTitle title="Payouts | Cray Merchant Portal" />
        <TableSkeleton />
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Pay Outs" icon="disbursement">
      <WebPageTitle title="Payouts | Cray Merchant Portal" />
      <div className="flex flex-col md:flex-row justify-between mb-8">
        <div>
          <PageHeader
            className="!mb-0"
            title="Payouts"
            description="Manage and track all payouts seamlessly, ensuring smooth and transparent transactions."
          />
        </div>

        <div className="relative flex gap-4 justify-end mt-4 md:mt-0">
          <ActionButton
            text="Initiate Payout"
            ariaLabel="Initiate Payout button"
            className="w-1/2 md:w-full"
            onClick={() => toggleModal('isInitiateTransferModalOpen')}
          />

          <div className="w-1/2 h-14">
            <CurrencySwitcher
              contentClassName="h-full"
              className="h-full"
              currencies={payoutCurrency}
            />
          </div>

          {/* <ActionButton
            ariaLabel='Filter by date button'
            text='Filter By Date'
            onClick={toggleFilter}
            className="!h-10"
          />

          <ActionButton
            ariaLabel='Export button'
            text='Export'
            onClick={handleExport}
            className="!h-10"
          /> */}
        </div>
      </div>

      <div>
        {payouts?.length > 0 && (
          <>
            <div className="flex flex-col my-7 md:flex-row justify-between">
              <ReferenceSearch
                value={searchInput}
                onClear={() => setSearchInput("")}
                handleParamsChange={handleParamsChange}
              />

              <FilterExport
                exportText="Get Statement"
                exportIconName="download2"
                handleExport={handleExport}
                toggleFilter={toggleFilter}
              />
            </div>

            <div className='relative flex justify-end mt-4 md:mt-0'>
              <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                <Filter filterCallback={handleFilterChange} />
              </Dropdown>
            </div>
          </>
        )}

        {payoutHistoryLoading ? (
          <TableSkeleton />
        ) : payouts?.length > 0 ? (
          <>
            <DynamicTable
              columns={columns}
              data={payouts}
              copyId
              copyField='Transaction Reference'
              primaryBtnContent={(row: any) => (
                <Button
                  text="View receipt"
                  ariaLabel="View receipt button"
                  className="!w-[191px] !h-[48px] p-0"
                  onClick={() => handleViewReceipt(row)}
                  primary
                />
              )}
              secondaryBtnContent={(row: any) => (
                <div className="relative block border border-[#EFF7FE] rounded-lg">
                  <button
                    onClick={() => {
                      toggleModal('isMoreActionsOpen')
                      setCurrentLog(row);
                    }}
                    className="text-sm text-[#005BB0] font-medium w-[150px] h-12 bg-[#EFF7FE] flex items-center justify-center"
                  >
                    More actions

                    <Image
                      src='/images/arrow-left-down.svg'
                      alt='more actions'
                      width={16}
                      height={16}
                      className='ml-3'
                    />
                  </button>
                  <div
                    ref={menuRef}
                    className={`absolute left-0 top-full mt-1.5 w-60 bg-white border border-[#ececec] rounded-lg shadow-lg z-10 overflow-hidden animate-fadeIn ${state.isMoreActionsOpen ? 'block' : 'hidden'}`}
                  >
                    <div className="py-1">
                      {(row?.status?.toLowerCase() === 'pending') && (
                        <button
                          onClick={() => handleRequery(row?.reference)}
                          disabled
                          className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors opacity-50 cursor-not-allowed"
                        >
                          <Image
                            src='/images/refresh-alt.svg'
                            alt='requery transaction'
                            width={16}
                            height={16}
                            className='ml-2'
                          />
                          <span className="text-[#090727]">
                            Requery transaction
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleModal('isRequestRefundModalOpen')}
                        disabled
                        className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors opacity-50 cursor-not-allowed"
                      >
                        <Image
                          src='/images/request.svg'
                          alt='request refund'
                          width={16}
                          height={16}
                          className='ml-2'
                        />
                        <span className="text-[#090727]">Request refund</span>
                      </button>

                      <button
                        onClick={() => toggleModal('isRaiseDisputeModalOpen')}
                        disabled
                        className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors opacity-50 cursor-not-allowed"
                      >
                        <Image
                          src='/images/alert.svg'
                          alt='raise dispute'
                          width={16}
                          height={16}
                          className='ml-2'
                        />
                        <span className="text-[#FD2727]">Raise dispute</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              lastPage={lastPage || 1}
              onPageChange={handlePageChange}
            />

            {isExportModalOpen && exportParams && (
              <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => {
                  setIsExportModalOpen(false);
                  setExportParams(null);
                }}
                title="Export Payout History"
                exportEndpoint={apiEndpoints.payouts.EXPORT_PAYOUT_HISTORY_TRANSACTIONS}
                statusEndpoint={apiEndpoints.payouts.GET_PAYOUT_EXPORT_STATUS}
                params={exportParams}
                exportType="payout-history"
              />
            )}
          </>
        ) : (
          <EmptyState
            title="No Payout Found"
            subTitle="We couldn't find any Payout for this account"
            image="/images/dashboard/disbursement/disbursement-empty-state.svg"
          >
            <ActionButton
              text="Initiate Payout"
              ariaLabel="Initiate Payout button"
              onClick={() => toggleModal('isInitiateTransferModalOpen')}
            />
          </EmptyState>
        )}

        <InitiateTransfer
          isModalOpen={state.isInitiateTransferModalOpen}
          closeModal={() => toggleModal('isInitiateTransferModalOpen')}
          fetchPayoutHistory={handleRefreshPayoutHistory}
        />

        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          payout={selectedPayout}
        />

        {currentLog && (
          <>
            <RequestRefund
              log={currentLog}
              isModalOpen={state.isRequestRefundModalOpen}
              closeModal={() => toggleModal('isRequestRefundModalOpen')}
              fetchPayoutHistory={handleRefreshPayoutHistory}
            />

            <RaiseDispute
              isModalOpen={state.isRaiseDisputeModalOpen}
              closeModal={() => toggleModal('isRaiseDisputeModalOpen')}
              fetchPayoutHistory={handleRefreshPayoutHistory}
            />
          </>
        )}

      </div>
    </Layout>
  );
};

export default PayoutHistory;