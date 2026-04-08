import { useState, useMemo, useEffect } from 'react';
import { useWalletTransactions } from '@/services/wallet';
import DynamicTable from '@/components/DynamicTable';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import Pagination from '@/components/pagination';
import {
    replaceCurrencySymbol,
    formatDateTime2,
    capitalizeFirstLetter,
    capitalizeFirstLetterOfEachWord,
    formatDate
} from '@/util/utils';
import { ReferenceSearch } from '@/components/reference-search';
import { FilterExport } from '@/components/filter-export';
import Dropdown from '@/components/Dropdown';
import Filter from '@/components/Filter';
import useFilter from '@/stores/useFilter';
import { apiEndpoints } from '@/util/endpoints';
import dynamic from 'next/dynamic';

const ExportModal = dynamic(() => import('@/components/export-modal'), { ssr: false });
import { useApiResponse } from '@/hooks/useApiResponse';

const actionMap: Record<string, string> = {
    'deposit': 'Credit',
    'withdrawal': 'Debit',
};

interface WalletTransactionsProps {
    selectedWallet?: string | null;
    selectedCurrency?: string | null;
}

const WalletTransactions = ({ selectedWallet, selectedCurrency }: WalletTransactionsProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [filter, setFilter] = useState({
        startDate: null as string | null,
        endDate: null as string | null,
    });
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportParams, setExportParams] = useState<Record<string, any> | null>(null);

    const { showFilter, toggleFilter } = useFilter();
    const { handleError } = useApiResponse();

    // Fetch transactions - only when account_id is provided
    // Note: We fetch all transactions and do pagination/filtering on the frontend
    const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions({
        account_id: selectedWallet || undefined,
        currency: selectedCurrency || undefined,
    }, {
        enabled: !!selectedWallet, // Only fetch when a wallet is selected
    });

    // API returns data.wallet (not data.transactions)
    const allTransactions = useMemo(() => {
        return (transactionsData as any)?.data?.wallet || [];
    }, [transactionsData]);

    // Reset search and filter when wallet changes
    useEffect(() => {
        setSearchInput('');
        setFilter({
            startDate: null,
            endDate: null,
        });
        setCurrentPage(1);
    }, [selectedWallet]);

    // Filter transactions by search input with improved regex matching
    const filteredTransactions = useMemo(() => {
        if (!searchInput || !searchInput.trim() || !allTransactions.length) {
            return allTransactions;
        }

        // Clean and escape the search input for regex
        const searchTerm = searchInput.trim().toLowerCase();
        // Escape special regex characters but allow flexible matching
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create a regex pattern that matches the search term anywhere in the string
        let searchRegex: RegExp;
        try {
            searchRegex = new RegExp(escapedSearch, 'i'); // 'i' flag for case-insensitive
        } catch (error) {
            // Fallback to simple string matching if regex fails
            return allTransactions.filter((transaction: any) => {
                const searchLower = searchTerm.toLowerCase();
                const ref = String(transaction?.transaction_reference || '').toLowerCase();
                const desc = String(transaction?.description || '').toLowerCase();
                const custRef = String(transaction?.customer_reference || '').toLowerCase();
                const amount = String(transaction?.amount || '').toLowerCase();
                const status = String(transaction?.status || '').toLowerCase();
                const type = String(transaction?.transaction_type || '').toLowerCase();

                return ref.includes(searchLower) ||
                    desc.includes(searchLower) ||
                    custRef.includes(searchLower) ||
                    amount.includes(searchLower) ||
                    status.includes(searchLower) ||
                    type.includes(searchLower);
            });
        }

        // Search across multiple fields with regex
        return allTransactions.filter((transaction: any) => {
            // Get all searchable fields as strings, handling null/undefined
            const fields = [
                String(transaction?.transaction_reference || ''),
                String(transaction?.description || ''),
                String(transaction?.customer_reference || ''),
                String(transaction?.amount || ''),
                String(transaction?.status || ''),
                String(transaction?.transaction_type || ''),
            ];

            // Check if any field matches the search regex
            return fields.some(field => searchRegex.test(field));
        });
    }, [allTransactions, searchInput]);

    // Apply date filter
    const dateFilteredTransactions = useMemo(() => {
        if (!filter.startDate || !filter.endDate) return filteredTransactions;
        return filteredTransactions.filter((transaction: any) => {
            if (!transaction.date) return false;
            const transactionDate = new Date(transaction.date);
            // Handle both string and Date object formats
            const startDate = new Date(filter.startDate!);
            const endDate = new Date(filter.endDate!);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [filteredTransactions, filter.startDate, filter.endDate]);

    // Frontend pagination - 20 items per page
    const itemsPerPage = 20;
    const totalPages = Math.ceil(dateFilteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = dateFilteredTransactions.slice(startIndex, endIndex);

    const handleFilterChange = (selectionRange: any) => {
        // Filter component passes selectionRange object with startDate and endDate as Date objects
        if (selectionRange && selectionRange.startDate && selectionRange.endDate) {
            setFilter({
                startDate: selectionRange.startDate instanceof Date
                    ? selectionRange.startDate.toISOString()
                    : selectionRange.startDate,
                endDate: selectionRange.endDate instanceof Date
                    ? selectionRange.endDate.toISOString()
                    : selectionRange.endDate,
            });
        } else {
            // Reset filter
            setFilter({
                startDate: null,
                endDate: null,
            });
        }
        setCurrentPage(1);
    };

    const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // Update search input immediately for local filtering (no debounce needed)
        setSearchInput(value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleExport = () => {
        if (!selectedWallet) {
            handleError(new Error('Please select a wallet to export transactions'), 'No wallet selected');
            return;
        }

        try {
            setIsExportModalOpen(true);
            setExportParams({
                account_id: selectedWallet,
                ...(filter.startDate
                    ? {
                        start_date: formatDate(filter.startDate),
                        end_date: formatDate(filter.endDate),
                    }
                    : {}),
            });
        } catch (error: any) {
            console.error('Failed to prepare export:', error);
            handleError(error, 'Failed to prepare export. Please try again.');
            setIsExportModalOpen(false);
        }
    };

    const columns = [
        {
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
                );
            },
        },
        {
            key: 'transaction_type',
            title: 'Action',
            render: (value: any, row: any) =>
                actionMap[row?.transaction_type] ||
                capitalizeFirstLetterOfEachWord(row?.transaction_type?.replaceAll('_', ' ') || '') ||
                'N/A',
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
        // Hidden columns - shown when row is expanded
        {
            key: 'previous_ledger_balance',
            title: 'Previous Ledger Balance',
            render: (value: any, row: any) => replaceCurrencySymbol(row?.ledger_balance_before_amount) || 'N/A',
        },
        {
            key: 'current_ledger_balance',
            title: 'Current Ledger Balance',
            render: (value: any, row: any) => replaceCurrencySymbol(row?.ledger_balance_after_amount) || 'N/A',
        },
        {
            key: 'previous_locked_balance',
            title: 'Previous Locked Balance',
            render: (value: any, row: any) => replaceCurrencySymbol(row?.locked_balance_before) || 'N/A',
        },
        {
            key: 'current_locked_balance',
            title: 'Current Locked Balance',
            render: (value: any, row: any) => replaceCurrencySymbol(row?.locked_balance_after) || 'N/A',
        },
        {
            key: 'description',
            title: 'Description',
            render: (value: any, row: any) => row?.description || 'N/A',
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: any, row: any) => capitalizeFirstLetter(row?.status) || 'N/A',
        },
    ];

    // Show message when no wallet is selected
    if (!selectedWallet) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-[#7F7F7F] text-sm font-medium mb-2">
                    No wallet selected
                </p>
                <p className="text-[#7F7F7F] text-xs">
                    Click on a wallet card above to view its transactions
                </p>
            </div>
        );
    }

    return (
        <div>
            {allTransactions.length > 0 && (
                <>
                    <div className="flex flex-col my-7 md:flex-row justify-between">
                        <ReferenceSearch
                            value={searchInput}
                            onClear={handleClearSearch}
                            handleParamsChange={handleParamsChange}
                        />
                        <FilterExport
                            handleExport={handleExport}
                            toggleFilter={toggleFilter}
                        />
                    </div>

                    <div className="relative flex justify-end mt-4 md:mt-0">
                        <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                            <Filter filterCallback={handleFilterChange} />
                        </Dropdown>
                    </div>
                </>
            )}

            {transactionsLoading ? (
                <TableSkeleton singleButton />
            ) : paginatedTransactions.length > 0 ? (
                <>
                    <DynamicTable
                        maxColumns={6}
                        columns={columns}
                        data={paginatedTransactions}
                    />
                    {totalPages > 1 && (
                        <Pagination
                            lastPage={totalPages}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            ) : (
                <EmptyState
                    title="No Transactions Found"
                    subTitle="We couldn't find any transactions for the selected wallet"
                    image="/images/dashboard/disbursement/disbursement-empty-state.svg"
                />
            )}

            {isExportModalOpen && exportParams && (
                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => {
                        setIsExportModalOpen(false);
                        setExportParams(null);
                    }}
                    title="Export Wallet Transactions"
                    exportEndpoint={apiEndpoints.transaction.EXPORT_WALLET_HISTORY_TRANSACTIONS}
                    statusEndpoint={apiEndpoints.transaction.GET_WALLET_EXPORT_STATUS}
                    params={exportParams}
                    exportType="wallet-history"
                />
            )}
        </div>
    );
};

export default WalletTransactions;

