import ActionButton from "@/components/action-button";
import RequestVirtualAccount from "@/components/collections/RequestVirtualAcount";
import Dropdown from "@/components/Dropdown";
import EmptyState from "@/components/EmptyState";
import Filter from "@/components/Filter";
import { FilterExport } from "@/components/filter-export";
import Pagination from "@/components/pagination";
import { ReferenceSearch } from "@/components/reference-search";
import Table from "@/components/table";
import TableSkeleton from "@/components/TableSkeleton";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import { getVirtualAccounts } from "@/services/collections";
import useClickEvent from "@/stores/useClickEvent";
import useCollectionHistory from "@/stores/useCollectionHistory";
import useFilter from "@/stores/useFilter";
import debounce from "@/util/debounce";
import { capitalizeFirstLetter, downloadFile, formatDate, formatDateTime2, notifyError } from "@/util/utils";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";

interface VirtualAccounts {
  account_name: string;
  account_number: string;
  account_reference: string;
  account_type: string;
  amount: string;
  bank: string;
  bvn: string;
  created_at: string;
  expires_at: string | null;
  id: number;
  is_subaccount: boolean;
  subaccount_id: string;
  validity_type: string;
}
interface AccountProps {
  virtualAccountsHistory: {
    virtual_accounts: VirtualAccounts[];
  };
  isLoading: boolean;
  showDisbursements: boolean;
}

const VirtualAccounts = () => {
  const { handleClick } = useClickEvent();
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const [state, setState] = useState<AccountProps>({
    virtualAccountsHistory: { virtual_accounts: [] },
    isLoading: true,
    showDisbursements: false,
  });

  const { showFilter, toggleFilter } = useFilter();

  const {
    fetchVirtualAccounts,
    virtual_accounts,
    pagination,
    getVirtualAccountsHistoryLoading,
  } = useCollectionHistory();

  const columns = [
    "No.",
    "account name",
    "account number",
    "bank",
    "type",
    "created at",
  ];

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };;

  const handleExport = async () => {
    try {
      const response = await getVirtualAccounts({ export: true });
      // const response = await fetchVirtualAccounts({ export: true });
      console.log(response);
      response?.export_link && downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  usePaginatedEffect(
    fetchVirtualAccounts,
    {
      page: currentPage,
      search: searchInput,
      ...(filter.startDate
        ? {
          start_date: formatDate(filter.startDate),
          end_date: formatDate(filter.endDate)
        }
        : {}),
    },
    {
      onError: (error) => {
        console.error("Failed to fetch virtual accounts history:", error);
      }
    }
  );

  return (
    <>
      {virtual_accounts?.length > 0 && (
        <div className="mt-7">
          <ActionButton
            ariaLabel="Request a virtual account"
            text="Request A Virtual Account"
            iconName="plus"
            onClick={openModal}
          />

          <div className="flex flex-col my-7 md:flex-row justify-between">
            <ReferenceSearch
              value={searchInput}
              onClear={() => setSearchInput("")}
              placeholder="Search by account number..."
              handleParamsChange={handleParamsChange}
            />

            <FilterExport
              handleExport={handleExport}
              toggleFilter={toggleFilter}
              showFilter={false}
            />
          </div>

          <div className='relative flex justify-end mt-4 md:mt-0'>
            <Dropdown onOpen={showFilter} onClose={toggleFilter}>
              <Filter filterCallback={setFilter} />
            </Dropdown>
          </div>
        </div>
      )}

      {getVirtualAccountsHistoryLoading ? (
        <div className="mt-4">
          <TableSkeleton singleButton />
        </div>
      ) : virtual_accounts?.length !== 0 ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#C4C4C452] border-t-0 dark:border-gray-700">
            <Table columns={columns} className="border-collapse w-full ">
              {virtual_accounts?.map((item: any, index: number) => {
                const [date, time] = formatDateTime2(item.created_at);

                return (
                  <tr
                    key={index}
                    className={`${index !== virtual_accounts.length - 1
                      ? "[&>td]:border-b [&>td]:border-[#C4C4C452] dark:border-gray-700"
                      : ""
                      } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <td className="text-sm px-5 py-6 font-medium text-gray-900 dark:text-gray-100">{index + 1}</td>
                    <td className="text-sm pl-3 pr-5 py-6 font-medium text-gray-900 dark:text-gray-100">
                      {capitalizeFirstLetter(item.account_name || "N/A")}
                    </td>

                    <td className="text-sm pl-3 pr-5 py-6 font-medium text-gray-900 dark:text-gray-100">{item.account_number}</td>
                    <td className="text-sm pl-3 pr-5 py-6 font-medium text-gray-900 dark:text-gray-100">{item.bank}</td>
                    <td className="text-sm pl-3 pr-5 py-6 font-medium text-gray-900 dark:text-gray-100">{item.validity_type || 'N/A'}</td>

                    <td className="text-sm pl-3 pr-5 py-6 font-medium text-gray-900 dark:text-gray-100">

                      <p className="text-[#090727] text-sm font-medium">
                        {date}

                        <span className="ml-1 text-[#7F7F7F] text-xs">({time})</span>
                      </p>
                    </td>

                    {/* <td
                    className="text-sm pl-3 pr-5 py-6 text-gray-900 dark:text-gray-100"
                    onClick={() => {
                      handleClick(item);
                      router.push(`/collections/virtual-accounts/${item.id}`);
                    }}
                  >
                    <div
                      className={`flex items-center gap-1 cursor-pointer w-20 ${item.status === 1
                        ? 'text-primary'
                        : 'text-[#7F7F7F]'
                        }`}
                    >
                      <Switch
                        id={`switch-${item.id}`}
                        enabled={item?.status === 1}
                        onChange={(e) => null}
                        // onChange={(e) => handleModalClick(item, true)}
                        containerClassName={item.status !== 1 ? "bg-white border border-[#7F7F7F]" : undefined}
                        contentClassName={item.status !== 1 ? "!bg-[#7F7F7F] ml-[3px]" : undefined}
                      />
                      {item?.status === 1 ? 'Active' : 'Inactive'}
                    </div>
                  </td> */}
                  </tr>
                )
              })}
            </Table>
          </div>

          <Pagination
            lastPage={lastPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState
          title="No Virtual Accounts found"
          subTitle="We couldn't find any virtual accounts"
          image="/images/virtual-acc-empty.svg"
        >
          <ActionButton
            ariaLabel="Request an account"
            text="Request an account"
            iconName="plus"
            onClick={openModal}
          />
        </EmptyState>
      )}
      <RequestVirtualAccount
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        fetchVirtualAccounts={fetchVirtualAccounts}
      />
    </>
  );
};

export default VirtualAccounts;
