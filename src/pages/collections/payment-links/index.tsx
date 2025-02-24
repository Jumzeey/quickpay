import React, { useState, useEffect, Fragment, useContext } from "react";
import Layout from "@/components/layout";
import Card from "@/components/Card";
import Filter from "@/components/Filter";
import IconWrapper from "@/components/IconWrapper";
import Modal from "@/components/modal";
import Dropdown from "@/components/Dropdown";
import { paymentLinksAnalytics } from "@/util/constants";
import Image from "next/image";
import {
  numberWithCommas,
  copyToClipboard,
  notifyError,
  notifySuccess,
} from "@/util/utils";
import { getPaymentLinks, disablePaymentLink } from "@/services/collections";
import Button from "@/components/button";
import Table from "@/components/table";
import AddPaymentLink from "@/components/collections/AddPaymentLink";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import useClickEvent from "@/stores/useClickEvent";
import { SharedStateContext } from "@/context/sharedState";
import TableSkeleton from "@/components/TableSkeleton";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Loader from "@/components/loader";
import Icon from "@/components/icon";
import WebPageTitle from "@/components/WebPageTitle";

interface paymentLinksProps {
  paymentLinks: any[];
  isLoading: boolean;
  isInitialLoad: boolean;
  dropdownIndex: null | number;
  showFilter: boolean;
  totalLinks: number;
  activeLinks: number;
  pausedLinks: number;
}

const columns = ["title", "amount", "status", "link", "date", "action"];

