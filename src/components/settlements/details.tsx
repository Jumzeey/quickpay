import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
// import ExportPendingJobs from "@/components/export-pending-job";
import dynamic from "next/dynamic";

const ExportModal = dynamic(() => import("@/components/export-modal"), { ssr: false });
import { FilterExport } from "@/components/filter-export";
import Icon from "@/components/icon";
import Pagination from "@/components/pagination";
import { ReferenceSearch } from "@/components/reference-search";
import TableSkeleton from "@/components/TableSkeleton";
import { useRouteEffect } from "@/hooks/useEffectFetch";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency from "@/stores/useCurrency";
import useSettlement from "@/stores/useSettlement";
import debounce from "@/util/debounce";
import { apiEndpoints } from "@/util/endpoints";
import { capitalizeFirstLetter, currencySymbols, formatDateTime2, getStatusColor, notifyError } from "@/util/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

const Details = () => {
    const { selectedCurrency } = useCurrency();
    const {
        selectedSettlement,
        transactions,
        isTransactionLoading,
        isLoadingDetails,
        fetchSettlementDetails,
        fetchSettlementWindowTransactions,
        pagination,
        // isLoading,
    } = useSettlement()

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({
        startDate: null,
        endDate: null,
    });
    const router = useRouter();
    const { id } = router.query;

    const columns = [{
        title: "Transaction Reference",
        key: "reference",
        render: (value: string, row: any) => row?.reference || row?.id || "N/A",
    }, {
        title: "Sender Name",
        key: "name",
        render: (value: string, row: any) => {
            try {
                const merchantMeta = JSON.parse(row.merchant_meta || '{}');
                return merchantMeta.business_name || 'N/A';
            } catch (error) {
                return 'N/A';
            }
        },
    }, {
        title: "Sender Email",
        key: "merchant_email",
    }, {
        title: "Amount",
        key: "amount",
        render: (value: string, row: any) => {
            if (!value) return 'N/A';
            return `${row.currency || selectedCurrency ? currencySymbols[row.currency || selectedCurrency] : ''}${parseFloat(value.replace(/[^\d.-]/g, '')).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`
        },
    }, {
        title: "Charges",
        key: "charges",
        render: (value: string, row: any) => {
            if (!value) return 'N/A';
            return `${row.currency || selectedCurrency ? currencySymbols[row.currency || selectedCurrency] : ''}${parseFloat(value.replace(/[^\d.-]/g, '')).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`
        },
    }, {
        title: "Date Created",
        key: "created_at",
        render: (value: any) => {
            if (!value) return 'N/A';
            const [date, time] = formatDateTime2(value);

            return (
                <p className="text-[#090727] text-sm font-medium">
                    {date}
                    <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
                </p>
            )
        },
    }, {
        title: "",
        key: "settlement_status",
        render: (value: string) => capitalizeFirstLetter(value),
    }, {
        title: "Settlement Date",
        key: "settlement_date",
        render: (value: any) => {
            if (!value) return 'N/A';
            const [date, _] = formatDateTime2(value);

            return (
                <p className="text-[#090727] text-sm font-medium">
                    {date}
                </p>
            )
        },
    }];

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

    const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        debouncedHandleParamsChange(event.target.value);
    };

    const handleExport = async () => {
        // try {
        //     const response = fetchSettlementWindowTransactions({
        //         id: id as string,
        //         ...(currentPage ? { page: currentPage } : {}),
        //         ...(searchInput ? { search: searchInput } : {}),
        //         export: true,
        //     })

        //     console.log({ response });

        //     // if (response?.export_link) {
        //     //     downloadFile(response.export_link);
        //     // }
        // } catch (error: any) {
        //     notifyError(error.message);
        // }

        setIsExportModalOpen(true);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const totalPages = pagination?.last_page;
    const lastPage = pagination?.last_page;

    const { user } = useAuthentication();

    useRouteEffect(
        () => fetchSettlementDetails({
            id: Number(id),
            merchant_id: user?.id
        }),
        id,
        [user?.id],
        {
            enabled: !!id && !!user?.id,
            onError: (error) => {
                console.error("Failed to fetch settlement details:", error);
                notifyError("Failed to fetch settlement details");
            }
        }
    );

    useRouteEffect(
        () => fetchSettlementWindowTransactions({
            id: id as string,
            ...(currentPage ? { page: currentPage } : {}),
            ...(searchInput ? { search: searchInput } : {}),
        }),
        id,
        [user?.id, id, searchInput, currentPage],
        {
            enabled: !!id,
            onError: (error) => {
                console.error("Failed to fetch settlement details:", error);
                notifyError("Failed to fetch settlement details");
            }
        }
    );

    const parseDailyBreakdown = (metadata: string) => {
        try {
            const parsed = JSON.parse(metadata);
            const batchedAction = parsed.actions.find(
                (action: any) => action.action === "batched"
            );
            return batchedAction?.details?.daily_breakdown || {};
        } catch (error) {
            console.error("Failed to parse metadata:", error);
            return {};
        }
    };

    return (
        <div className="mt-6 space-y-10">
            <Link href="/settlements">
                <button className="text-primary text-[13px] font-semibold flex items-center gap-2">
                    <Icon name="arrowLeft2" className="inline-block" />

                    Back to Settlements
                </button>
            </Link>

            {isLoadingDetails ? (
                <div className="flex items-center justify-center h-screen">
                    <p className="text-gray-500">Loading settlement details...</p>
                </div>
            ) : (
                <>
                    <section className="grid grid-cols-1 md:grid-cols-3 space-y-6 md:space-y-0">
                        <div>
                            <p className="text-[#7F7F7F] text-xs font-medium mb-1">Settlement Window:</p>
                            <p className="font-semibold text-[#7F7F7F] text-sm md:text-base">
                                {selectedSettlement?.settlement_window_from
                                    ? format(parseISO(selectedSettlement.settlement_window_from), 'EEEE, MM/dd/yyyy')
                                    : "N/A"}
                                <span className="text-[#090727] mx-1.5">to</span>
                                {selectedSettlement?.settlement_window_to
                                    ? format(parseISO(selectedSettlement.settlement_window_to), 'EEEE, MM/dd/yyyy')
                                    : "N/A"
                                }
                            </p>
                        </div>

                        <div>
                            <p className="text-[#7F7F7F] text-xs font-medium mb-1">Settlement Amount:</p>
                            <p className="font-bold text-[#090727] text-sm md:text-base">
                                {selectedSettlement?.currency ? currencySymbols[selectedSettlement.currency] : ''}
                                {Number(selectedSettlement?.amount).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                        </div>

                        <div>
                            <p className="text-[#7F7F7F] text-xs font-medium mb-1">Status:</p>
                            <p className="font-bold text-sm md:text-base" style={{ color: getStatusColor(selectedSettlement?.status || '') }}>
                                {selectedSettlement?.status ? capitalizeFirstLetter(selectedSettlement?.status) : 'N/A'}

                                {/* <button className="text-primary font-medium text-xs md:text-[13px] ml-1.5 underline">
                                    Download Receipt
                                </button> */}
                            </p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-4">
                        {selectedSettlement?.metadata &&
                            Object.entries(parseDailyBreakdown(selectedSettlement.metadata))
                                .map(([date, data]: [string, any]) => (
                                    <div key={date} className="border border-[#C4C4C43D] rounded p-4 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <span className="text-black text-xs md:text-sm font-medium">
                                                {format(parseISO(date), 'EEEE, MM/dd/yyyy')}
                                            </span>

                                            <Link href={`/settlements/?id=${selectedSettlement.id}&view=transactions&date=${date}`}>
                                                <button className="flex items-center gap-2 text-xs md:text-[13px] text-primary font-medium">
                                                    <Icon name="eye-2" />
                                                    View Transactions
                                                </button>
                                            </Link>
                                        </div>

                                        <div className="space-y-0.5">
                                            <p className="text-[#7F7F7F] text-xs md:text-[13px] font-medium">
                                                Settlement Amount:
                                            </p>
                                            <p className="font-bold text-[#090727] text-base md:text-lg">
                                                {selectedSettlement.currency ? currencySymbols[selectedSettlement.currency] || selectedSettlement.currency : ''}
                                                {data.total_amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        }
                    </section>
                </>
            )}

            <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-4">
                    <h1 className="text-base md:text-lg font-bold text-black">Settlement Window Transactions</h1>

                    {/* <button className="flex items-center gap-2.5 text-[#7F7F7F] bg-[#D9D9D90D] border border-[#C4C4C43D] rounded px-4 py-2 h-[50px] text-[13px] font-medium">
                        <Icon name="download" className="size-5" />

                        Download Settlement File
                    </button> */}
                </div>

                {transactions.length > 0 && (
                    <div className="flex flex-col my-7 md:flex-row justify-between">
                        <ReferenceSearch
                            value={searchInput}
                            onClear={() => setSearchInput("")}
                            handleParamsChange={handleParamsChange} />

                        {/* <ExportPendingJobs /> */}

                        <FilterExport
                            showFilter={false}
                            exportIconPosition="left"
                            exportText="Download Settlement File"
                            exportIconName="download"
                            handleExport={handleExport}
                        />
                    </div>
                )}

                {isTransactionLoading ? (
                    <TableSkeleton />
                ) : transactions?.length > 0 ? (
                    <>
                        <DynamicTable
                            maxColumns={7}
                            columns={columns}
                            data={transactions}
                        />

                        <Pagination
                            lastPage={lastPage}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />

                        <ExportModal
                            isOpen={isExportModalOpen}
                            onClose={() => setIsExportModalOpen(false)}
                            title="Export Settlement Transactions"
                            exportEndpoint={apiEndpoints.settlements.EXPORT_SETTLEMENT_WINDOW_TRANSACTIONS.replace(':id', id as string)}
                            statusEndpoint={apiEndpoints.settlements.GET_SETTLEMENT_EXPORT_STATUS}
                            exportType="settlement-transactions"
                        />
                    </>
                ) : (
                    <EmptyState
                        title="No Settlement Found"
                        subTitle="We couldn't find any Settlement for this account"
                        image="/images/dashboard/disbursement/disbursement-empty-state.svg"
                    />
                )}
            </section>
        </div>
    );
};

export default Details;
