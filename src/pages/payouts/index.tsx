import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import Icon from "@/components/icon";
import Layout from "@/components/layout";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/pagination";
import InitiateTransfer from "@/components/payouts/InitiateTransfer";
import RaiseDispute from "@/components/payouts/RaiseDispute";
import RefundRequest from "@/components/payouts/RefundRequest";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { usePaginatedStoreQuery } from "@/hooks/useOptimizedFetch";
import { getBankDetails } from "@/services/user";
import useCurrency from "@/stores/useCurrency";
import useFilter from "@/stores/useFilter";
import usePayout from "@/stores/usePayout";
import debounce from "@/util/debounce";
import { capitalizeFirstLetter, copyToClipboard, downloadFile, formatAmount, formatDate, formatDateTime2, notifyError } from "@/util/utils";
import Image from "next/image";
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

interface Payout {
  account_name: string;
  account_number: string;
  bank: string;
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
  isLoading: boolean;
  showFilterStatus: boolean;
  isInitiateTransferModalOpen: boolean;
  isRefundRequestModalOpen: boolean;
  isRaiseDisputeModalOpen: boolean;
  isMoreActionsOpen: boolean;
  [key: string]: boolean;
}

const PayoutHistory = () => {
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
  const [state, setState] = useState<PayoutsProps>({
    isLoading: true,
    showFilterStatus: false,
    isInitiateTransferModalOpen: false,
    isRefundRequestModalOpen: false,
    isRaiseDisputeModalOpen: false,
    isMoreActionsOpen: false,
  });

  const {
    fetchPayoutHistory: getPayoutHistory,
    payouts,
    pagination,
    payoutHistoryLoading,
    exportPayoutHistory,
  } = usePayout();

  const { showFilter, toggleFilter } = useFilter();

  const {
    refetch: fetchPayoutHistory,
    invalidate: invalidatePayoutHistory
  } = usePaginatedStoreQuery(
    usePayout,
    'fetchPayoutHistory',
    {
      page: currentPage,
      search: searchInput,
      status: statusFilter,
      start_date: filter.startDate,
      end_date: filter.endDate,
      currency: selectedCurrency,
    },
    {
      onSuccess: (data) => {
        console.log('✅ Payout history fetched successfully');
      },
      onError: (error) => {
        console.error('❌ Failed to fetch payout history:', error);
        notifyError(error.message);
      },
      cacheTime: state.isInitiateTransferModalOpen ? 0 : 3000,
    }
  );

  const _getHistory = async (newFilter?: any) => {
    try {
      // Call the store method directly
      await getPayoutHistory({
        page: currentPage,
        search: searchInput,
        status: statusFilter as any,
        ...(newFilter.startDate ? {
          start_date: formatDate(newFilter.startDate),
          end_date: formatDate(newFilter.endDate),
        } : {}),
        currency: selectedCurrency,
      });
    } catch (error) {
      console.error('Error fetching payout history:', error);
    }
  }

  const columns = [{
    key: 'amount',
    title: 'Amount',
    render: (value: any, row: any) => formatAmount(row?.amount) || 'N/A'
  }, {
    key: 'recipient_account_name',
    title: 'Account Name',
    render: (value: any, row: any) => capitalizeFirstLetter(row?.recipient_account_name) || 'N/A',
  }, {
    key: 'recipient_bank',
    title: 'Bank',
    render: (value: any, row: any) => capitalizeFirstLetter(row?.recipient_bank) || 'N/A',
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
    key: 'recipient_account_number',
    title: 'Account Number',
  }, {
    key: 'session_id',
    title: 'Provider Reference',
  }, {
    key: 'balance_before',
    title: 'Balance Before',
  }, {
    key: 'current_balance',
    title: 'Balance After',
  }, {
    key: 'status',
    title: 'Transaction Status',
  }];

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
    (value: string) => {
      const debouncedFn = debounce(() => {
        setSearchInput(value);
      }, 300);
      debouncedFn();
    },
    [setSearchInput]
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
    // Invalidate the cache first
    await invalidatePayoutHistory();
    // Then trigger a refetch
    await _getHistory();
  };

  const handleExport = async () => {
    try {
      const result = await exportPayoutHistory({
        ...(searchInput ? { search: searchInput } : {}),
        ...(statusFilter ? { status: statusFilter as "pending" | "successful" | "failed" | "processing" } : {}),
        ...(filter.startDate
          ? {
            start_date: formatDate(filter.startDate),
            end_date: formatDate(filter.endDate),
          }
          : {}),
      });

      if (result.success && result.export_link) {
        downloadFile(result.export_link);
      }
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const handleDownload = async () => {
    console.log('Approved');
  };

  const handleAction = (action: string) => {
    console.log(`${action} for transaction`);
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  useEffect(() => {
    const handleCurrencyChange = async () => {
      if (!mounted) return;
      await _getHistory();
    };

    handleCurrencyChange();
  }, [selectedCurrency, mounted]);

  const handleFilterChange = async (newFilter: any) => {
    setFilter(newFilter);
    setCurrentPage(1);
    if (mounted) {
      await _getHistory(newFilter);
    }
  };

  if (!mounted) {
    return (
      <Layout pageTitle="Pay Outs" icon="disbursement">
        <WebPageTitle title="Payouts | Ramp Merchant Portal" />
        <TableSkeleton />
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Pay Outs" icon="disbursement">
      <WebPageTitle title="Payouts | Ramp Merchant Portal" />
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
            className="!h-10"
            onClick={() => toggleModal('isInitiateTransferModalOpen')}
          />

          <CurrencySwitcher contentClassName="!h-10" className="!h-10" />

          <ActionButton
            ariaLabel='Filter by date button'
            text='Filter By Date'
            onClick={toggleFilter}
            className="!h-12"
          />

          <div className='relative flex justify-end mt-4 md:mt-0'>
            <Dropdown onOpen={showFilter} onClose={toggleFilter}>
              <Filter filterCallback={handleFilterChange} />
            </Dropdown>
          </div>

          <ActionButton
            ariaLabel='Export button'
            text='Export'
            onClick={handleExport}
            className="!h-10"
          />
        </div>
      </div>

      <div>
        {payoutHistoryLoading ? (
          <Fragment>
            <TableSkeleton />
          </Fragment>
        ) : payouts?.length !== 0 ? (
          <Fragment>
            <DynamicTable
              columns={columns}
              data={payouts}
              copyId
              copyField='Transaction Reference'
              primaryBtnContent={
                <Button
                  text={
                    <>
                      <span>Download receipt</span>
                      <Image
                        src='/images/download.svg'
                        alt='download receipt'
                        width={16}
                        height={16}
                        className='ml-2'
                      />
                    </>
                  }
                  ariaLabel="Download receipt button"
                  className="!w-[191px] !h-[48px] p-0"
                  onClick={handleDownload}
                  primary
                />
              }
              secondaryBtnContent={
                <div className="relative block border border-[#EFF7FE] rounded-lg">
                  <button
                    onClick={() => toggleModal('isMoreActionsOpen')}
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
                      <button
                        onClick={() => handleAction('requery')}
                        className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Image
                          src='/images/refresh-alt.svg'
                          alt='requery transaction'
                          width={16}
                          height={16}
                          className='ml-2'
                        />
                        <span className="text-[#090727]">Requery transaction</span>
                      </button>

                      <button
                        onClick={() => toggleModal('isRefundRequestModalOpen')}
                        className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
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
                        className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
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
              }
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages || 1}
              lastPage={lastPage || 1}
              onPageChange={handlePageChange}
            />
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
              onClick={() => toggleModal('isInitiateTransferModalOpen')}
            />
          </EmptyState>
        )}

        <InitiateTransfer
          isModalOpen={state.isInitiateTransferModalOpen}
          closeModal={() => toggleModal('isInitiateTransferModalOpen')}
          fetchPayoutHistory={handleRefreshPayoutHistory}
        />

        <RefundRequest
          isModalOpen={state.isRefundRequestModalOpen}
          closeModal={() => toggleModal('isRefundRequestModalOpen')}
          fetchPayoutHistory={handleRefreshPayoutHistory}
        />

        <RaiseDispute
          isModalOpen={state.isRaiseDisputeModalOpen}
          closeModal={() => toggleModal('isRaiseDisputeModalOpen')}
          fetchPayoutHistory={handleRefreshPayoutHistory}
        />
      </div>
    </Layout>
  );
};

export default PayoutHistory;