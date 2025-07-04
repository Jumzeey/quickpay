import Button from "@/components/button";
import FilterHistory from "@/components/collections/FilterHistory";
import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import Icon from "@/components/icon";
import Pagination from "@/components/pagination";
import TableSkeleton from "@/components/TableSkeleton";
import TransactionDetails from "@/components/transactionDetails";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import { getCollectionHistory } from "@/services/collections";
import useClickEvent from "@/stores/useClickEvent";
import useCollectionHistory from "@/stores/useCollectionHistory";
import useFilter from "@/stores/useFilter";
import debounce from "@/util/debounce";
import { downloadFile, notifyError } from "@/util/utils";
import React, { useCallback, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

interface CollectionsProps {
    collectionHistory: any[];
    isLoading: boolean;
    showCollections: boolean;
    showFilterStatus: boolean;
    showFilterHistory: boolean;
    viewTransactionMeta: boolean;
}

const CollectionHistory = () => {
    const { selectedItem, handleClick } = useClickEvent();
    const [searchInput, setSearchInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [filter, setFilter] = useState({
        startDate: null,
        endDate: null,
    });
    const {
        fetchCollectionHistory,
        collections,
        pagination,
        getCollectionHistoryLoading,
    } = useCollectionHistory();

    const { showFilter, toggleFilter } = useFilter();

    const [state, setState] = useState<CollectionsProps>({
        collectionHistory: [],
        isLoading: true,
        showCollections: false,
        showFilterStatus: false,
        showFilterHistory: false,
        viewTransactionMeta: false,
    });

    const closeDropdown = () => {
        setState({
            ...state,
            showFilterStatus: false,
        });
    };

    const columns = [{
        key: 'reference',
        title: 'Transaction Reference',
        render: (value: any, row: any) => row?.reference || 'N/A',
    }, {
        key: 'amount',
        title: 'Amount',
        render: (value: any, row: any) => row?.amount || 'N/A',
    }, {
        key: 'channel',
        title: 'Transaction Type',
        render: (value: any, row: any) => row?.channel || 'N/A',
    }, {
        key: 'created_at',
        title: 'Date',
        render: (value: any, row: any) => row?.created_at || 'N/A',
    }, {
        key: 'status',
        title: 'Status',
        render: (value: any, row: any) => row?.status || 'N/A',
    }, {
        key: 'session_id',
        title: 'Session ID',
        render: (value: any, row: any) => row?.session_id || 'N/A',
    }, {
        key: 'channel',
        title: 'Payment Method',
        render: (value: any, row: any) => row?.channel || 'N/A',
    }, {
        key: 'sender_name',
        title: 'Sender Name',
        render: (value: any, row: any) => row?.sender?.sender_name || 'N/A'
    }, {
        key: 'gateway_message',
        title: 'Gateway Message',
        render: (value: any, row: any) => {
            if (row?.status === 'Successful') {
                return 'Successful';
            }
            if (!row?.gateway_message) {
                return 'N/A';
            }

            return row?.gateway_message?.message || `${row?.gateway_message?.code} - ${row?.gateway_message?.message}` || 'N/A';
        }
    }];

    const toggleModal = (name: keyof Pick<CollectionsProps, 'showCollections' | 'showFilterStatus' | 'showFilterHistory' | 'viewTransactionMeta'>) => {
        setState(prevState => ({
            ...prevState,
            [name]: !prevState[name],
        }));
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
            const response = await getCollectionHistory({ export: true });
            downloadFile(response.export_link);
        } catch (error: any) {
            notifyError(error.message);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const openFilterHistory = () => setState({ ...state, showFilterHistory: true });
    const closeFilterHistory = () => setState({ ...state, showFilterHistory: false });

    const totalPages = pagination?.last_page;
    const lastPage = pagination?.last_page;

    usePaginatedEffect(
        fetchCollectionHistory,
        {
            page: currentPage,
            search: searchInput,
            status: statusFilter,
            startDate: filter.startDate,
            endDate: filter.endDate
        },
        {
            onError: (error) => {
                console.error("Failed to fetch collection history:", error);
            }
        }
    );

    console.log({ collections, currentPage });

    return (
        <>
            {state.showCollections ? (
                <TransactionDetails
                    selectedItem={selectedItem}
                    setState={setState}
                    state={state}
                    selectedModule="collections"
                />
            ) : (
                <div>
                    {getCollectionHistoryLoading ? (
                        <div className="mt-10">
                            <TableSkeleton />
                        </div>
                    ) : collections?.length !== 0 ? (
                        <div className="mt-10">
                            <div className="flex flex-col md:flex-row justify-between pb-5">
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="searchInput"
                                        name="searchInput"
                                        placeholder="Search Reference Number..."
                                        onChange={handleParamsChange}
                                        className="h-[60px] w-full md:w-[376px] outline-none bg-[#D9D9D90D] font-medium border border-[#C4C4C43D] text-[#7F7F7F] text-sm px-3 rounded-md"
                                    />
                                    <Icon name="search" className="absolute top-[35%] right-4 size-5 text-[#7F7F7F]" />
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
                                        className="md:!w-24 !h-10"
                                        onClick={handleExport}
                                        plain
                                    /> */}
                                    {/* TODO: implement this filter modal */}
                                    <button
                                        onClick={openFilterHistory}
                                        className="flex items-center justify-center gap-2 bg-[#D9D9D91A] border border-[#C4C4C452] rounded-md text-sm font-medium text-[#7F7F7F] py-2 w-[112px]"
                                    >
                                        Filter
                                        <Icon name="filter" className="size-4 text-[#7F7F7F]" />
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center justify-center gap-2 bg-[#D9D9D91A] border border-[#C4C4C452] rounded-md text-sm font-medium text-[#7F7F7F] py-2 w-[112px]"
                                    >
                                        Export
                                        <Icon name="export" className="size-4 text-[#7F7F7F]" />
                                    </button>
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
                            <div className="relative flex justify-end mt-4">
                                <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                                    <Filter filterCallback={setFilter} />
                                </Dropdown>
                            </div>

                            <DynamicTable
                                columns={columns}
                                data={collections}
                                copyId
                                primaryBtnContent={(row: any) => (
                                    <Button
                                        text="Repush Notification"
                                        ariaLabel="Download receipt button"
                                        className="px-4 !h-12 !w-[175px] p-0"
                                        onClick={() => null}
                                        primary
                                    />
                                )}
                                secondaryBtnContent={(row: any) => (
                                    <div className="relative block border border-[#EFF7FE] rounded-lg">
                                        <button
                                            onClick={() => toggleModal('viewTransactionMeta')}
                                            className="text-sm text-primary font-medium px-4 h-12 bg-[#EFF7FE] flex items-center justify-center"
                                        >
                                            View Transaction Meta
                                        </button>
                                    </div>
                                )}
                            />
                            <Pagination
                                lastPage={lastPage}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />

                            <FilterHistory
                                isModalOpen={state.showFilterHistory}
                                closeModal={closeFilterHistory}
                                setFilter={setFilter}
                            />
                        </div>
                    ) : (
                        <EmptyState
                            title="No Pay Ins found"
                            subTitle="We couldn't find any pay ins for this account"
                            image="/images/collections.svg"
                        />
                    )}
                </div>

            )}
        </>
    );
};

export default CollectionHistory;
