import CurrencySwitcher from '@/components/CurrencySwitcher';
import Dropdown from '@/components/Dropdown';
import DynamicTable from '@/components/DynamicTable';
import EmptyState from '@/components/EmptyState';
import Filter from '@/components/Filter';
import PageHeader from '@/components/PageHeader';
import TableSkeleton from '@/components/TableSkeleton';
import WebPageTitle from '@/components/WebPageTitle';
import { FilterExport } from '@/components/filter-export';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import { ReferenceSearch } from '@/components/reference-search';
import { usePaginatedStoreQuery } from '@/hooks/useOptimizedFetch';
import useCurrency from '@/stores/useCurrency';
import useFilter from '@/stores/useFilter';
import useWalletLogs from '@/stores/useWalletLogs';
import debounce from '@/util/debounce';
import {
  capitalizeFirstLetter,
  capitalizeFirstLetterOfEachWord,
  downloadFile,
  formatDate,
  formatDateTime2,
  notifyError,
  replaceCurrencySymbol
} from '@/util/utils';
import { useCallback, useEffect, useState } from 'react';

interface HistoryProps {
  history: any[];
  isLoading: boolean;
  showFilterStatus: boolean;
}

const actionMap: Record<string, string> = {
  'deposit': 'Credit',
  'withdrawal': 'Debit',
}

const WalletHistory = () => {
  const { selectedCurrency } = useCurrency();
  const {
    fetchWalletHistory,
    wallet,
    pagination,
    getWalletHistoryLoading,
    exportWalletHistory,
  } = useWalletLogs();
  const [searchInput, setSearchInput] = useState("");

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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = async (newFilter: any) => {
    setFilter(newFilter);
    setCurrentPage(1);
    if (mounted) {
      await _getHistory(newFilter);
    }
  };

  const columns = [{
    key: 'transaction_reference',
    title: 'Transaction Reference',
    render: (value: any, row: any) => row?.transaction_reference || 'N/A',
  },
  {
    key: 'amount',
    title: 'Amount',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.amount) || 'N/A',
  },
  {
    key: 'timestamp',
    title: 'Time Stamp',
    render: (value: any, row: any) => {
      if (!row?.date) return 'N/A';
      const [date, time] = formatDateTime2(row.date);

      return (
        <p className="text-[#090727] text-sm font-medium">
          {date}

          <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
        </p>
      )
    },
  },
  {
    key: 'transaction_type',
    title: 'Action',
    render: (value: any, row: any) => actionMap[row?.transaction_type] || capitalizeFirstLetterOfEachWord(row?.transaction_type?.replaceAll('_', ' ')) || 'N/A',
  },
  {
    key: 'available_balance_before',
    title: 'Previous Balance',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.available_balance_before) || 'N/A',
  },
  {
    key: 'available_balance_after',
    title: 'Current Balance',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.available_balance_after) || 'N/A',
  },
  {
    key: 'previous_ledger_balance',
    title: 'Previous Ledger Balance',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.ledger_balance_before_amount) || 'N/A'
  },
  {
    key: 'current_ledger_balance',
    title: 'Current Ledger Balance',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.ledger_balance_after_amount) || 'N/A'
  },
  {
    key: 'previous_locked_balance',
    title: 'Previous Locked Balance',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.locked_balance_before) || 'N/A'
  },
  {
    key: 'current_locked_balance',
    title: 'Current Locked Balance',
    render: (value: any, row: any) => replaceCurrencySymbol(row?.locked_balance_after) || 'N/A'
  },
  {
    key: 'description',
    title: 'Description',
    render: (value: any, row: any) => row?.description || 'N/A',
  }, {
    key: 'status',
    title: 'Status',
    render: (value: any, row: any) => capitalizeFirstLetter(row?.status) || 'N/A',
  }];

  usePaginatedStoreQuery(
    useWalletLogs,
    'fetchWalletHistory',
    {
      currency: selectedCurrency,
      page: currentPage,
      search: searchInput,
      ...(filter.startDate ? {
        start_date: formatDate(filter.startDate),
        end_date: formatDate(filter.endDate),
      } : {})
    },
    {
      enabled: !!(mounted && selectedCurrency),
      onSuccess: (data) => {
        console.log('✅ Wallet history fetched successfully for', selectedCurrency);
      },
      onError: (error) => {
        console.error('❌ Failed to fetch wallet history:', error);
        // notifyError(error.message);
      },
      cacheTime: 0,
    }
  );

  const _getHistory = async (newFilter?: any) => {
    try {
      // Call the store method directly
      await fetchWalletHistory({
        currency: selectedCurrency,
        page: currentPage,
        ...(newFilter?.startDate ? {
          start_date: formatDate(newFilter.startDate),
          end_date: formatDate(newFilter.endDate),
        } : {})
      });
    } catch (error) {
      console.error('Error fetching wallet history:', error);
    }
  }

  useEffect(() => {
    const handleCurrencyChange = async () => {
      if (!mounted) return;
      await _getHistory();
    };

    handleCurrencyChange();
  }, [selectedCurrency, mounted]);

  const handleExport = async () => {
    try {
      const result = await exportWalletHistory({
        ...(searchInput ? { search: searchInput } : {}),
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

  const debouncedHandleParamsChange = useCallback(
    (value: string) => {
      const debouncedFn = debounce(() => {
        console.log('Debounced search input:', value);
        setSearchInput(value);
        setCurrentPage(1);
      }, 300);
      debouncedFn();
    },
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const startIndex = (currentPage - 1) * pagination.per_page;
  const endIndex = startIndex + pagination.per_page;
  const currentPageHistory = wallet.slice(startIndex, endIndex);

  if (!mounted) {
    return (
      <Layout pageTitle='Balance History' icon='wallet-history'>
        <WebPageTitle title='Balance History | Ramp Merchant Portal' />
        <TableSkeleton />
      </Layout>
    );
  }

  return (
    <Layout pageTitle='Balance History' icon='wallet-history'>
      <WebPageTitle title='Balance History | Ramp Merchant Portal' />

      <div className="flex flex-col md:flex-row justify-between gap-5 md:gap-0 mb-8">
        <div>
          <PageHeader
            className="!mb-0"
            title="Balance History"
            description="Track all your transactions effortlessly with a clear and secure history of your wallet activities."
          />
        </div>

        <CurrencySwitcher className="items-center" />
      </div>

      <div>
        {wallet?.length > 0 && (
          <>
            <div className="flex flex-col my-7 md:flex-row justify-between">
              <ReferenceSearch
                value={searchInput}
                onClear={() => setSearchInput("")}
                handleParamsChange={handleParamsChange}
              />

              <FilterExport
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

        {getWalletHistoryLoading ? (
          <TableSkeleton singleButton />
        ) : wallet?.length > 0 ? (
          <>
            <DynamicTable
              maxColumns={6}
              columns={columns}
              data={currentPageHistory}
            />

            <Pagination
              lastPage={lastPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <EmptyState
            title='No Balance History found'
            subTitle="We couldn't find any balance history to this account"
            image='/images/dashboard/disbursement/disbursement-empty-state.svg'
          ></EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default WalletHistory;
