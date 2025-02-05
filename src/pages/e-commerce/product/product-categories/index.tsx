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
import AddSettlementAccount from "./create";
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
  isAddCategoryModalOpen: boolean;
  isChangeStatusModalOpen: boolean;
}
const ProductCategories = () => {
  const [searchInput, setSearchInput] = useState("");
  const [state, setState] = useState<AccountProps>({
    accounts: [],
    isLoading: true,
    isAddCategoryModalOpen: false,
    isChangeStatusModalOpen: false,
  });

  const { handleClick, selectedItem } = useClickEvent();

  const getDummySettlementAccounts = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: "Business Account", created_at: '15 Aug, 2023' },
          { id: 2, name: "Business Account", created_at: '18 Aug, 2023' },
        ]);
      }, 1000);
    });
  };

  const fetchSettlementAccounts = async () => {
    try {
      const accounts = await getDummySettlementAccounts();
      setState((prevState: AccountProps) => ({
        ...prevState,
        accounts: accounts as any[],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch settlement accounts", error);
    } finally {
      setState((prevState: AccountProps) => ({
        ...prevState,
        isLoading: false,
      }));
    }
  };

  const columns = ["s/n", "name", "created at", "action"];

  const openAddCategoryModal = () => {
    setState((prevState) => ({
      ...prevState,
      isAddCategoryModalOpen: true,
    }));
  };
  const closeAddCategoryModal = () => {
    setState((prevState) => ({
      ...prevState,
      isAddCategoryModalOpen: false,
    }));
  };

  const openChangeStatusModal = () => {
    setState((prevState) => ({
      ...prevState,
      isChangeStatusModalOpen: true,
    }));
  };

  const closeChangeStatusModal = () => {
    setState((prevState) => ({
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
    setState((prevState) => ({
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
    <Layout pageTitle="Product Categories" icon="settlement-accounts">
      <WebPageTitle title="Product Categories | Sarepay Merchant Portal" />
      <div className="">
        <h2 className="text-xl font-semibold">Manage Product Categories</h2>
        <p className="text-sm pt-3 pb-5">
          Manage product categories within your company
        </p>
        {state.isLoading && !state.isChangeStatusModalOpen ? (
          <TableSkeleton singleButton />
        ) : state.accounts.length !== 0 ? (
          <Fragment>
            <Card>
              <div className="flex justify-between pb-5">
                <div className="relative">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    placeholder="Search by name"
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
                </div>

                <Button
                  ariaLabel="product categories button"
                  text="Add New Product Categories"
                  onClick={openAddCategoryModal}
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
                      <td className="text-sm px-5 py-6">{item.name}</td>
                      <td className="text-sm px-5 py-6">{item.created_at}</td>
                      <td className="flex px-5 py-6">
                        <Icon name="edit-red" />
                        <Icon name="delete-red" />
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          </Fragment>
        ) : (
          <EmptyState
            title="No Product Category found"
            subTitle="We couldn't find any product category to this account"
            image="/images/send-envelope.svg"
          >
            <Button
              text="Add Product Category"
              ariaLabel="Add new product category"
              className="!w-[191px] !h-[48px]"
              onClick={openAddCategoryModal}
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
          isModalOpen={state.isAddCategoryModalOpen}
          closeModal={closeAddCategoryModal}
          fetchSettlementAccounts={fetchSettlementAccounts}
        />
      </div>
    </Layout>
  );
};

export default ProductCategories;
