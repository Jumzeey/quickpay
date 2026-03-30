import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import { FilterExport } from "@/components/filter-export";
import Icon from "@/components/icon";
import Layout from "@/components/layout";
import PageGuard from "@/components/PageGuard";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/pagination";
import dynamic from "next/dynamic";

const ExportModal = dynamic(() => import("@/components/export-modal"), { ssr: false });
const InitiateTransfer = dynamic(() => import("@/components/payouts/InitiateTransfer"), { ssr: false });
const BulkPayout = dynamic(() => import("@/components/payouts/BulkPayout"), { ssr: false });
import PayoutDropdown from "@/components/payouts/PayoutDropdown";
import RaiseDispute from "@/components/payouts/RaiseDispute";
import RequestRefund from "@/components/payouts/RequestRefund";
import ReceiptModal from "@/components/payouts/ReceiptModal";
import { ReferenceSearch } from "@/components/reference-search";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { useFilePreview } from "@/hooks/useFilePreview";
import { usePaginatedStoreQuery } from "@/hooks/useOptimizedFetch";
import { useApiResponse } from "@/hooks/useApiResponse";
import { getBanks } from "@/services/bank";
import {
  BulkPayoutHistoryItem,
  BulkPayoutTransaction,
  getBulkPayoutHistory,
  getBulkPayoutTransactions,
  Payout
} from "@/services/payout";
import useCurrency from "@/stores/useCurrency";
import useFilter from "@/stores/useFilter";
import usePayout from "@/stores/usePayout";
import debounce from "@/util/debounce";
import { apiEndpoints } from "@/util/endpoints";
import { useModuleAccess, useModuleOptionsAll } from "@/hooks/useModuleAccess";
import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord, copyToClipboard, currencySymbols, formatDate, formatDateTime2, getStatusColor } from "@/util/utils";
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

type PayoutTab = "single" | "bulk";

