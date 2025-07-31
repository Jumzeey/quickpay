import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/icon";
import TableSkeleton from "@/components/TableSkeleton";
import { useEffectFetch } from "@/hooks/useEffectFetch";
import { getPaymentLinks } from "@/services/collections";
import useClickEvent from "@/stores/useClickEvent";
import { formatAmount, notifyError } from "@/util/utils";
import debounce from "@/util/debounce";
import { Fragment, useCallback, useState } from "react";

interface AccountProps {
  transactions: any[];
  // isLoading: boolean;
}

const columns = [{
  key: 'reference',
  title: 'Transaction Reference',
  render: (value: any, row: any) => row?.reference || 'N/A',
},
{
  key: 'sender_name',
  title: 'Sender Name',
  render: (value: any, row: any) => row?.sender_name || 'N/A',
},
{
  key: 'sender_email',
  title: 'Sender Email',
  render: (value: any, row: any) => row?.sender_email || 'N/A',
},
{
  key: 'amount',
  title: 'Amount',
  render: (value: any, row: any) => formatAmount(row?.amount) || 'N/A',
},
{
  key: 'charges',
  title: 'Charges',
  render: (value: any, row: any) => formatAmount(row?.charges) || 'N/A',
},
{
  key: 'date',
  title: 'Date Created',
  render: (value: any, row: any) => row?.date || 'N/A',
},
{
  key: 'status',
  title: '',
  render: (value: any, row: any) => row?.status || 'N/A',
}];


const PaymentLinkTransactions = () => {
  const { selectedItem } = useClickEvent();
  const [searchInput, setSearchInput] = useState("");

  const [state, setState] = useState<AccountProps>({
    transactions: [{
      reference: "TRX-987654321",
      sender_name: "Zainab Al-Farsi",
      sender_email: "test@gmail.com",
      amount: '₦2,500,000',
      charges: '₦2,500',
      date: "Feb 8th, 2025 (11:10:44 AM)",
      status: "Successful",
      id: "1",
      created_at: "Feb 8th, 2025 (11:10:44 AM)",
    }]
  });

  const {
    // data,
    loading: isLoading,
    // error,
  } = useEffectFetch(
    async () => {
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

  // const fetchPaymentLinkTransactions = async () => {
  //   if (selectedItem?.id) {
  //     return;
  //     const transactions = await getPaymentLinks(true, selectedItem?.id);
  //     setState({ ...state, transactions,});
  //   }
  // };

  // useEffect(() => {
  //   fetchPaymentLinkTransactions();
  // }, [selectedItem?.id]);

  // const formattedData = state.transactions.map((item: any) => ({
  //   reference: item.reference,
  //   sender: item.sender_name,
  //   sender_email: item.sender_email,
  //   amount: item.amount,
  //   charges: item.charges,
  //   date: item.created_at,
  //   status: item.status,
  // }));

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

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

export default PaymentLinkTransactions;
