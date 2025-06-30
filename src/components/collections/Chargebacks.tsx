import Dropdown from "@/components/Dropdown";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/icon";
import TableSkeleton from "@/components/TableSkeleton";
import { useEffectFetch } from "@/hooks/useEffectFetch";
import { getPaymentLinks } from "@/services/collections";
import useClickEvent from "@/stores/useClickEvent";
import { formatAmount, notifyError } from "@/util/utils";
import { debounce } from "chart.js/helpers";
import { Fragment, useCallback, useState } from "react";

interface AccountProps {
    transactions: any[];
    dropdownIndex: null | number;
    // isLoading: boolean;
}

const ChargeBacks = () => {
    const { selectedItem, handleClick } = useClickEvent();
    const [searchInput, setSearchInput] = useState("");

    const [state, setState] = useState<AccountProps>({
        transactions: [
            {
                reference: "TRX-100000001",
                sender_name: "Ibrahim Musa",
                sender_email: "ibrahim@example.com",
                amount: '₦750,000',
                charges: '₦3,500',
                date: "Apr 1st, 2025 (09:20:00 AM)",
                type: 'bank transfer',
                status: "Pending",
                id: "1",
                created_at: "Apr 1st, 2025 (09:20:00 AM)",
            },
            {
                reference: "TRX-100000002",
                sender_name: "Fatima Adamu",
                sender_email: "fatima@example.com",
                amount: '₦1,000,000',
                charges: '₦5,000',
                date: "Apr 2nd, 2025 (10:15:00 AM)",
                type: 'card',
                status: "Successful",
                id: "2",
                created_at: "Apr 2nd, 2025 (10:15:00 AM)",
            },
            {
                reference: "TRX-100000003",
                sender_name: "Chidi Nwosu",
                sender_email: "chidi@example.com",
                amount: '₦500,000',
                charges: '₦2,500',
                date: "Apr 3rd, 2025 (11:30:00 AM)",
                type: 'bank transfer',
                status: "Successful",
                id: "3",
                created_at: "Apr 3rd, 2025 (11:30:00 AM)",
            },
            {
                reference: "TRX-100000004",
                sender_name: "Ngozi Ike",
                sender_email: "ngozi@example.com",
                amount: '₦850,000',
                charges: '₦4,250',
                date: "Apr 4th, 2025 (02:45:00 PM)",
                type: 'card',
                status: "Pending",
                id: "4",
                created_at: "Apr 4th, 2025 (02:45:00 PM)",
            },
            {
                reference: "TRX-100000005",
                sender_name: "Umar Lawal",
                sender_email: "umar@example.com",
                amount: '₦1,200,000',
                charges: '₦6,000',
                date: "Apr 5th, 2025 (03:00:00 PM)",
                type: 'bank transfer',
                status: "Successful",
                id: "5",
                created_at: "Apr 5th, 2025 (03:00:00 PM)",
            },
            {
                reference: "TRX-100000006",
                sender_name: "Amaka Okoro",
                sender_email: "amaka@example.com",
                amount: '₦950,000',
                charges: '₦4,500',
                date: "Apr 6th, 2025 (04:00:00 PM)",
                type: 'card',
                status: "Pending",
                id: "6",
                created_at: "Apr 6th, 2025 (04:00:00 PM)",
            },
            {
                reference: "TRX-100000007",
                sender_name: "Emeka Nwankwo",
                sender_email: "emeka@example.com",
                amount: '₦2,000,000',
                charges: '₦10,000',
                date: "Apr 7th, 2025 (05:15:00 PM)",
                type: 'bank transfer',
                status: "Successful",
                id: "7",
                created_at: "Apr 7th, 2025 (05:15:00 PM)",
            },
            {
                reference: "TRX-100000008",
                sender_name: "Aisha Bello",
                sender_email: "aisha@example.com",
                amount: '₦1,500,000',
                charges: '₦7,500',
                date: "Apr 8th, 2025 (06:30:00 PM)",
                type: 'card',
                status: "Successful",
                id: "8",
                created_at: "Apr 8th, 2025 (06:30:00 PM)",
            },
            {
                reference: "TRX-100000009",
                sender_name: "Tunde Balogun",
                sender_email: "tunde@example.com",
                amount: '₦600,000',
                charges: '₦3,000',
                date: "Apr 9th, 2025 (07:45:00 PM)",
                type: 'bank transfer',
                status: "Pending",
                id: "9",
                created_at: "Apr 9th, 2025 (07:45:00 PM)",
            },
            {
                reference: "TRX-100000010",
                sender_name: "Ngozi Chukwu",
                sender_email: "ngochukwu@example.com",
                amount: '₦1,750,000',
                charges: '₦8,750',
                date: "Apr 10th, 2025 (08:00:00 PM)",
                type: 'card',
                status: "Successful",
                id: "10",
                created_at: "Apr 10th, 2025 (08:00:00 PM)",
            },
        ],
        dropdownIndex: null,
    });

    const {
        // data,
        loading: isLoading,
        // error,
    } = useEffectFetch(
        async () => {
            if (!selectedItem?.id) return;
            const response = await getPaymentLinks(true, selectedItem?.id);
            return response;
        },
        [],
        {
            onSuccess: (response) => {
                return;
                setState({ ...state, transactions: response, });
            },
            onError: (error) => {
                notifyError(error.message);
            }
        }
    );

    const debouncedHandleParamsChange = useCallback(
        debounce((value: string) => {
            setSearchInput(value);
        }, 300),
        []
    );

    const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        debouncedHandleParamsChange(event.target.value);
    };

    const handleDropdownToggle = (index: number | null, selectedItem: any) => {
        console.log({ index, selectedItem });
        setState({
            ...state,
            dropdownIndex: state.dropdownIndex === index ? null : index,
        });
        handleClick(selectedItem, true);
    };

    const closeDropdown = () => setState({ ...state, dropdownIndex: null, });

    const columns = [{
        key: 'reference',
        title: 'Transaction Reference',
        render: (value: any, row: any) => row?.reference || 'N/A',
    },
    {
        key: 'amount',
        title: 'Amount',
        render: (value: any, row: any) => formatAmount(row?.amount) || 'N/A',
    },
    {
        key: 'type',
        title: 'Transaction Type',
        render: (value: any, row: any) => row?.type || 'N/A',
    },
    {
        key: 'date',
        title: 'Date',
        render: (value: any, row: any) => row?.date || 'N/A',
    },
    {
        key: 'status',
        title: 'Status',
        render: (value: any, row: any) => row?.status || 'N/A'
    },
    {
        key: 'actions',
        title: '',
        render: (value: any, row: any) => (
            <div>
                <Icon
                    onClick={() => handleDropdownToggle(row.id, value)}
                    name="more-alt"
                    className='cursor-pointer text-primary'
                />

                <div className='flex justify-end relative z-20'>
                    <Dropdown
                        onOpen={state.dropdownIndex === row.id}
                        onClose={closeDropdown}
                        className="!w-[205px]"
                    >
                        <ul className='list-none p-0 space-y-5'>
                            <li
                                className='flex items-center gap-2 text-[#090727] text-sm font-medium cursor-pointer'
                                onClick={() => null}
                            >
                                <Icon name="tick-square" className="text-[#2BD325]" />

                                <span>Accept chargeback</span>
                            </li>
                            <li
                                className='flex items-center gap-2 text-[#090727] text-sm font-medium cursor-pointer'
                                onClick={() => null}
                            >
                                <Icon name="close-square" className="text-[#FD2727]" />
                                <span>Reject chargeback</span>
                            </li>
                        </ul>
                    </Dropdown>
                </div>
            </div>
        ),
    }];

    return (
        <>
            {isLoading ? (
                <TableSkeleton />
            ) : state.transactions.length === 0 ? (
                <EmptyState
                    title="No Transactions found"
                    subTitle="We couldn't find any transactions for this payment link"
                    image="/images/dashboard/collections/payment-links-empty.svg"
                />
            ) : (
                <Fragment>
                    <>
                        <div className="relative w-min  my-7">
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

                        <DynamicTable
                            maxColumns={7}
                            columns={columns}
                            data={state.transactions}
                        />


                        {/* <Pagination
              lastPage={lastPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            /> */}
                    </>
                </Fragment>
            )}
        </>
    );
};

export default ChargeBacks;