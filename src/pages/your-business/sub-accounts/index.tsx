import React, {
  useState,
  useEffect,
  Fragment,
  ChangeEvent,
  useCallback,
} from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import IconWrapper from "@/components/IconWrapper";
import Card from "@/components/Card";
import {
  changeModeToLive,
  deactivateSubAccount,
  getSubaccountHistory,
} from "@/services/sub-account";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/button";
import Dropdown from "@/components/Dropdown";
import Filter from "@/components/Filter";
import useClickEvent from "@/stores/useClickEvent";
import useFilter from "@/stores/useFilter";
import TableSkeleton from "@/components/TableSkeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { getBankDetails } from "@/services/user";
import WebPageTitle from "@/components/WebPageTitle";
import useSubaccount from "@/stores/useSubAccount";
import { useRouter } from "next/router";
import { getBanks, performNameCheck } from "@/services/bank";
import FloatingLabelInput from "@/components/floating-input";
import Modal from "@/components/modal";
import Loader from "@/components/loader";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  copyToClipboard,
  notifyError,
  notifySuccess,
  truncateText,
} from "@/util/utils";
import Link from "next/link";
import Pagination from "@/components/pagination";
import debounce from "@/util/debounce";
import { Spinner } from "@/components/Spinner";

interface SubaccountsProps {
  subaccountsHistory: any[];
  isLoading: boolean;
  showSubaccounts: boolean;
  dropdownIndex: null | number;
  showFilter: boolean;
  selectedOption: string;
  //   banks: [];
  accountNumber: string;
  mode: string | undefined;
}

const columns = [
  "s/n",
  "merchant name",
  "merchant key",
  "notification email",
  "mode",
  "message",
  "created at",
  "action",
];

