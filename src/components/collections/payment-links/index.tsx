import ActionButton from "@/components/action-button";
import Button from "@/components/button";
import Card from "@/components/Card";
import AddPaymentLink from "@/components/collections/AddPaymentLink";
import PaymentLinkTransactions from "@/components/collections/payment-links/transactions";
import Dropdown from "@/components/Dropdown";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/icon";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import Pagination from "@/components/pagination";
import Switch from "@/components/Switch";
import Table from "@/components/table";
import TableSkeleton from "@/components/TableSkeleton";
import { SharedStateContext } from "@/context/sharedState";
import { usePaginatedEffect } from "@/hooks/useEffectFetch";
import { disablePaymentLink, getPaymentLinks } from "@/services/collections";
import useClickEvent from "@/stores/useClickEvent";
import { paymentLinksAnalytics } from "@/util/constants";
import {
  capitalizeFirstLetterOfEachWord,
  copyToClipboard,
  formatBalance,
  notifyError,
  notifySuccess
} from "@/util/utils";
import Link from "next/link";
import { Fragment, useContext, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface paymentLinksProps {
  paymentLinks: any[];
  isLoading?: boolean;
  isInitialLoad?: boolean;
  dropdownIndex: null | number;
  showFilter: boolean;
  totalLinks: number;
  activeLinks: number;
  pausedLinks: number;
  currentStep: "payment-links" | "payment-transactions";
}

type ModalType = "create" | "edit" | null;

const columns = ["No.", "title", "currency", "amount", "link", "date Created", ""];

const PaymentLinks = () => {
  const [isModalOpen, setIsModalOpen] = useState<ModalType>(null);
  const openModal = (type: ModalType) => setIsModalOpen(type);
  const closeModal = () => setIsModalOpen(null);

  const { handleClick } = useClickEvent();
  const { handleModalClick, sharedState } = useContext(SharedStateContext)!;

  const [state, setState] = useState<paymentLinksProps>({
    paymentLinks: [],
    dropdownIndex: null,
    showFilter: false,
    totalLinks: 0,
    activeLinks: 0,
    pausedLinks: 0,
    currentStep: "payment-links",
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>(null);

  const {
    data: paymentLinksData,
    loading: isLoading,
    error,
    refetch: fetchPaymentLinks
  } = usePaginatedEffect(
    async (params) => {
      const response = await getPaymentLinks(false, undefined, params);
      return response;
    },
    { page: currentPage },
    {
      onSuccess: (response) => {
        // Response shape expected to contain: payment_links, total_links, active_links, paused_links, pagination
        const { total_links, active_links, paused_links, pagination } = response || {};
        setState(prevState => ({
          ...prevState,
          paymentLinks: response?.payment_links || [],
          totalLinks: total_links || 0,
          activeLinks: active_links || 0,
          pausedLinks: paused_links || 0,
        }));
        setPagination(pagination || null);
      },
      onError: (error) => {
        notifyError(error.message);
      }
    }
  );

  const viewTransactions = () => {
    setState(prevState => ({
      ...prevState,
      currentStep: "payment-transactions",
    }));
  }

  const viewPaymentLinks = () => {
    setState(prevState => ({
      ...prevState,
      currentStep: "payment-links",
    }));
  }

  const handleDropdownToggle = (index: number | null, selectedItem: any) => {
    setState({
      ...state,
      dropdownIndex: state.dropdownIndex === index ? null : index,
    });
    handleClick(selectedItem, true);
  };

  const closeDropdown = () => {
    setState({
      ...state,
      dropdownIndex: null,
      showFilter: false,
    });
  };

  const handleDisablePaymentLink = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await disablePaymentLink(sharedState?.selectedItem?.id);
      closeDisableModal();
      // @ts-ignore
      notifySuccess(response.message);
      await fetchPaymentLinks();
    } catch (error: any) {
      closeDisableModal();
      notifyError(error.message);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDisableModal = () => sharedState.setShowModal(false);

  const isInitialLoad = isLoading && !paymentLinksData;

  return (
    <>
      {isLoading && state.isInitialLoad ? (
        <Fragment>
          <div className="grid md:grid-cols-3 gap-5 mb-7">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="!rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="block pb-1 w-[60px] rounded-lg">
                    <Skeleton className="h-2.5" />
                  </span>
                  <Skeleton className="rounded-xl" width={26} height={26} />
                </div>

                <div className="mt-6">
                  <span className="block w-[130px] rounded-lg pb-1">
                    <Skeleton className="h-2.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <TableSkeleton />
        </Fragment>
      ) : state.paymentLinks?.length === 0 ? (
        <EmptyState
          title="No Payment Links found"
          subTitle="We couldn't find any payment links to this account"
          image="/images/dashboard/collections/payment-links-empty.svg"
        >
          <ActionButton
            ariaLabel="Create Payment Link"
            text="Create Payment Link"
            iconName="plus"
            onClick={() => {
              console.log("Create Payment Link clicked");
              openModal("create")
            }}
          />
        </EmptyState>
      ) : (
        <>
          {state.currentStep === "payment-links" && (
            <>
              <ActionButton
                ariaLabel="Create Payment Link"
                text="Create Payment Link"
                iconName="plus"
                onClick={() => openModal("create")}
                className="mt-6"
              />

              <div className="flex items-center gap-20 mt-6">
                {paymentLinksAnalytics?.map((item: any, index: number) => {
                  let count;
                  if (item.title.includes("total")) {
                    count = state.totalLinks;
                  } else if (item.title.includes("active")) {
                    count = state.activeLinks;
                  } else {
                    count = state.pausedLinks;
                  }

                  return (
                    <div className="flex flex-col gap-1" key={index}>
                      <p className="text-[#7F7F7F] text-[13px] font-medium">
                        {capitalizeFirstLetterOfEachWord(item.title)}
                      </p>
                      <h2 className="text-[#090727] text-lg font-extrabold">{count}</h2>
                    </div>
                  )
                })}
              </div>

              <div className="mt-10">
                {/* <div className="flex justify-between pb-5">
              <div className="flex gap-3">
                <Button
                  ariaLabel="Filter button"
                  text="Filter"
                  className="!w-24 !h-10"
                  onClick={() =>
                    setState({ ...state, showFilter: !state.showFilter })
                  }
                  plain
                />
                <Button
                  ariaLabel="Export button"
                  text="Export"
                  className="!w-24 !h-10"
                  plain
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="searchInput"
                  name="searchInput"
                  placeholder="Search by reference"
                  className="border-0 h-[40px] w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                />

                <Image
                  src="/images/search.svg"
                  width={20}
                  height={20}
                  alt="Search Icon"
                  className="absolute top-[10px] left-3"
                />
              </div> 
              
              <Link href="/collections/payment-links/create">
                <Button
                  ariaLabel="Create Link"
                  text="Create Payment Link"
                  primary
                  medium
                />
              </Link>
            </div> 
             <Dropdown onOpen={state.showFilter} onClose={closeDropdown}>
              <Filter />
            </Dropdown> */}

                <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg border border-[#C4C4C452] dark:border-gray-700">
                  <Table columns={columns}>
                    {state.paymentLinks?.map((item: any, index: number) => {
                      const paymentLink = `${process.env.NEXT_PUBLIC_CHECKOUT_URL}/checkout/${item.uuid}`;
                      return (
                        <tr
                          key={index}
                          className="[&>td]:border-b last:border-none [&>td]:border-[#C4C4C452] [&>td]:font-medium [&>td]:text-sm [&>td]:px-3 [&>td]:py-6"
                        >
                          <td>
                            {index + 1}.
                          </td>

                          <td className="capitalize">
                            {item.title}
                          </td>

                          <td className="capitalize">
                            {item?.currency || 'N/A'}
                          </td>

                          <td>
                            {formatBalance(item.amount)}
                          </td>

                          <td className="flex items-center gap-1 truncate">
                            <Link href={paymentLink} target="_blank">
                              {paymentLink.length > 30
                                ? `${paymentLink.slice(0, 40)}...`
                                : paymentLink}
                            </Link>
                            <Icon
                              name="copy3"
                              size="15"
                              className="cursor-pointer text-[#7F7F7F]"
                              onClick={() => copyToClipboard(paymentLink)}
                            />
                          </td>
                          <td>{item.created_at}</td>
                          <td className="flex items-center justify-end gap-8 text-right">
                            <div
                              className={`flex items-center gap-1 cursor-pointer w-20 ${item.status === 1
                                ? "text-primary"
                                : "text-[#7F7F7F]"
                                }`}
                            >
                              <Switch
                                id={`switch-${item.id}`}
                                enabled={item.status === 1}
                                onChange={(e) => handleModalClick(item, true)}
                                containerClassName={item.status !== 1 ? "bg-white border border-[#7F7F7F]" : undefined}
                                contentClassName={item.status !== 1 ? "!bg-[#7F7F7F] ml-[3px]" : undefined}
                              />
                              {item.status === 1 ? "Active" : "Inactive"}
                            </div>

                            <div>
                              <Icon
                                onClick={() => handleDropdownToggle(index, item)}
                                name="more"
                                className="cursor-pointer text-primary"
                              />

                              <div className="flex justify-end relative z-20">
                                <Dropdown
                                  onOpen={state.dropdownIndex === index}
                                  onClose={closeDropdown}
                                >
                                  <ul className="list-none p-0 space-y-5">
                                    <li
                                      className="flex items-center gap-2 text-[#090727] text-sm font-medium cursor-pointer"
                                      onClick={() => openModal("edit")}
                                    >
                                      <Icon name="edit3" className="text-[#005BB0]" />

                                      <span>Edit Link</span>
                                    </li>
                                    <li
                                      className="flex items-center gap-2 text-[#090727] text-sm font-medium cursor-pointer"
                                      onClick={viewTransactions}
                                    >
                                      <Icon name="eye" className="text-[#005BB0]" />
                                      <span>View Transactions</span>
                                    </li>
                                  </ul>
                                </Dropdown>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Table>
                </div>
              </div>

              {pagination && (
                <div className="px-4">
                  <Pagination
                    lastPage={pagination?.last_page}
                    currentPage={currentPage}
                    totalPages={pagination?.last_page}
                    onPageChange={(page: number) => setCurrentPage(page)}
                  />
                </div>
              )}
            </>
          )}

          {state.currentStep === "payment-transactions" && (
            <div className="w-full">
              <button className="cursor-pointer text-primary text-left text-[13px] font-semibold flex items-center gap-1 mt-6" onClick={viewPaymentLinks}>
                <Icon name="arrowLeft2" />
                <span>Payment Security Summit</span>
              </button>

              <PaymentLinkTransactions />
            </div>
          )}
        </>
      )}

      <Modal
        title={isModalOpen === "edit" ? "Edit Payment Link" : "Create A Payment Link"}
        isOpen={["create", "edit"].includes(isModalOpen as string)}
        onClose={closeModal}
      >
        <AddPaymentLink
          createLink={isModalOpen === "create"}
          fetchPaymentLinks={fetchPaymentLinks}
          closeModal={closeModal}
        />
      </Modal>

      <Modal
        isOpen={sharedState.showModal} onClose={closeDisableModal}>
        <div className="flex justify-center text-center">
          <div className="flex flex-col items-center">
            <Icon name="warning" />

            <div className="mt-3">
              <p className="text-3xl font-semibold py-2">Head up!</p>
              <p className="">
                Are you sure you want to
                {sharedState?.selectedItem?.status === 1
                  ? " disable "
                  : " enable "}
                this payment link?
              </p>
            </div>

            <div className="flex justify-center items-center gap-3 mt-7">
              <Button
                text={state.isLoading ? <Loader /> : "Confirm"}
                ariaLabel="Confirm button"
                onClick={handleDisablePaymentLink}
                disabled={state.isLoading}
                primary
                small
              />
              <Button
                text="Cancel"
                ariaLabel="Cancel button"
                onClick={closeDisableModal}
                plain
                small
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PaymentLinks;
