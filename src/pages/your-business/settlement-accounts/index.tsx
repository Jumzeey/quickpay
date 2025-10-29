import React, { useState, useEffect, Fragment, useCallback } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import {
  getSettlementAccounts,
  getSettlementHistory,
} from "@/services/transaction";
import AddSettlementAccount from "./add-account";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import useClickEvent from "@/stores/useClickEvent";
import Modal from "@/components/modal";
import Loader from "@/components/loader";
import { EnableOrDisableAccount } from "@/services/transaction";
import { notifyError, notifySuccess } from "@/util/utils";
import Icon from "@/components/icon";
import WebPageTitle from "@/components/WebPageTitle";
import useFilter from "@/stores/useFilter";
import debounce from "@/util/debounce";

interface AccountProps {
  accounts: any[];
  isLoading: boolean;
  isAddAccountModalOpen: boolean;
  isChangeStatusModalOpen: boolean;
}
const SettlementAccounts = () => {
  const [searchInput, setSearchInput] = useState("");
  const [state, setState] = useState<AccountProps>({
    accounts: [],
    isLoading: true,
    isAddAccountModalOpen: false,
    isChangeStatusModalOpen: false,
  });

  const { handleClick, selectedItem } = useClickEvent();

  const fetchSettlementAccounts = async () => {
    try {
      const accounts = await getSettlementAccounts();
      setState(prevState => ({
        ...prevState,
        accounts,
        isLoading: false,
      }));
    } catch (error) {
    } finally {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
      }));
    }
  };

  const columns = [
    "s/n",
    "account name",
    "account number",
    "bank",
    "status",
    "date",
    "action",
  ];

  const openAddAccountModal = () => {
    setState(prevState => ({
      ...prevState,
      isAddAccountModalOpen: true,
    }));
  };
  const closeAddAccountModal = () => {
    setState(prevState => ({
      ...prevState,
      isAddAccountModalOpen: false,
    }));
  };

  const openChangeStatusModal = () => {
    setState(prevState => ({
      ...prevState,
      isChangeStatusModalOpen: true,
    }));
  };

  const closeChangeStatusModal = () => {
    setState(prevState => ({
      ...prevState,
      isChangeStatusModalOpen: false,
    }));
  };

  const handleStatusChange = (item: any) => {
    handleClick(item);
    openChangeStatusModal();
  };

  const handleEnableOrDisableAccount = async () => {
    setState({ ...state, isLoading: true });
    const decider = selectedItem.status === "Active" ? "disable" : "enable";
    try {
      const response = await EnableOrDisableAccount(selectedItem.id, decider);
      //@ts-ignore
      notifySuccess(response?.message);
      fetchSettlementAccounts();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState({ ...state, isLoading: false });
      closeChangeStatusModal();
    }
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

  const fetchSearchedSettlementAccounts = async () => {
    const accounts = await getSettlementAccounts({ search: searchInput });
    setState(prevState => ({
      ...prevState,
      accounts,
      isLoading: false,
    }));
  };

  useEffect(() => {
    if (searchInput) {
      fetchSearchedSettlementAccounts();
    } else {
      fetchSettlementAccounts();
    }
  }, [searchInput]);

  return (
    <Layout pageTitle="Settlement Accounts" icon="settlement-accounts">
      <WebPageTitle title="Settlement Accounts | Merchant Portal" />
      <div className="">
        <h2 className="text-xl font-semibold">Manage Settlement Accounts</h2>
        <p className="text-sm pt-3 pb-5">
          Manage settlement accounts within your company
        </p>
        {state.isLoading && !state.isChangeStatusModalOpen ? (
          <TableSkeleton singleButton />
        ) : state.accounts.length !== 0 ? (
          <Fragment>
            <Card>
              <div className="flex md:justify-end pb-5">
                {/* <div className="relative">
                <input
                      type="text" 
                      id="searchInput"
                      name="searchInput"
                      placeholder="Search by reference"
                      onChange={handleParamsChange}
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

                <Button
                  ariaLabel="settlement button"
                  text="Add Settlement Account"
                  onClick={openAddAccountModal}
                  primary
                  medium
                />
              </div>
              <Table columns={columns} className="mt-7">
                {state.accounts.map((item: any, index: number) => {
                  const activeItem = item.status === "Active";
                  return (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">{item.account_name}</td>
                      <td className="text-sm px-5 py-6">
                        {item.account_number}
                      </td>
                      <td className="text-sm px-5 py-6">{item.bank_name}</td>
                      <td className="text-xs px-5 py-6">
                        <div
                          className={`text-center rounded-lg py-1 px-3 ${
                            item.status === "Active"
                              ? "text-success bg-[#E9F7EF]"
                              : "text-danger bg-[#e0440326]"
                          }`}
                        >
                          {item.status}
                        </div>
                      </td>
                      <td className="text-sm px-5 py-6">{item.created_at}</td>
                      {!activeItem ? (
                        <td
                          className="text-xs px-5 py-6"
                          onClick={() => {
                            handleStatusChange(item);
                          }}
                        >
                          <div className="text-center flex gap-1 items-center rounded-lg py-1 px-3 border border-success text-success">
                            <Icon name="green-check" />
                            Enable
                          </div>
                        </td>
                      ) : (
                        <td className="text-sm px-5 py-6">--</td>
                      )}
                    </tr>
                  );
                })}
              </Table>
            </Card>
          </Fragment>
        ) : (
          <EmptyState
            title="No Settlement Accounts found"
            subTitle="We couldn't find any settlement account to this account"
            image="/images/send-envelope.svg"
          >
            <Button
              text="Add Settlement Account"
              ariaLabel="Add settlement button"
              className="!w-[191px] !h-[48px]"
              onClick={openAddAccountModal}
              primary
            />
          </EmptyState>
        )}
        <Modal
          isOpen={state.isChangeStatusModalOpen}
          onClose={closeChangeStatusModal}
        >
          <div className="flex justify-center text-center">
            <div className="flex flex-col items-center">
              <Icon name="warning" />

              <div className="mt-3">
                <p className="text-3xl font-semibold py-2">Head up!</p>
                <p className="">
                  Are you sure you want to enable this account?
                </p>
              </div>

              <div className="flex justify-center items-center gap-3 mt-7">
                <Button
                  text={state.isLoading ? <Loader /> : "Confirm"}
                  ariaLabel="Confirm button"
                  onClick={handleEnableOrDisableAccount}
                  disabled={state.isLoading}
                  primary
                  small
                />
                <Button
                  text="Cancel"
                  ariaLabel="Cancel button"
                  onClick={closeChangeStatusModal}
                  plain
                  small
                />
              </div>
            </div>
          </div>
        </Modal>
        <AddSettlementAccount
          isModalOpen={state.isAddAccountModalOpen}
          closeModal={closeAddAccountModal}
          fetchSettlementAccounts={fetchSettlementAccounts}
        />
      </div>
    </Layout>
  );
};

export default SettlementAccounts;