const PayoutsContent = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const { selectedCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<PayoutTab>("single");
  const menuRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCurrentPage, setBulkCurrentPage] = useState(1);
  const [currentLog, setCurrentLog] = useState<Payout | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [bulkPayouts, setBulkPayouts] = useState<BulkPayoutHistoryItem[]>([]);
  const [bulkPayoutLoading, setBulkPayoutLoading] = useState(false);
  const [bulkPagination, setBulkPagination] = useState({
    current_page: 1,
    last_page: 1,
  });
  const [selectedBulkPayout, setSelectedBulkPayout] = useState<BulkPayoutHistoryItem | null>(null);
  const [bulkTransactions, setBulkTransactions] = useState<BulkPayoutTransaction[]>([]);
  const [bulkTransactionsLoading, setBulkTransactionsLoading] = useState(false);
  const [bulkTransactionsPage, setBulkTransactionsPage] = useState(1);
  const [bulkTransactionsPagination, setBulkTransactionsPagination] = useState({
    current_page: 1,
    last_page: 1,
  });
  const [state, setState] = useState<PayoutsProps>({
    isLoading: true,
    showFilterStatus: false,
    isInitiateTransferModalOpen: false,
    isBulkPayoutModalOpen: false,
    isRequestRefundModalOpen: false,
    isRaiseDisputeModalOpen: false,
    isMoreActionsOpen: false,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportParams, setExportParams] = useState<Record<string, any> | null>(null);

  const payoutCurrency = useModuleOptionsAll("payout");
  const hasBulkPayout = useModuleAccess("payout", "bulk-payout");

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
  const {
    previewingFilePath,
    openFilePreview: handlePreviewBulkFile,
    previewModal,
  } = useFilePreview({
    onError: (error, fallbackMessage) => handleError(error, fallbackMessage),
  });

  const prevCurrencyRef = useRef(selectedCurrency);
  const effectivePage = selectedCurrency !== prevCurrencyRef.current ? 1 : currentPage;
  const isNgnCurrency = (selectedCurrency || "").toUpperCase() === "NGN";
  const isBulkTab = isNgnCurrency && activeTab === "bulk";
  const isBulkTransactionsView = isBulkTab && Boolean(selectedBulkPayout);

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
    render: (_value: any, row: any) => {
      const raw = row?.status ? String(row.status) : "";
      const label = raw ? capitalizeFirstLetterOfEachWord(raw.replace(/_/g, " ")) : "N/A";
      const color = raw ? getStatusColor(raw) : "#7F7F7F";
      return (
        <span className="font-semibold" style={{ color: color === "inherit" ? "#090727" : color }}>
          {label}
        </span>
      );
    },
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

  const formatBulkPayoutMoney = (row: BulkPayoutHistoryItem, raw: string | null | undefined) => {
    if (raw == null || String(raw).trim() === "") return "N/A";
    const numericAmount = Number(String(raw).replace(/,/g, ""));
    if (Number.isNaN(numericAmount)) return "N/A";
    const code = (row?.currency || "NGN").toUpperCase();
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      return `${code} ${numericAmount.toFixed(2)}`;
    }
  };

  const formatBulkTransactionMoney = (currency: string | undefined, raw: string | null | undefined) => {
    if (raw == null || String(raw).trim() === "") return "N/A";
    const numericAmount = Number(String(raw).replace(/,/g, ""));
    if (Number.isNaN(numericAmount)) return "N/A";
    const code = (currency || "NGN").toUpperCase();
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } catch {
      const symbol = currencySymbols[code] || code;
      return `${symbol}${numericAmount.toFixed(2)}`;
    }
  };

  const bulkColumns = [{
    key: "id",
    title: "ID",
  }, {
    key: "file_path",
    title: "File",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      const parts = String(row?.file_path || "").split("/");
      const fileName = parts[parts.length - 1] || "N/A";
      return (
        <div className="flex items-center gap-2">
          <span>{fileName}</span>
          {row?.file_path && (
            <button
              onClick={() => handlePreviewBulkFile(row.file_path)}
              aria-label="Preview payout file"
              title="Preview file"
              disabled={previewingFilePath === row.file_path}
              className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image
                src="/images/eye-on-dark.svg"
                alt="preview file"
                width={16}
                height={16}
              />
            </button>
          )}
        </div>
      );
    },
  }, {
    key: "status",
    title: "Process status",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      const raw = row?.status ? String(row.status) : "";
      const label = raw ? capitalizeFirstLetterOfEachWord(raw.replace(/_/g, " ")) : "N/A";
      const color = raw ? getStatusColor(raw) : "#7F7F7F";
      return (
        <span className="font-semibold" style={{ color: color === "inherit" ? "#090727" : color }}>
          {label}
        </span>
      );
    },
  }, {
    key: "total_transaction",
    title: "Total Transactions",
    render: (_value: any, row: BulkPayoutHistoryItem) => row?.total_transaction ?? "N/A",
  }, {
    key: "total_amount",
    title: "Total Amount",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      const rawAmount = row?.total_amount;
      const numericAmount = Number(String(rawAmount ?? "0").replace(/,/g, ""));

      if (Number.isNaN(numericAmount)) return "₦0.00";

      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    },
  }, {
    key: "options",
    title: "Actions",
    render: (_value: any, row: BulkPayoutHistoryItem) => (
      <Button
        text="View Transactions"
        ariaLabel="View bulk payout transactions"
        className="!h-10 !w-[170px] p-0"
        onClick={() => {
          setSelectedBulkPayout(row);
          setBulkTransactionsPage(1);
        }}
        primary
      />
    ),
  }, {
    key: "success_count",
    title: "Success Count",
  }, {
    key: "failure_count",
    title: "Failure Count",
  }, {
    key: "total_charge",
    title: "Total charge",
    render: (_value: any, row: BulkPayoutHistoryItem) => formatBulkPayoutMoney(row, row?.total_charge),
  }, {
    key: "total_lien_amount",
    title: "Total lien amount",
    render: (_value: any, row: BulkPayoutHistoryItem) => formatBulkPayoutMoney(row, row?.total_lien_amount),
  }, {
    key: "lien_status",
    title: "Lien status",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      const raw = row?.lien_status ? String(row.lien_status) : "";
      if (!raw) return "N/A";
      const label = capitalizeFirstLetterOfEachWord(raw.replace(/_/g, " "));
      const color = getStatusColor(raw);
      return (
        <span className="font-semibold" style={{ color: color === "inherit" ? "#090727" : color }}>
          {label}
        </span>
      );
    },
  }, {
    key: "liens_placed_at",
    title: "Liens placed at",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      if (!row?.liens_placed_at) return "N/A";
      const [date, time] = formatDateTime2(row.liens_placed_at);
      return (
        <p className="text-[#090727] text-sm font-medium">
          {date}
          <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
        </p>
      );
    },
  }, {
    key: "verification_completed_at",
    title: "Verification completed at",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      if (!row?.verification_completed_at) return "N/A";
      const [date, time] = formatDateTime2(row.verification_completed_at);
      return (
        <p className="text-[#090727] text-sm font-medium">
          {date}
          <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
        </p>
      );
    },
  }, {
    key: "reason",
    title: "Reason",
    render: (_value: any, row: BulkPayoutHistoryItem) => row?.reason || "N/A",
  }, {
    key: "created_at",
    title: "Time Stamp",
    render: (_value: any, row: BulkPayoutHistoryItem) => {
      if (!row?.created_at) return "N/A";
      const [date, time] = formatDateTime2(row.created_at);

      return (
        <p className="text-[#090727] text-sm font-medium">
          {date}
          <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
        </p>
      );
    },
  }];

  const fetchBulkHistory = useCallback(async () => {
    if (!mounted || !isNgnCurrency || !selectedCurrency) return;

    setBulkPayoutLoading(true);
    try {
      const response = await getBulkPayoutHistory({
        page: bulkCurrentPage,
        currency: selectedCurrency,
      });
      setBulkPayouts(response.bulk_payouts || []);
      setBulkPagination({
        current_page: response.pagination?.current_page || 1,
        last_page: response.pagination?.last_page || 1,
      });
    } catch (error) {
      handleError(error as any);
      setBulkPayouts([]);
      setBulkPagination({
        current_page: 1,
        last_page: 1,
      });
    } finally {
      setBulkPayoutLoading(false);
    }
  }, [mounted, isNgnCurrency, selectedCurrency, bulkCurrentPage, handleError]);

  const fetchBulkTransactions = useCallback(async () => {
    if (!selectedBulkPayout || !selectedCurrency) return;

    setBulkTransactionsLoading(true);
    try {
      const response = await getBulkPayoutTransactions(selectedBulkPayout.id, {
        page: bulkTransactionsPage,
        currency: selectedCurrency,
      });
      setBulkTransactions(response.transactions || []);
      setBulkTransactionsPagination({
        current_page: response.pagination?.current_page || 1,
        last_page: response.pagination?.last_page || 1,
      });
    } catch (error) {
      handleError(error as any, "Failed to fetch bulk payout transactions");
      setBulkTransactions([]);
      setBulkTransactionsPagination({
        current_page: 1,
        last_page: 1,
      });
    } finally {
      setBulkTransactionsLoading(false);
    }
  }, [selectedBulkPayout, bulkTransactionsPage, selectedCurrency, handleError]);

  /** First `maxColumns` entries show in the main row; the rest appear in the expandable “more” panel. */
  const bulkTransactionColumns = [{
    key: "amount",
    title: "Amount",
    render: (_value: any, row: BulkPayoutTransaction) => {
      const rawAmount = row?.amount;
      const numericAmount = Number(String(rawAmount ?? "0").replace(/,/g, ""));

      if (Number.isNaN(numericAmount)) return "₦0.00";

      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    },
  }, {
    key: "account_name",
    title: "Account Name",
    render: (_value: any, row: BulkPayoutTransaction) => capitalizeFirstLetter(row?.account_name) || "N/A",
  }, {
    key: "account_number",
    title: "Account Number",
  }, {
    key: "bank_name",
    title: "Bank",
    render: (_value: any, row: BulkPayoutTransaction) => capitalizeFirstLetter(row?.bank_name) || "N/A",
  }, {
    key: "status",
    title: "Status",
    render: (_value: any, row: BulkPayoutTransaction) => {
      const rawStatus = row?.transaction?.status ?? row?.status ?? "";
      const raw = rawStatus ? String(rawStatus) : "";
      const label = raw ? capitalizeFirstLetterOfEachWord(raw.replace(/_/g, " ")) : "N/A";
      const color = raw ? getStatusColor(raw) : "#7F7F7F";
      return (
        <span className="font-semibold" style={{ color: color === "inherit" ? "#090727" : color }}>
          {label}
        </span>
      );
    },
  }, {
    key: "reference",
    title: "Transaction reference",
    render: (_value: any, row: BulkPayoutTransaction) => {
      const txRef = row?.transaction?.reference || "";
      return (
        <p className="text-[#090727] text-sm font-medium flex items-center justify-between gap-3 min-w-0">
          <span className="truncate">{txRef || "N/A"}</span>
          {txRef ? (
            <button
              type="button"
              onClick={() => copyToClipboard(txRef)}
              aria-label="Copy transaction reference"
            >
              <Icon name="copy3" className="size-3 shrink-0 text-[#7F7F7F]" />
            </button>
          ) : null}
        </p>
      );
    },
  }, {
    key: "bulk_payout_reference",
    title: "Bulk payout reference",
    render: (_value: any, row: BulkPayoutTransaction) => (
      <p className="text-[#090727] text-sm font-medium flex items-center justify-between gap-3 min-w-0">
        <span className="truncate">{row?.bulk_payout_reference || "N/A"}</span>
        {row?.bulk_payout_reference ? (
          <button type="button" onClick={() => copyToClipboard(row.bulk_payout_reference!)} aria-label="Copy bulk payout reference">
            <Icon name="copy3" className="size-3 shrink-0 text-[#7F7F7F]" />
          </button>
        ) : null}
      </p>
    ),
  }, {
    key: "customer_reference",
    title: "Customer reference",
    render: (_value: any, row: BulkPayoutTransaction) =>
      row?.transaction?.customer_reference || row?.customer_reference || "N/A",
  }, {
    key: "channel",
    title: "Channel",
    render: (_value: any, row: BulkPayoutTransaction) =>
      row?.transaction?.payment_type || row?.transaction?.channel || "N/A",
  }, {
    key: "available_balance_before",
    title: "Available balance before",
    render: (_value: any, row: BulkPayoutTransaction) =>
      formatBulkTransactionMoney(row?.currency, row?.transaction?.available_balance_before),
  }, {
    key: "available_balance_after",
    title: "Available balance after",
    render: (_value: any, row: BulkPayoutTransaction) =>
      formatBulkTransactionMoney(row?.currency, row?.transaction?.available_balance_after),
  }, {
    key: "failure_reason",
    title: "Failure Reason",
    render: (_value: any, row: BulkPayoutTransaction) => row?.failure_reason || "N/A",
  }, {
    key: "created_at",
    title: "Time Stamp",
    render: (_value: any, row: BulkPayoutTransaction) => {
      if (!row?.created_at) return "N/A";
      const [date, time] = formatDateTime2(row.created_at);
      return (
        <p className="text-[#090727] text-sm font-medium">
          {date}
          <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
        </p>
      );
    },
  }];

  const handlePageChange = async (page: number) => {
    if (isBulkTransactionsView) {
      setBulkTransactionsPage(page);
      return;
    }
    if (isBulkTab) {
      setBulkCurrentPage(page);
      return;
    }
    setCurrentPage(page);
  };

  const totalPages = isBulkTransactionsView
    ? bulkTransactionsPagination?.last_page
    : isBulkTab
      ? bulkPagination?.last_page
      : pagination?.last_page;
  const lastPage = isBulkTransactionsView
    ? bulkTransactionsPagination?.last_page
    : isBulkTab
      ? bulkPagination?.last_page
      : pagination?.last_page;

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

  const buildBulkTransactionReceipt = (row: BulkPayoutTransaction) => {
    const currency = String(row?.currency || "NGN").toUpperCase();
    const symbol = currencySymbols[currency] || "";

    const statusRaw = row?.transaction?.status ?? row?.status ?? "";
    const statusLabel = statusRaw
      ? capitalizeFirstLetterOfEachWord(String(statusRaw).replace(/_/g, " "))
      : "N/A";

    const reference = row?.transaction?.reference || row?.reference || "N/A";
    const createdAt = row?.transaction?.created_at || row?.created_at || new Date().toISOString();

    return {
      id: row?.transaction?.id ?? row?.id ?? 0,
      reference,
      customer_reference: row?.transaction?.customer_reference ?? row?.customer_reference ?? undefined,
      currency,
      currency_symbol: symbol,
      amount: `${symbol}${row?.amount ?? "0.00"}`,
      status: statusLabel,
      transaction_type: "Bulk payout",
      created_at: createdAt,
      recipient_account_number: row?.account_number,
      recipient_account_name: row?.account_name,
      recipient_bank: row?.bank_name,
      channel: row?.transaction?.payment_type || row?.transaction?.channel,
      session_id: row?.transaction?.session_id ?? null,
    };
  };

  const handleRequery = async (reference: string) => {
    if (!reference) {
      handleError({ message: "Transaction reference is required for requery" });
      return;
    }

    try {
      const response = await requeryPayout(reference);

      if (response.success && response.data) {
        const transaction = response.data.Transaction;

        // Check if the transaction requery was successful
        if (transaction.success && transaction.data) {
          const transactionData = transaction.data;
          handleSuccess({ message: `Requery successful! Status: ${transactionData.status}` });

          // Close the dropdown after successful requery
          setState(prevState => ({
            ...prevState,
            isMoreActionsOpen: false,
          }));

          await invalidatePayoutHistory();
          await fetchPayoutHistory();
        } else {
          // Transaction requery failed - show the actual error message
          const errorMessage = transaction.message || "Transaction requery failed";
          handleError({
            message: errorMessage,
            responseText: errorMessage
          });

          // Close the dropdown
          setState(prevState => ({
            ...prevState,
            isMoreActionsOpen: false,
          }));
        }
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
      setBulkCurrentPage(1);
      setSelectedBulkPayout(null);
      setBulkTransactions([]);
      setBulkTransactionsPage(1);
      if ((selectedCurrency || "").toUpperCase() !== "NGN") {
        setActiveTab("single");
      }
      await invalidatePayoutHistory();
    };

    handleCurrencyChange();
  }, [selectedCurrency, mounted, invalidatePayoutHistory]);

  useEffect(() => {
    if (!isBulkTab) return;
    fetchBulkHistory();
  }, [isBulkTab, fetchBulkHistory]);

  useEffect(() => {
    if (!selectedBulkPayout) return;
    fetchBulkTransactions();
  }, [selectedBulkPayout, bulkTransactionsPage, fetchBulkTransactions]);

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
          <div className="w-1/2 md:w-60 h-14">
            <PayoutDropdown
              contentClassName="h-full"
              className="h-full"
              onSelectSingle={() => toggleModal('isInitiateTransferModalOpen')}
              onSelectBulk={() => toggleModal('isBulkPayoutModalOpen')}
            />
          </div>
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
        {hasBulkPayout && isNgnCurrency && (
          <div className="mb-6 inline-flex rounded-lg border border-[#E5E7EB] bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${!isBulkTab ? "bg-[#005BB0] text-white" : "text-[#4B5563]"}`}
            >
              Single Payout
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${isBulkTab ? "bg-[#005BB0] text-white" : "text-[#4B5563]"}`}
            >
              Bulk Payout
            </button>
          </div>
        )}

        {!isBulkTab && payouts?.length > 0 && (
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

        {(isBulkTransactionsView ? bulkTransactionsLoading : isBulkTab ? bulkPayoutLoading : payoutHistoryLoading) ? (
          <TableSkeleton />
        ) : (isBulkTransactionsView ? bulkTransactions?.length > 0 : isBulkTab ? bulkPayouts?.length > 0 : payouts?.length > 0) ? (
          <>
            {isBulkTransactionsView && selectedBulkPayout && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBulkPayout(null);
                    setBulkTransactions([]);
                    setBulkTransactionsPage(1);
                  }}
                  className="mb-4 text-sm font-semibold text-[#005BB0] hover:opacity-80"
                >
                  ← Back to Bulk Payouts
                </button>
                <div className="rounded-lg border border-[#C4C4C429] bg-white p-4">
                  <p className="text-xs text-[#7F7F7F]">Bulk Payout Transactions</p>
                  <p className="mt-1 text-sm font-semibold text-[#090727] flex items-center gap-2">
                    <span>
                      Bulk ID: {selectedBulkPayout.id} • File: {String(selectedBulkPayout.file_path || "").split("/").pop() || "N/A"}
                    </span>
                    {selectedBulkPayout.file_path && (
                      <button
                        onClick={() => handlePreviewBulkFile(selectedBulkPayout.file_path)}
                        aria-label="Preview bulk payout file"
                        title="Preview file"
                        disabled={previewingFilePath === selectedBulkPayout.file_path}
                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Image
                          src="/images/eye-on-dark.svg"
                          alt="preview file"
                          width={16}
                          height={16}
                        />
                      </button>
                    )}
                  </p>
                </div>
              </div>
            )}

            {isBulkTab ? (
              <DynamicTable
                columns={isBulkTransactionsView ? bulkTransactionColumns : bulkColumns}
                data={isBulkTransactionsView ? bulkTransactions : bulkPayouts}
                maxColumns={isBulkTransactionsView ? 5 : 6}
                primaryBtnContent={
                  isBulkTransactionsView
                    ? (row: BulkPayoutTransaction) => (
                      <Button
                        text="View receipt"
                        ariaLabel="View receipt button"
                        className="!w-[191px] !h-[48px] p-0"
                        onClick={() => handleViewReceipt(buildBulkTransactionReceipt(row))}
                        primary
                      />
                    )
                    : undefined
                }
              />
            ) : (
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
                            disabled={requeryLoading}
                            className={`font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${requeryLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
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
            )}
            <Pagination
              currentPage={isBulkTransactionsView ? bulkTransactionsPage : isBulkTab ? bulkCurrentPage : currentPage}
              totalPages={totalPages || 1}
              lastPage={lastPage || 1}
              onPageChange={handlePageChange}
            />

            {!isBulkTab && isExportModalOpen && exportParams && (
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
            title={isBulkTransactionsView ? "No Bulk Transactions Found" : isBulkTab ? "No Bulk Payout Found" : "No Payout Found"}
            subTitle={isBulkTransactionsView ? "This bulk payout has no transactions yet." : isBulkTab ? "We couldn't find any bulk payout for this account" : "We couldn't find any Payout for this account"}
            image="/images/dashboard/disbursement/disbursement-empty-state.svg"
          >
            <div className="flex gap-4 justify-center">
              {isBulkTransactionsView ? (
                <Button
                  text="Back to Bulk Payouts"
                  ariaLabel="Back to bulk payouts"
                  onClick={() => {
                    setSelectedBulkPayout(null);
                    setBulkTransactions([]);
                    setBulkTransactionsPage(1);
                  }}
                  className="!w-60 !h-12"
                  primary
                />
              ) : isBulkTab ? (
                hasBulkPayout ? (
                  <Button
                    text="Initiate Bulk Payout"
                    ariaLabel="Initiate bulk payout"
                    onClick={() => toggleModal('isBulkPayoutModalOpen')}
                    className="!w-60 !h-12"
                    primary
                  />
                ) : null
              ) : (
                <PayoutDropdown
                  className="w-60"
                  onSelectSingle={() => toggleModal('isInitiateTransferModalOpen')}
                  onSelectBulk={() => toggleModal('isBulkPayoutModalOpen')}
                />
              )}
            </div>
          </EmptyState>
        )}

        <InitiateTransfer
          isModalOpen={state.isInitiateTransferModalOpen}
          closeModal={() => toggleModal('isInitiateTransferModalOpen')}
          fetchPayoutHistory={handleRefreshPayoutHistory}
        />

        <BulkPayout
          isModalOpen={state.isBulkPayoutModalOpen}
          closeModal={() => toggleModal('isBulkPayoutModalOpen')}
          fetchPayoutHistory={handleRefreshPayoutHistory}
          fetchBulkPayoutHistory={fetchBulkHistory}
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

      {previewModal}
    </Layout>
  );
};

const PayoutHistory = () => {
  const hasAccess = useModuleAccess("payout");
  if (!hasAccess) {
    return (
      <Layout pageTitle="Pay Outs" icon="disbursement">
        <WebPageTitle title="Payouts | Cray Merchant Portal" />
        <PageHeader
          className="!mb-0"
          title="Payouts"
          description="Manage and track all payouts seamlessly, ensuring smooth and transparent transactions."
        />
        <PageGuard moduleSlug="payout">
          <div />
        </PageGuard>
      </Layout>
    );
  }
  return <PayoutsContent />;
};

export default PayoutHistory;