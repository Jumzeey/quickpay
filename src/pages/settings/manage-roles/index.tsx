"use client";

import React, { useEffect, Fragment, useState, useContext } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import { useRouter } from "next/router";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";
import { getRoles } from "@/services/settings";
import Link from "next/link";
import useClickEvent from "@/stores/useClickEvent";
import WebPageTitle from "@/components/WebPageTitle";
import { notifyError, notifySuccess } from "@/util/utils";
import Modal from "@/components/modal";
import IconWrapper from "@/components/IconWrapper";
import Dropdown from "@/components/Dropdown";
import Icon from "@/components/icon";
import Loader from "@/components/loader";
import { SharedStateContext } from "@/context/sharedState";
import { deleteRole } from "@/services/settings";

interface StateProps {
  isLoading: boolean;
  isInitialLoad: boolean;
  roles: any[];
  dropdownIndex: null | number;
}

const ManageRoles = () => {
  const router = useRouter();
  const { handleModalClick, sharedState } = useContext(SharedStateContext)!;
  const { handleClick } = useClickEvent();

  const [state, setState] = useState<StateProps>({
    isLoading: true,
    isInitialLoad: true,
    roles: [],
    dropdownIndex: null,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const roles = await getRoles();
      setState({ ...state, roles });
    } catch (error: any) {
      notifyError(error.message);
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
    });
  };

  const closeModal = () => {
    sharedState.setShowModal(false);
  };

  const handleDeleteRole = async () => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
    }));
    try {
      const response = await deleteRole(sharedState.selectedItem.id);
      //@ts-ignore
      notifySuccess("Role deleted successfully");
      fetchRoles();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
      }));
      closeModal();
    }
  };

  const columns = [
    "s/n",
    "role name",
    "date created",
    "no of user",
    "permission count",
    "action",
  ];

  return (
    <Layout pageTitle="Manage Roles" icon="person">
      <WebPageTitle title="Manage Roles | Ramp Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />
      <h2 className="text-xl pt-5 font-semibold">Manage roles</h2>
      <p className="text-sm pt-3 pb-5">Manage roles within your company</p>
      {state.isLoading && state.isInitialLoad ? (
        <TableSkeleton />
      ) : state.roles?.length !== 0 ? (
        <Fragment>
          <Card>
            <div className="pb-5">
              <Button
                ariaLabel="Create Role"
                text="Create New Role"
                onClick={() => router.push("/settings/add-role")}
                primary
                medium
              />
            </div>
            <Table columns={columns} className="mt-7">
              {state.roles?.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-b last:border-none border-grey-200"
                >
                  <td className="text-sm px-5 py-6">{index + 1}</td>
                  <td className="text-sm px-5 py-6">{item.name}</td>
                  <td className="text-sm px-5 py-6">{item.created_at}</td>
                  <td className="text-sm px-5 py-6">{item.no_of_users}</td>
                  <td className="text-sm px-5 py-6">
                    {item.permissions.length}
                  </td>
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
                          <li>
                            <Link
                              href={`/settings/manage-roles/${item.id}`}
                              className="flex items-center gap-2 pb-5 hover:text-primary"
                            >
                              <IconWrapper
                                src="/images/dashboard/collections/transaction.svg"
                                width={14}
                                height={14}
                                alt="Transaction icon"
                              />
                              <span>View permissions</span>
                            </Link>
                          </li>
                          <li
                            className="flex items-center gap-2 pb-5 hover:text-primary"
                            onClick={() => handleModalClick(item, true)}
                          >
                            <Icon name="delete" color="#EB5757" />
                            <span>delete</span>
                          </li>

                          <Link href="/settings/update-role">
                            <li
                              className="flex items-center gap-2 hover:text-primary"
                              // onClick={handleClick()}
                            >
                              <IconWrapper
                                src="/images/dashboard/collections/edit.svg"
                                width={14}
                                height={14}
                                alt="Edit icon"
                              />
                              <span>Edit</span>
                            </li>
                          </Link>
                        </ul>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
          <Modal isOpen={sharedState.showModal} onClose={closeModal}>
            <div className="flex justify-center text-center">
              <div className="flex flex-col items-center">
                <Icon name="warning" />

                <div className="mt-3">
                  <p className="text-3xl font-semibold py-2">Head up!</p>
                  <p className="">
                    Are you sure you want to delete this role?
                    <span className="font-semibold">
                      ({sharedState?.selectedItem?.name})
                    </span>
                  </p>
                </div>

                <div className="flex justify-center items-center gap-3 mt-7">
                  <Button
                    text={state.isLoading ? <Loader /> : "Confirm"}
                    ariaLabel="Confirm button"
                    onClick={handleDeleteRole}
                    disabled={state.isLoading}
                    primary
                    small
                  />
                  <Button
                    text="Cancel"
                    ariaLabel="Cancel button"
                    onClick={closeModal}
                    plain
                    small
                  />
                </div>
              </div>
            </div>
          </Modal>
        </Fragment>
      ) : (
        <Fragment>
          <EmptyState
            title="No Roles Created"
            subTitle="We couldn't find any roles created on this account"
            iconName="person"
          >
            <Link href="/settings/add-role">
              <Button
                ariaLabel="Create Role"
                text="Create New Role"
                primary
                medium
              />
            </Link>
          </EmptyState>
        </Fragment>
      )}
    </Layout>
  );
};

export default ManageRoles;