const PaymentLinks = () => {
  const { handleClick } = useClickEvent();
  const { handleModalClick, sharedState } = useContext(SharedStateContext)!;

  const [state, setState] = useState<paymentLinksProps>({
    paymentLinks: [],
    isLoading: true,
    isInitialLoad: true,
    dropdownIndex: null,
    showFilter: false,
    totalLinks: 0,
    activeLinks: 0,
    pausedLinks: 0,
  });

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchPaymentLinks = async () => {
    try {
      const response = await getPaymentLinks(false);
      const { total_links, active_links, paused_links } = response || {};

      setState(prevState => ({
        ...prevState,
        paymentLinks: response?.payment_links,
        totalLinks: total_links,
        activeLinks: active_links,
        pausedLinks: paused_links,
      }));
    } catch (error: any) {
      notifyError("error.message");
    } finally {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        isInitialLoad: false,
      }));
    }
  };

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
      setState({ ...state, isLoading: true });
      const response = await disablePaymentLink(sharedState?.selectedItem?.id);
      closeDisableModal();
      // @ts-ignore
      notifySuccess(response.message);
      fetchPaymentLinks();
    } catch (error: any) {
      closeDisableModal();
      notifyError(error.message);
    } finally {
      setState({ ...state, isLoading: false });
    }
  };

  const closeDisableModal = () => {
    sharedState.setShowModal(false);
  };

  return (
    <Layout pageTitle="Payment Links" icon="link">
      <WebPageTitle title="Payment Links | Ramp Merchant Portal" />
      {state.isLoading && state.isInitialLoad ? (
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
          <Link href="/collections/payment-links/create">
            <Button
              ariaLabel="Create Link"
              text="Create Payment Link"
              className="!w-44 !h-10"
              primary
            />
          </Link>
        </EmptyState>
      ) : (
        <Fragment>
          <div className="grid md:grid-cols-3 gap-5">
            {paymentLinksAnalytics.map((item: any, index: number) => {
              let count;
              if (item.title.includes("total")) {
                count = state.totalLinks;
              } else if (item.title.includes("active")) {
                count = state.activeLinks;
              } else {
                count = state.pausedLinks;
              }

              return (
                <Card key={index} className="!rounded-lg">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-2xl">
                      {numberWithCommas(count || 0)}
                    </span>
                    <Image
                      src={item.icon}
                      alt="Image 1"
                      width={26}
                      height={26}
                      priority
                    />
                  </div>

                  <div className="flex flex-col mt-10 text-sm leading-[25px]">
                    <span className="uppercase">{item.title}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card className="mt-10">
            <div className="flex justify-between pb-5">
              <div className="flex gap-3">
                {/* <Button
                  ariaLabel="Filter button"
                  text="Filter"
                  className="!w-24 !h-10"
                  onClick={() =>
                    setState({ ...state, showFilter: !state.showFilter })
                  }
                  plain
                /> */}
                <Button
                  ariaLabel="Export button"
                  text="Export"
                  className="!w-24 !h-10"
                  plain
                />
              </div>

              {/* <div className="relative">
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
              </div> */}

              <Link href="/collections/payment-links/create">
                <Button
                  ariaLabel="Create Link"
                  text="Create Payment Link"
                  primary
                  medium
                />
              </Link>
            </div>

            {/* <Dropdown onOpen={state.showFilter} onClose={closeDropdown}>
              <Filter />
            </Dropdown> */}

            <Table columns={columns} className="mt-7">
              {state.paymentLinks?.map((item: any, index: number) => {
                const paymentLink = `${process.env.NEXT_PUBLIC_CHECKOUT_URL}/checkout/${item.uuid}`;
                return (
                  <tr
                    key={index}
                    className="border-b last:border-none border-grey-200"
                  >
                    <td className="text-sm px-5 py-6 capitalize">
                      {item.title}
                    </td>
                    <td className="text-sm px-5 py-6">
                      &#8358;&nbsp;{numberWithCommas(item.amount)}
                    </td>
                    <td className="text-xs px-5 py-6">
                      <div
                        className={`text-center rounded-lg py-1 px-3 ${
                          item.status == 1
                            ? "text-success bg-[#E9F7EF]"
                            : "text-danger bg-[#e0440326]"
                        }`}
                      >
                        {item.status === 1 ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td className="flex items-center gap-1 text-sm px-5 py-6 text-primary">
                      <Link href={paymentLink} target="_blank">
                        Payment Link
                      </Link>
                      <Icon
                        name="copy"
                        size="15"
                        className="cursor-pointer"
                        onClick={() => copyToClipboard(paymentLink)}
                      />
                    </td>
                    <td className="text-sm px-5 py-6">{item.created_at}</td>
                    <td
                      className="text-sm px-5 py-6"
                      onClick={() => handleDropdownToggle(index, item)}
                    >
                      <Image
                        src="/images/dashboard/collections/more.svg"
                        className="cursor-pointer"
                        alt="More Icon"
                        width={4}
                        height={16}
                      />

                      <div className="flex justify-end relative">
                        <Dropdown
                          onOpen={state.dropdownIndex === index}
                          onClose={closeDropdown}
                        >
                          <ul className="list-none p-0">
                            <li
                              className="flex items-center gap-2 pb-5 hover:text-primary"
                              onClick={() => handleModalClick(item, true)}
                            >
                              <IconWrapper
                                src={`/images/dashboard/collections/${
                                  item.status === 1
                                    ? "disable.svg"
                                    : "enable.svg"
                                }`}
                                width={14}
                                height={14}
                                alt="Status icon"
                              />
                              <span>
                                {item.status === 1 ? "Disable" : "Enable"}
                              </span>
                            </li>
                            <li>
                              <Link
                                href="/collections/payment-links/transactions"
                                className="flex items-center gap-2 pb-5 hover:text-primary"
                              >
                                <IconWrapper
                                  src="/images/dashboard/collections/transaction.svg"
                                  width={14}
                                  height={14}
                                  alt="Transaction icon"
                                />
                                <span>Transactions</span>
                              </Link>
                            </li>
                            <li
                              className="flex items-center gap-2 hover:text-primary"
                              onClick={openModal}
                            >
                              <IconWrapper
                                src="/images/dashboard/collections/edit.svg"
                                width={14}
                                height={14}
                                alt="Edit icon"
                              />
                              <span>Edit</span>
                            </li>
                          </ul>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </Card>
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <AddPaymentLink
              fetchPaymentLinks={fetchPaymentLinks}
              closeModal={closeModal}
            />
          </Modal>
          <Modal isOpen={sharedState.showModal} onClose={closeDisableModal}>
            <div className="flex justify-center text-center">
              <div className="flex flex-col items-center">
                <Icon name="warning" />

                <div className="mt-3">
                  <p className="text-3xl font-semibold py-2">Head up!</p>
                  <p className="">
                    Are you sure you want to
                    {sharedState?.selectedItem?.status === 1
                      ? "disable"
                      : "enable"}
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
        </Fragment>
      )}
    </Layout>
  );
};

export default PaymentLinks;
