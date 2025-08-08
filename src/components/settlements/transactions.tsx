import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/icon";
import Pagination from "@/components/pagination";
import TableSkeleton from "@/components/TableSkeleton";
import { useRouteEffect } from "@/hooks/useEffectFetch";
import { getSettlementHistory } from "@/services/transaction";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency from "@/stores/useCurrency";
import useSettlement from "@/stores/useSettlement";
import debounce from "@/util/debounce";
import { capitalizeFirstLetter, currencySymbols, downloadFile, formatDateTime2, notifyError } from "@/util/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

const Transactions = () => {
    const { selectedCurrency } = useCurrency();
    const {
        selectedSettlement,
        dailyTransactions,
        isDailyTransactionLoading,
        fetchSettlementDetails,
        fetchDailyBreakdown,
        pagination,
    } = useSettlement();

    const [searchInput, setSearchInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState({
        startDate: null,
        endDate: null,
    });

    const router = useRouter();
    const { id, date } = router.query;

    const columns = [{
        title: "Transaction Reference",
        key: "reference",
        render: (value: string, row: any) => row?.reference || row?.id || 'N/A'
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
        render: (value: string) => {
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

    const handleFilterChange = async (newFilter: any) => {
        setFilter(newFilter);
        setCurrentPage(1);
        // if (mounted) {
        //   await _getHistory(newFilter);
        // }
    };

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
            const response = await getSettlementHistory({ export: true });
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
        () => fetchDailyBreakdown({
            batch: selectedSettlement?.batch || "",
            merchant_id: user?.id,
            settlement_date: date as string
        }),
        [String(selectedSettlement?.batch), String(date)],
        [user?.id],
        {
            enabled: !!selectedSettlement?.batch && !!date && !!user?.id
        }
    );

    return (
        <>
            <Link href={`/settlements?id=${id}`}>
                <button className="text-primary text-[13px] font-semibold flex items-center gap-2">
                    <Icon name="arrowLeft2" className="inline-block" />

                    Back to settlements window
                </button>
            </Link>

            <p className="font-bold text-lg text-black mt-5 mb-6">
                Transactions for -
                <span className="ml-1 text-[#7F7F7F]">
                    {format(parseISO(date as string), 'EEEE, MM/dd/yyyy')}
                </span>
            </p>

            {isDailyTransactionLoading ? (
                <TableSkeleton />
            ) : dailyTransactions?.length > 0 ? (
                <>
                    <DynamicTable
                        maxColumns={7}
                        columns={columns}
                        data={dailyTransactions}
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
                    title="No Settlement Found"
                    subTitle="We couldn't find any Settlement for this account"
                    image="/images/dashboard/disbursement/disbursement-empty-state.svg"
                />
            )}
        </>
    );
};

export default Transactions;