const SubaccountHistory = () => {
  const router = useRouter();
  const { selectedItem, handleClick } = useClickEvent();
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState(0);
  const [modalType, setModalType] = useState("");
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const closeUpdateModal = () => setIsUpdateOpen(false);
  const closeModal = () => setIsModalOpen(false);
  const { updateSubAccountAmount } = useSubaccount();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    fetchSubaccountHistory,
    subaccounts,
    pagination,
    getSubaccountHistoryLoading,
  } = useSubaccount();

  const { showFilter, toggleFilter } = useFilter();

  const formik = useFormik({
    initialValues: {
      accountNumber: "",
      accountName: "",
      merchant_name: "",
      mode: undefined,
      contactEmail: "",
      percentage: "",
      description: "",
      siteName: "",
      websiteUrl: "",
      riskRating: "",
      category: "",
    },
    validationSchema: Yup.object().shape({
      accountNumber: Yup.string()
        .required("Account number is required!")
        .min(10, "Account number must be 10 digits"),
      accountName: Yup.string().required("Account name is required!"),
      merchant_name: Yup.string().required("Merchant name is required!"),
      mode: Yup.boolean().required("Mode is required!"),
      contactEmail: Yup.string()
        .email("Invalid email format")
        .required("Contact email is required!"),
      percentage: Yup.string().required("Percentage is required!"),
      siteName: Yup.string().required("Site name is required!"),
      websiteUrl: Yup.string()
        .url("Invalid URL format")
        .required("Website URL is required!"),
      riskRating: Yup.string().required("Risk rating is required!"),
      category: Yup.string().required("Category is required!"),
    }),
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
      updateSubaccount(resetForm);
    },
  });

  const [state, setState] = useState<SubaccountsProps>({
    subaccountsHistory: [],
    isLoading: false,
    showSubaccounts: false,
    dropdownIndex: null,
    showFilter: false,
    //     banks: [],
    selectedOption: "",
    accountNumber: "",
    mode: undefined,
  });
  // const accountNumber = formik.values.accountNumber;

  //   const fetchBanks = async () => {
  //     const banks = await getBanks();
  //     setState({ ...state, banks });
  //   };

  const handleModalChange = async () => {
    const payload = {
      id: activeId,
    };
    try {
      if (modalType === "live") {
        setIsModalOpen(false);
        const response = await changeModeToLive(payload);
        notifySuccess("Website is now live");
        fetchSubaccountHistory();
      } else {
        const response = await deactivateSubAccount(payload);
        setIsModalOpen(false);
        fetchSubaccountHistory();
      }
    } catch (error: any) {
      notifyError(error.message);
      setIsModalOpen(false);
    }
  };
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({
      ...state,
      selectedOption: value,
      [e.target.name]: e.target.value,
    });
  };

  // const nameCheck = async () => {
  //   const payload = {
  //     bank_code: state.selectedOption,
  //     account_number: accountNumber,
  //   };
  //   try {
  //     setState({ ...state, isLoading: true });
  //     const accountName = await performNameCheck(payload);
  //     formik.setFieldValue("accountName", accountName);
  //   } catch (error: any) {
  //     notifyError(error.message);
  //   } finally {
  //     setState({ ...state, isLoading: false });
  //   }
  // };

  const updateSubaccount = async (resetForm: () => void) => {
    setIsLoading(true);
    const payload = {
      account_number: formik.values.accountNumber,
      account_name: formik.values.accountName,
      merchant_name: formik.values.merchant_name,
      email: formik.values.contactEmail,
      mode: formik.values.mode,
      percentage: formik.values.percentage,
      description: formik.values.description,
      siteName: formik.values.siteName,
      websiteUrl: formik.values.websiteUrl,
      riskRating: formik.values.riskRating,
      category: formik.values.category,
      id: activeId,
    };
    try {
      const response = await updateSubAccountAmount(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      setIsUpdateOpen(false);
      fetchSubaccountHistory();
      resetForm();
    } catch (error: any) {
      notifyError(error.message);
      setIsLoading(false);
      setIsUpdateOpen(false);
      fetchSubaccountHistory();
      resetForm();
    }
  };

  const changeModal = async (id: any, type: string) => {
    setModalType(type);
    setActiveId(id);
    setIsModalOpen(true);
  };

  const updateModal = async (id: any) => {
    setActiveId(id);
    //     fetchBanks();
    setIsUpdateOpen(true);
  };

  //   useEffect(() => {
  //     fetchBankDetails();
  //   }, []);

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

  //   const fetchBankDetails = async () => {
  //     const bankDetails = await getBankDetails();
  //     setState(prevState => ({
  //       ...prevState,
  //       bankDetails,
  //       isLoading: false,
  //     }));
  //   };

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  useEffect(() => {
    fetchSubaccountHistory({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
    });
  }, [searchInput, currentPage]);

  // useEffect(() => {
  //   if (accountNumber.length === 10) {
  //     nameCheck();
  //   }
  // }, [accountNumber]);

  return (
    <>
      <Layout pageTitle="Subaccounts" icon="sub-accounts">
        <WebPageTitle title="Subaccounts| Ramp Merchant Portal" />
        <div>
          <h2 className="text-xl font-semibold">Manage Subaccounts</h2>
          <p className="text-sm pt-3 pb-5">
            Manage Subaccounts Within Your Company
          </p>
        </div>
        <div>
          {getSubaccountHistoryLoading ? (
            <Fragment>
              <TableSkeleton />
            </Fragment>
          ) : subaccounts?.length !== 0 ? (
            <Fragment>
              <Card className="mt-10">
                <div className="flex justify-end pb-5">
                  {/* <div className="flex gap-3">
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
                      plain
                    />
                  </div>

                  <div className="relative">
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
                  <Link href="/your-business/sub-accounts/create">
                    <Button
                      ariaLabel="Create New Subaccount"
                      text="Create New Sub Account"
                      primary
                      medium
                    />
                  </Link>
                </div>
                <div className="relative flex justify-end -mt-4">
                  <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                    <Filter filterCallback={fetchSubaccountHistory} />
                  </Dropdown>
                </div>
                <Table columns={columns} className="mt-7">
                  {subaccounts?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6 capitalize">
                        {item.merchant_name || "N/A"}
                      </td>
                      <td className="text-sm px-5 py-6 flex">
                        <span className="mr-1 sarepayPrimary text-sm">
                          XXXXXXXXXXXXXXXX
                        </span>
                        <Image
                          src="/images/dashboard/copy.svg"
                          className="cursor-pointer"
                          onClick={() => copyToClipboard(item.merchant_key)}
                          alt="Copy Icon"
                          width={15}
                          height={15}
                        />
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.email || "N/A"}
                      </td>
                      <td className="text-xs px-5 py-6">
                        <div
                          className={`text-center rounded-lg py-1 px-3 ${
                            item.mode === "Live"
                              ? "text-[green] bg-[#E9F7EF]"
                              : "text-danger bg-[#e0440326]"
                          }`}
                        >
                          {item.mode}
                        </div>
                      </td>
                      <td className="text-sm px-5 py-6">
                        {truncateText(item.message, 25) || "N/A"}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.created_at || "N/A"}
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
                              {/* <li
                                className="flex items-center pb-2 gap-2 hover:text-primary"
                                onClick={() => changeModal(item.id, "live")}
                              >
                                <IconWrapper
                                  src="/images/dashboard/collections/edit.svg"
                                  width={14}
                                  height={14}
                                  alt="Live icon"
                                />
                                <span>Live</span>
                              </li> */}
                              <li
                                className="flex items-center pb-2 gap-2 hover:text-primary"
                                onClick={() => updateModal(item.id)}
                              >
                                <IconWrapper
                                  src="/images/dashboard/collections/transaction.svg"
                                  width={14}
                                  height={14}
                                  alt="Transaction icon"
                                />
                                <span>Update</span>
                              </li>
                              <li
                                className="flex items-center gap-2 hover:text-primary"
                                onClick={() => changeModal(item.id, "disable")}
                              >
                                <IconWrapper
                                  src="/images/dashboard/collections/disable.svg"
                                  width={14}
                                  height={14}
                                  alt="Deactivate icon"
                                />
                                <span>Deactivate</span>
                              </li>
                              <li
                                className="mt-2 flex items-center pb-2 gap-2 hover:text-primary"
                                onClick={() =>
                                  router.push(
                                    `sub-accounts/transactions/${item.id}`
                                  )
                                }
                              >
                                <IconWrapper
                                  src="/images/dashboard/collections/edit.svg"
                                  width={14}
                                  height={14}
                                  alt="Live icon"
                                />
                                <span>Transaction</span>
                              </li>
                            </ul>
                          </Dropdown>
                        </div>
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
              title="No Sub Account found"
              subTitle="We couldn't find any Sub Account"
              image="/images/dashboard/your-business/subaccount-empty.svg"
            >
              <Button
                text="Add Subaccount"
                ariaLabel="Add Subaccount button"
                className="!w-[191px] !h-[48px]"
                onClick={() =>
                  router.push(`/your-business/sub-accounts/create`)
                }
                primary
              />
            </EmptyState>
          )}
        </div>
      </Layout>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex justify-center text-center">
          <div className="flex flex-col">
            <div className="flex justify-center">
              <IconWrapper
                src="/images/dashboard/collections/delete.svg"
                width={94}
                height={106}
                alt="Delete Icon"
              />
            </div>
            <p className="text-3xl font-bold py-2">Head up!</p>
            <p className="">Are you sure you want to continue?</p>
            <div className="flex justify-center items-center gap-3 mt-4">
              <Button
                text="Confirm"
                ariaLabel="Confirm button"
                onClick={() => handleModalChange()}
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

      <Modal isOpen={isUpdateOpen} onClose={closeUpdateModal}>
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-2 gap-5">
            <FloatingLabelInput
              label="Site Name"
              id="siteName"
              type="text"
              htmlFor="siteName"
              formik={formik}
              {...formik.getFieldProps("siteName")}
            />

            <FloatingLabelInput
              label="Website URL"
              id="websiteUrl"
              type="text"
              htmlFor="websiteUrl"
              formik={formik}
              {...formik.getFieldProps("websiteUrl")}
            />
            <FloatingLabelInput
              label="Merchant Name"
              id="merchant_name"
              type="text"
              htmlFor="merchant_name"
              formik={formik}
              {...formik.getFieldProps("merchant_name")}
            />
            <FloatingLabelInput
              label="Percentage"
              id="percentage"
              type="text"
              htmlFor="percentage"
              formik={formik}
              maxLength={10}
              {...formik.getFieldProps("percentage")}
            />
          </div>
          <div>
            <label className="font-semibold">
              Select Sub Account Mode Type
            </label>
            <select
              className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
              onChange={e => {
                formik.setFieldValue("mode", e.target.value === "true");
              }}
              name="mode"
              value={
                formik.values.mode === undefined
                  ? ""
                  : formik.values.mode
                  ? "true"
                  : "false"
              }
            >
              {formik.values.mode === undefined && (
                <option value="">--Select--</option>
              )}
              <option value="true">Live</option>
              <option value="false">Test</option>
            </select>
          </div>
          <FloatingLabelInput
            label="Contact Email"
            id="email"
            type="email"
            htmlFor="email"
            formik={formik}
            {...formik.getFieldProps("email")}
          />
          <p>
            If provided, this email address will get transaction notification
          </p>
          <FloatingLabelInput
            label="Risk Rating"
            id="riskRating"
            type="text"
            htmlFor="riskRating"
            formik={formik}
            {...formik.getFieldProps("riskRating")}
          />
          {/* <div className="mt-5">
            <label className="font-semibold">Select bank</label>
            <select
              className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
              onChange={handleChange}
            >
              <option disabled defaultValue="Select bank">
                Select bank
              </option>
              {state.banks.map((bank: any, index) => (
                <option key={index} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div> */}

          <div>
            <label className="font-semibold">Category</label>
            <select
              className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
              {...formik.getFieldProps("category")}
            >
              <option value="">--Select Category--</option>
              <option value="finance">Finance</option>
              <option value="ecommerce">E-commerce</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FloatingLabelInput
              label="Account number"
              id="accountNumber"
              type="text"
              htmlFor="accountNumber"
              formik={formik}
              maxLength={10}
              {...formik.getFieldProps("accountNumber")}
            />
            <div className="relative">
              <FloatingLabelInput
                label="Account name"
                id="accountName"
                type="text"
                htmlFor="accountName"
                formik={formik}
                {...formik.getFieldProps("accountName")}
                readOnly
              />
              {state.isLoading && (
                <div className="absolute right-2 top-5">
                  <span>
                    <Spinner />
                  </span>
                </div>
              )}
            </div>
          </div>
          <FloatingLabelInput
            label="Description"
            id="description"
            type="text"
            htmlFor="message"
            formik={formik}
            {...formik.getFieldProps("description")}
          />
          <Button
            className="text-white mt-4 text-xs sm:text-sm p-2 sm:p-3 rounded"
            text={isLoading ? <Loader /> : "Submit"}
            ariaLabel="Submit Button"
            disabled={!formik.isValid || isLoading}
            primary
          />
        </form>
      </Modal>
    </>
  );
};

export default SubaccountHistory;
