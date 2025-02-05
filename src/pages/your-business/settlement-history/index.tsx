import React, { Fragment, useCallback, useEffect, useState } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import Dropdown from "@/components/Dropdown";
import Filter from "@/components/Filter";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import useClickEvent from "@/stores/useClickEvent";
import { useRouter } from "next/router";
import WebPageTitle from "@/components/WebPageTitle";
import useFilter from "@/stores/useFilter";
import useSettlementHistory from "@/stores/useSettlementHistory";
import Pagination from "@/components/pagination";
import { downloadFile, formatDate, notifyError } from "@/util/utils";
import { getSettlementHistory } from "@/services/transaction";
import { getBankDetails } from "@/services/user";
import Icon from "@/components/icon";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { copyToClipboard } from "@/util/utils";
import debounce from "@/util/debounce";

interface StateProps {
  isLoading: boolean;
  bankDetails: {
    bank_name: string;
    account_name: string;
    account_number: string;
  };
}

const SettlementHistory = () => {
  const {
    fetchSettlementsHistory,
    settlements,
    pagination,
    getSettlementHistoryLoading,
  } = useSettlementHistory();

  const { showFilter, toggleFilter } = useFilter();
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const { handleClick } = useClickEvent();
  const router = useRouter();

  const [state, setState] = useState<StateProps>({
    isLoading: true,
    bankDetails: {
      bank_name: "",
      account_name: "",
      account_number: "",
    },
  });

  const columns = [
    "s/n",
    "amount",
    "date",
    "settlement status",
    "settlement date",
    "approval status",
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

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const bankDetails = await getBankDetails();
      setState((prevState) => ({
        ...prevState,
        bankDetails,
        isLoading: false,
      }));
    } catch (error) {}
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  useEffect(() => {
    fetchSettlementsHistory({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(filter.startDate
        ? { start_date: formatDate(filter.startDate), end_date: formatDate(filter.endDate) }
        : {}),
    });
  }, [searchInput,currentPage,filter.endDate,filter.startDate]);

  return (
    <Layout pageTitle="Settlement History" icon="history">
      <WebPageTitle title="Settlement History | Sarepay Merchant Portal" />
      <div>
        {getSettlementHistoryLoading ? (
          <Fragment>
            <Card className="md:w-[477px] mb-7">
              <div className="flex justify-start items-center">
                <span className="block w-[130px] rounded-lg pb-1">
                  <Skeleton className="h-2.5" />
                </span>
              </div>

              <div className="flex justify-between mt-16">
                <span className="block pb-1 w-[120px] rounded-lg">
                  <Skeleton className="h-2.5" />
                  <Skeleton className="h-2.5" width={80} />
                </span>
                <span className="block pb-1 w-[120px] rounded-lg">
                  <Skeleton className="h-2.5" />
                  <Skeleton className="h-2.5" width={80} />
                </span>
              </div>
            </Card>
            <TableSkeleton />
          </Fragment>
        ) : settlements?.length !== 0 ? (
          <Fragment>
            <Card className="md:w-[477px] !rounded-xl mb-5">
              <span className="font-semibold text-sm uppercase">Bank:</span>
              &nbsp;
              <span className="font-normal text-sm uppercase">
                {state.bankDetails?.bank_name}
              </span>
              <div className="flex justify-between mt-16">
                <ul>
                  <li className="uppercase text-xs font-semibold leading-8">
                    account name:
                  </li>
                  <li className="font-normal text-sm">
                    {state.bankDetails?.account_name}
                  </li>
                </ul>

                <ul>
                  <li className="uppercase text-xs font-semibold leading-8">
                    account number:
                  </li>
                  <li className="font-normal text-sm flex items-center gap-2">
                    {state.bankDetails?.account_number}
                    <Icon
                      name="copy"
                      size="15"
                      className="cursor-pointer"
                      onClick={() =>
                        copyToClipboard(state.bankDetails?.account_number)
                      }
                    />
                  </li>
                </ul>
              </div>
            </Card>
            <Card>
              <div className="flex justify-end pb-5">
                {/* <div className="relative">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    placeholder="Search by reference"
                    className="border-0 h-[40px] w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                    onChange={handleParamsChange}
                  />

                  <Image
                    src="/images/search.svg"
                    width={20}
                    height={20}
                    alt="Search Icon"
                    className="absolute top-[10px] left-3"
                  />
                </div> */}

                <div className="flex gap-3">
                  <Button
                    ariaLabel="Filter button"
                    text="Filter"
                    onClick={() => toggleFilter()}
                    className="!w-24 !h-10"
                    plain
                  />
                  <Button
                    ariaLabel="Export button"
                    text="Export"
                    className="!w-24 !h-10"
                    onClick={handleExport}
                    plain
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                  <Filter filterCallback={fetchSettlementsHistory} />
                </Dropdown>
              </div>

              <Table columns={columns} className="mt-7">
                {settlements?.map((item: any, index: number) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-none border-grey-200"
                  >
                    <td className="text-sm px-5 py-6">{index + 1}</td>
                    <td className="text-sm px-5 py-6">{item.total_amount}</td>
                    <td className="text-sm px-5 py-6">{item.created_at}</td>
                    <td className="text-xs px-5 py-6">
                      <div
                        className={`text-center rounded-lg py-1 px-3 ${
                          item.settlement_status === "Approved" ||
                          item.settlement_status === "Successful"
                            ? "text-success bg-[#E9F7EF]"
                            : "text-danger bg-[#e0440326]"
                        }`}
                      >
                        {item.settlement_status}
                      </div>
                    </td>
                    <td className="text-sm px-5 py-6">
                      {item.settlement_date}
                    </td>
                    <td className="text-xs px-5 py-6">
                      <div
                        className={`text-center rounded-lg py-1 px-3 ${
                          item.approval_status === "Approved"
                            ? "text-success bg-[#E9F7EF]"
                            : "text-danger bg-[#e0440326]"
                        }`}
                      >
                        {item.approval_status}
                      </div>
                    </td>
                    <td
                      className="text-sm px-5 py-6"
                      onClick={() => {
                        handleClick(item);
                        router.push(
                          `/your-business/settlement-history/${item.id}`
                        );
                      }}
                    >
                      <Image
                        src="/images/eye-on-dark.svg"
                        className="cursor-pointer"
                        alt="Eye Icon"
                        width={24}
                        height={24}
                        priority
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
            title="No Settlement History found"
            subTitle="We couldn't find any settlement history to this account"
            image="/images/history.svg"
          />
        )}
      </div>
    </Layout>
  );
};

export default SettlementHistory;
