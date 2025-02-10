import React, { useState, useEffect, Fragment, useCallback } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import IconWrapper from "@/components/IconWrapper";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/button";
import Dropdown from "@/components/Dropdown";
import TransactionDetails from "@/components/transactionDetails";
import Filter from "@/components/Filter";
import useClickEvent from "@/stores/useClickEvent";
import useFilter from "@/stores/useFilter";
import TableSkeleton from "@/components/TableSkeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { downloadFile, formatDate, notifyError } from "@/util/utils";
import WebPageTitle from "@/components/WebPageTitle";
import useEcommerce from "@/stores/useEcommerce";
import Pagination from "@/components/pagination";
import debounce from "@/util/debounce";

interface OrderProps {
  orders: any[];
  isLoading: boolean;
  showOrders: boolean;
  showFilterStatus: boolean;
}

const Orders = () => {
  const { selectedItem, handleClick } = useClickEvent();
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const {
    fetchShippingOrders,
    orders,
    pagination,
    getShippingOrdersLoading,
  } = useEcommerce();

  const { showFilter, toggleFilter } = useFilter();

  const [state, setState] = useState<OrderProps>({
    orders: [],
    isLoading: true,
    showOrders: false,
    showFilterStatus: false,
  });

  const closeDropdown = () => {
    setState({
      ...state,
      showFilterStatus: false,
    });
  };

  const handleActionClick = (item: any) => {
    handleClick(item);
  };

  const columns = [
    "s/n",
    "ref",
    "amount",
    "charge",
    "balance before",
    "balance after",
    "date",
    "status",
    "action",
  ];

  // const debouncedHandleParamsChange = useCallback(
  //   debounce((value: string) => {
  //     setSearchInput(value);
  //   }, 300),
  //   []
  // );

  // const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   debouncedHandleParamsChange(event.target.value);
  // };

  // const handleExport = async () => {
  //   try {
  //     const response = await getCollectionHistory({ export: true });
  //     downloadFile(response.export_link);
  //   } catch (error: any) {
  //     notifyError(error.message);
  //   }
  // };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  useEffect(() => {
    fetchShippingOrders({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filter.startDate
        ? { start_date: formatDate(filter.startDate), end_date: formatDate(filter.endDate) }
        : {}),
    });
  }, [
    searchInput,
    currentPage,
    filter.endDate,
    filter.startDate,
    statusFilter,
    fetchShippingOrders,
  ]);

  return (
    <Layout pageTitle="Ecommerce Orders" icon="order">
      <WebPageTitle title="Shipping Orders | Sarepay Merchant Portal" />
      {state.showOrders ? (
        <TransactionDetails
          selectedItem={selectedItem}
          setState={setState}
          state={state}
          selectedModule="collections"
        />
      ) : (
        <div>
          <h2 className="text-xl font-semibold">Manage Orders</h2>
          <p className="text-sm pt-3 pb-5">
            Manage orders within your company
          </p>
          {getShippingOrdersLoading ? (
            <Fragment>
              <TableSkeleton />
            </Fragment>
          ) : orders?.length !== 0 ? (
            <Fragment>
              <Card className="mt-10">
                <div className="flex flex-col md:flex-row justify-between pb-5">
                  <div className="relative">
                    <input
                      type="text"
                      id="searchInput"
                      name="searchInput"
                      placeholder="Search by reference"
                      // onChange={handleParamsChange}
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
                      ariaLabel="Filter by status button"
                      text="Filter By Status"
                      // onClick={() =>
                      //   setState({
                      //     ...state,
                      //     showFilterStatus: !state.showFilterStatus,
                      //   })
                      // }
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
                      // onClick={handleExport}
                      plain
                    />
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
                <div className="relative flex justify-end -mt-4">
                  <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                    <Filter filterCallback={setFilter} />
                  </Dropdown>
                </div>
                <Table columns={columns} className="mt-7">
                  {orders?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">
                        {item.reference || "N/A"}
                      </td>
                      <td className="text-sm px-5 py-6">{item.amount}</td>
                      <td className="text-sm px-5 py-6">
                        {item.processing_fee}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.balance_before}
                      </td>

                      <td className="text-sm px-5 py-6">
                        {item.current_balance}
                      </td>
                      <td className="text-sm px-5 py-6">{item.created_at} </td>
                      <td className="text-xs px-5 py-6">
                        <div
                          className={`text-center rounded-lg py-1 px-3 ${
                            item.status === "Successful"
                              ? "text-success bg-[#E9F7EF]"
                              : "text-danger bg-[#e0440326]"
                          }`}
                        >
                          {item.status}
                        </div>
                      </td>

                      <td
                        className="text-sm px-5 py-6"
                        onClick={() => handleActionClick(item)}
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
              title="No orders found"
              subTitle="We couldn't find any orders for this account"
              image="/images/shipping-settings-empty.svg"
            />
          )}
        </div>
      )}
    </Layout>
  );
};

export default Orders;
