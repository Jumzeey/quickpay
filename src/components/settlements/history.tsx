import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import { FilterExport } from "@/components/filter-export";
import Icon from "@/components/icon";
import Pagination from "@/components/pagination";
import { ReferenceSearch } from "@/components/reference-search";
import TableSkeleton from "@/components/TableSkeleton";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency from "@/stores/useCurrency";
import useFilter from "@/stores/useFilter";
import useSettlement from "@/stores/useSettlement";
import debounce from "@/util/debounce";
import { capitalizeFirstLetter, currencySymbols, downloadFile, notifyError } from "@/util/utils";
import { format, parseISO } from 'date-fns';
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

interface StateProps {
    showSettlements: boolean;
    showFilterHistory: boolean;
    isLoading: boolean;
}

const History = () => {
    const { selectedCurrency } = useCurrency();
    const [searchInput, setSearchInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const { showFilter, toggleFilter } = useFilter();
    const [filter, setFilter] = useState({
        startDate: null,
        endDate: null,
    });

    const prevCurrencyRef = useRef(selectedCurrency);
    const effectivePage = selectedCurrency !== prevCurrencyRef.current ? 1 : currentPage;

    useEffect(() => {
        prevCurrencyRef.current = selectedCurrency;
    }, [selectedCurrency]);

    const {
        settlements,
        pagination,
        isLoading,
        fetchSettlements
    } = useSettlement()

    const columns = [{
        title: "Batch No.",
        key: "batch",
    }, {
        title: "Settlement Date",
        key: "settlement_window_to",
        render: (value: any, row: any) => {
            const date = parseISO(value);
            const day = format(date, 'd');
            const suffix = day === '1' || day === '21' || day === '31' ? 'st' :
                day === '2' || day === '22' ? 'nd' :
                    day === '3' || day === '23' ? 'rd' : 'th';
            return format(date, `MMM d'${suffix}', yyyy`);
        },

    }, {
        title: "Settlement Amount",
        key: "amount",
        render: (value: any, row: any) => (
            <span className="text-[#090727] font-medium">
                <span className="text-[#7F7F7F] mr-0.5">
                    {currencySymbols[row.currency || selectedCurrency]}
                </span>
                {Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </span>
        ),
    }, {
        title: "Status",
        key: "status",
        render: (value: string) => capitalizeFirstLetter(value),
    }, {
        title: "Actions",
        key: "actions",
        render: (value: any, row: any) => (
            <Link href={`/settlements/?id=${row.id}`}>
                <button className="flex items-center gap-2 text-primary">
                    <Icon name="eye" />
                    View settlement details
                </button>
            </Link>
        ),
    }];

    const handleFilterChange = async (newFilter: any) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const debouncedHandleParamsChange = useCallback(
        debounce((value: string) => {
            setSearchInput(value);
            setCurrentPage(1);
        }, 300),
        []
    );

    const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        debouncedHandleParamsChange(event.target.value);
    };

    const handleExport = async () => {
        try {
            const response: any = await fetchSettlements({
                merchant_id: user.id,
                // currency: selectedCurrency,
                export: true
            });
            if (response?.export_link) {
                downloadFile(response.export_link);
            }
        } catch (error: any) {
            notifyError(error.message);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const { user } = useAuthentication();

    usePaginatedEffect(
        fetchSettlements,
        {
            merchant_id: user.id,
            page: currentPage,
            search: searchInput,
            ...((filter.startDate) ? {
                start_date: filter.startDate,
                end_date: filter.endDate,
            } : {}),
            currency: selectedCurrency,
        },
        {
            enabled: !!user?.id && Boolean(selectedCurrency),
            onError: (error) => {
                console.error("Failed to fetch settlements:", error);
                notifyError("Failed to fetch settlements");
            }
        }
    );

    return (
        <>
            {settlements?.length > 0 && (
                <>
                    <div className="flex flex-col my-7 md:flex-row justify-between">
                        <ReferenceSearch
                            value={searchInput}
                            onClear={() => setSearchInput("")}
                            placeholder="Search Batch Number..."
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

            {isLoading ? (
                <TableSkeleton />
            ) : settlements?.length > 0 ? (
                <>
                    <DynamicTable
                        maxColumns={6}
                        columns={columns}
                        data={settlements}
                    />

                    <Pagination
                        lastPage={pagination?.last_page}
                        currentPage={currentPage}
                        totalPages={pagination?.total}
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

export default History;
