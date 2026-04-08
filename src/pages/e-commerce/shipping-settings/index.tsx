import React, { useState, useEffect, Fragment } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Button from "@/components/button";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import Icon from "@/components/icon";
import WebPageTitle from "@/components/WebPageTitle";
import { getShippingSettings } from "@/services/e-commerce";
import AddShipping from "@/components/ecommerce/Add-shipping";

interface AccountProps {
  shippingData: any[];
  isLoading: boolean;
  isAddShippingModalOpen: boolean;
  // isChangeStatusModalOpen: boolean;
}
const SettlementAccounts = () => {
  const [searchInput, setSearchInput] = useState("");
  const [state, setState] = useState<AccountProps>({
    shippingData: [],
    isLoading: true,
    isAddShippingModalOpen: false,
    // isChangeStatusModalOpen: false,
  });

  const fetchShippingFees = async () => {
    try {
      const shippingData = await getShippingSettings();
      setState(prevState => ({
        ...prevState,
        shippingData,
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

  const columns = ["s/n", "region", "amount", "action"];

  const openAddShippingModal = () => {
    setState(prevState => ({
      ...prevState,
      isAddShippingModalOpen: true,
    }));
  };
  const closeAddShippingModal = () => {
    setState(prevState => ({
      ...prevState,
      isAddShippingModalOpen: false,
    }));
  };

  useEffect(() => {
    fetchShippingFees();
  }, []);

  return (
    <Layout pageTitle="Shipping Settings" icon="ecommerce">
      <WebPageTitle title="E-commerce - Shipping Settings | Merchant Portal" />
      <div className="">
        <h2 className="text-xl font-semibold">Manage Shipping Settings</h2>
        <p className="text-sm pt-3 pb-5">
          Manage shipping settings within your company
        </p>
        {state.isLoading ? (
          <TableSkeleton singleButton />
        ) : state.shippingData.length !== 0 ? (
          <Fragment>
            <Card>
              <div className="flex md:justify-end pb-5">
                <Button
                  ariaLabel="shipping button"
                  text="Add New Shipping Fee"
                  onClick={openAddShippingModal}
                  primary
                  medium
                />
              </div>
              <Table columns={columns} className="mt-7">
                {state?.shippingData?.map((item: any, index: number) => {
                  return (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">{item.region}</td>
                      <td className="text-sm px-5 py-6">{item.amount}</td>

                      <td className="text-sm px-5 py-6 flex items-center gap-2">
                        <Icon name="edit" />
                        <Icon name="delete" color="#B7241B" />
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          </Fragment>
        ) : (
          <EmptyState
            title="No Shipping Found"
            subTitle="We couldn't find any shipping"
            image="/images/shipping-settings-empty.svg"
          >
            <Button
              text="Add New Shipping Fee"
              ariaLabel="Add shipping button"
              className="!w-[191px] !h-[48px]"
              onClick={openAddShippingModal}
              primary
            />
          </EmptyState>
        )}
        {/* <Modal
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
        </Modal> */}

        <AddShipping
          isModalOpen={state.isAddShippingModalOpen}
          closeModal={closeAddShippingModal}
          fetchShippingFees={fetchShippingFees}
        />
      </div>
    </Layout>
  );
};

export default SettlementAccounts;
