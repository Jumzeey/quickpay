import React, { useState, useEffect, Fragment, useCallback } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import RequestVirtualAccount from "@/components/collections/RequestVirtualAcount";
import { getVirtualAccounts } from "@/services/collections";
import EmptyState from "@/components/EmptyState";
import IconWrapper from "@/components/IconWrapper";
import useClickEvent from "@/stores/useClickEvent";
import { useRouter } from "next/router";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { capitalizeFirstLetter, downloadFile, formatDate, notifyError } from "@/util/utils";
import Dropdown from "@/components/Dropdown";
import Filter from "@/components/Filter";
import useFilter from "@/stores/useFilter";
import useCollectionHistory from "@/stores/useCollectionHistory";
import Pagination from "@/components/pagination";
import debounce from "@/util/debounce";

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
    "s/n",
    "account name",
    "account number",
    "bank",
    "type",
    "action",
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

  useEffect(() => {
    fetchVirtualAccounts({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(filter.startDate
        ? { start_date: formatDate(filter.startDate), end_date: formatDate(filter.endDate) }
        : {}),
    });
  }, [searchInput, currentPage, filter.endDate, filter.startDate]);

  return (
    <Layout pageTitle="Virtual Accounts" icon="virtual-accounts">
      <WebPageTitle title="Virtual Accounts | Sarepay Merchant Portal" />
      <div className="">
        <h2 className="text-xl font-semibold">Manage Virtual Accounts</h2>
        <p className="text-sm pt-3 pb-5">
          Manage virtual accounts within your company
        </p>
        {getVirtualAccountsHistoryLoading ? (
          <TableSkeleton singleButton />
        ) : virtual_accounts?.length !== 0 ? (
          <Fragment>
            <Card>
              <div className="flex flex-col md:flex-row justify-between pb-5">
                <Button
                  text="Request an account"
                  ariaLabel="Add settlement button"
                  className="!w-44 !h-10 mt-3 md:mt-0"
                  onClick={openModal}
                  primary
                />

                <div className="relative mt-3 md:mt-0">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    placeholder="Search by account number or name"
                    onChange={handleParamsChange}
                    className="border-0 h-[40px] w-full md:w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                  />
                  <Image
                    src="/images/search.svg"
                    width={20}
                    height={20}
                    alt="Search Icon"
                    className="absolute top-[10px] left-3"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3 mt-5 md:mt-0">
                  <Button
                    ariaLabel="Filter button"
                    text="Filter"
                    onClick={() => toggleFilter()}
                    className="md:!w-24 !h-10"
                    plain
                  />
                  <Button
                    ariaLabel="Export button"
                    text="Export"
                    className="md:!w-24 !h-10"
                    onClick={handleExport}
                    plain
                  />
                </div>
              </div>
              <div className="relative flex justify-end -mt-4">
                <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                  <Filter filterCallback={setFilter} />
                </Dropdown>
              </div>
              <Table columns={columns} className="mt-7">
                {virtual_accounts?.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b last:border-none border-grey-200"
                  >
                    <td className="text-sm px-5 py-6">{index + 1}</td>
                    <td className="text-sm px-5 py-6">
                      {capitalizeFirstLetter(item.account_name || "N/A")}
                    </td>

                    <td className="text-sm px-5 py-6">  {item.account_number}  </td>
                    <td className="text-sm px-5 py-6">{item.bank}</td>
                    <td className="text-sm px-5 py-6">{item.account_type}</td>

                    <td
                      className="text-sm px-5 py-6"
                      onClick={() => {
                        handleClick(item);
                        router.push(`/collections/virtual-accounts/${item.id}`);
                      }}
                    >
                      <IconWrapper
                        src="/images/eye-on-dark.svg"
                        className="cursor-pointer"
                        alt="Eye Icon"
                        width={24}
                        height={24}
                      />
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination
                lastPage={lastPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </Card>
          </Fragment>
        ) : (
          <EmptyState
            title="No Virtual Accounts found"
            subTitle="We couldn't find any virtual accounts"
            image="/images/virtual-acc-empty.svg"
          >
            <Button
              text="Request an account"
              ariaLabel="Add settlement button"
              className="!w-[191px] !h-[48px]"
              onClick={openModal}
              primary
            />
          </EmptyState>
        )}
        <RequestVirtualAccount
          isModalOpen={isModalOpen}
          closeModal={closeModal}
          fetchVirtualAccounts={fetchVirtualAccounts}
        />
      </div>
    </Layout>
  );
};

export default VirtualAccounts;
