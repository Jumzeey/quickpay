import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/icon";
import Pagination from "@/components/pagination";
import TableSkeleton from "@/components/TableSkeleton";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import { getPaymentLinks } from "@/services/collections";
import useClickEvent from "@/stores/useClickEvent";
import debounce from "@/util/debounce";
import { notifyError } from "@/util/utils";
import { Fragment, useCallback, useState } from "react";

interface AccountProps {
  transactions: any[];
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
  render: (value: any, row: any) => row?.amount || 'N/A',
},
{
  key: 'charges',
  title: 'Charges',
  render: (value: any, row: any) => row?.charges || 'N/A',
},
{
  key: 'created_at',
  title: 'Date Created',
  render: (value: any, row: any) => row?.created_at || 'N/A',
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
    transactions: []
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>(null);

  const {
    data,
    loading: isLoading,
    // error,
  } = usePaginatedEffect(
    async () => {
      const response = await getPaymentLinks(true, selectedItem?.id);
      return response;
    },
    { page: currentPage },
    {
      onSuccess: (response) => {
        const { payment_link_transactions = [], pagination } = response || {};
        setState(prevState => ({
          ...prevState,
          transactions: payment_link_transactions
        }));
        setPagination(pagination || null);
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

            {pagination && (
              <Pagination
                lastPage={pagination?.last_page}
                currentPage={currentPage}
                totalPages={pagination?.last_page}
                onPageChange={(page: number) => setCurrentPage(page)}
              />
            )}
          </>
        </Fragment>
      )}
    </>
  );
};

export default PaymentLinkTransactions;
