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
import { getUsers } from "@/services/settings";
import AddUser from "./add-user";
import Dropdown from "@/components/Dropdown";
import { SharedStateContext } from "@/context/sharedState";
import useClickEvent from "@/stores/useClickEvent";
import Icon from "@/components/icon";
import Modal from "@/components/modal";
import Loader from "@/components/loader";
import IconWrapper from "@/components/IconWrapper";
import { changeUserStatus } from "@/services/settings";
import { notifyError, notifySuccess } from "@/util/utils";
import WebPageTitle from "@/components/WebPageTitle";

interface StateProps {
  isLoading: boolean;
  users: any[];
  dropdownIndex: null | number;
  isInitialLoad: boolean;
}

const ManageUsers = () => {
  const router = useRouter();

  const { handleModalClick, sharedState } = useContext(SharedStateContext)!;
  const { handleClick } = useClickEvent();

  const [state, setState] = useState<StateProps>({
    isLoading: true,
    users: [],
    dropdownIndex: null,
    isInitialLoad: true,
  });

  const [isUpdateUser, setIsUpdateUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await getUsers();
      setState(prevState => ({
        ...prevState,
        users,
      }));
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

  const closeDropdown = () => {
    setState({
      ...state,
      dropdownIndex: null,
    });
    setState(prevState => ({
      ...prevState,
      dropdownIndex: null,
    }));
    setIsUpdateUser(false);
  };

  const handleDropdownToggle = (index: number | null, selectedItem: any) => {
    setState(prevState => ({
      ...prevState,
      dropdownIndex: state.dropdownIndex === index ? null : index,
    }));
    handleClick(selectedItem, true);
    setIsUpdateUser(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setIsUpdateUser(false);
  };

  const closeDisableModal = () => {
    sharedState.setShowModal(false);
  };

  const handleChangeUserStatus = async () => {
    try {
      setState(prevState => ({
        ...prevState,
        isLoading: true,
      }));
      const response = await changeUserStatus(sharedState?.selectedItem?.id);
      closeDisableModal();

      //@ts-ignore
      notifySuccess(response.message);
      fetchUsers();
    } catch (error: any) {
      closeDisableModal();
      notifyError(error.message);
    } finally {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
      }));
    }
  };

  const handleCreateUser = () => {
    setIsUpdateUser(false);
    openModal();
  };

  const columns = [
    "s/n",
    "full name",
    "email address",
    "date",
    "role",
    "status",
    "action",
  ];

  return (
    <Layout pageTitle="Manage Users" icon="user">
      <WebPageTitle title="Manage Users | Ramp Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer pb-5"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />
      <h2 className="text-xl font-semibold">Manage users</h2>
      <p className="text-sm pt-3 pb-5">Manage users within your company</p>
      {state.isLoading && state.isInitialLoad ? (
        <TableSkeleton singleButton />
      ) : state?.users?.length !== 0 ? (
        <Fragment>
          <Card>
            <div className="pb-5">
              <Button
                ariaLabel="Create User"
                text="Create New User"
                onClick={openModal}
                primary
                medium
              />
            </div>
            <Table columns={columns} className="mt-7">
              {state?.users?.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-b last:border-none border-grey-200"
                >
                  <td className="text-sm px-5 py-6">{index + 1}</td>
                  <td className="text-sm px-5 py-6">{`${item.firstname} ${item.lastname}`}</td>
                  <td className="text-sm px-5 py-6">{item.email}</td>
                  <td className="text-sm px-5 py-6">{item.created_at}</td>
                  <td className="text-sm px-5 py-6">{item.role}</td>
                  <td className="text-sm px-5 py-6">
                    <div
                      className={`text-center rounded-lg py-1 px-3 ${
                        item.status == "Active"
                          ? "text-success bg-[#E9F7EF]"
                          : "text-danger bg-[#e0440326]"
                      }`}
                    >
                      {item.status}
                    </div>
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
                      priority
                    />

                    <div className="flex justify-end relative">
                      <Dropdown
                        onOpen={state.dropdownIndex === index}
                        onClose={closeDropdown}
                        className="px-1"
                      >
                        <ul className="list-none">
                          <li
                            className="flex items-center gap-2 hover:text-primary"
                            onClick={() => handleModalClick(item, true)}
                          >
                            <Image
                              src={`/images/dashboard/collections/${
                                item.status === "Active"
                                  ? "disable.svg"
                                  : "enable.svg"
                              }`}
                              width={14}
                              height={14}
                              alt="Deactivate icon"
                            />
                            <span>
                              {item.status === "Active"
                                ? "Deactivate"
                                : "Activate"}
                            </span>
                          </li>
                          <li
                            className="flex items-center gap-2 hover:text-primary pt-5"
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
              ))}
            </Table>
          </Card>
          <Modal isOpen={sharedState.showModal} onClose={closeDisableModal}>
            <div className="flex justify-center text-center">
              <div className="flex flex-col items-center">
                <Icon name="warning" />

                <div className="mt-3">
                  <p className="text-3xl font-semibold py-2">Head up!</p>
                  <p className="">
                    Are you sure you want to&nbsp;
                    {sharedState?.selectedItem?.status === "Active"
                      ? "deactivate"
                      : "activate"}
                    &nbsp;this user?
                  </p>
                </div>

                <div className="flex justify-center items-center gap-3 mt-7">
                  <Button
                    text={state.isLoading ? <Loader /> : "Confirm"}
                    ariaLabel="Confirm button"
                    onClick={handleChangeUserStatus}
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
      ) : (
        <Fragment>
          <EmptyState
            title="No Users Found"
            subTitle="We couldn't find any users created for this account"
            iconName="user"
          >
            <Button
              ariaLabel="Create User"
              text="Create New User"
              onClick={handleCreateUser}
              primary
              medium
            />
          </EmptyState>
        </Fragment>
      )}
      <AddUser
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        fetchUsers={fetchUsers}
        isUpdateUser={isUpdateUser}
      />
    </Layout>
  );
};

export default ManageUsers;
