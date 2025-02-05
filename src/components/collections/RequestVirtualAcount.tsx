import React, { useState, ChangeEvent, Fragment, useEffect } from "react";
import Button from "@/components/button";
import Modal from "@/components/modal";
import FloatingLabelInput from "@/components/floating-input";
import { createVirtualAccount } from "@/services/collections";
import { getSubaccountHistory } from "@/services/sub-account";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  nigerianPhoneNumberSchema,
  notifyError,
  notifySuccess,
  removeCommasFromValue,
} from "@/util/utils";
import Loader from "../loader";

const CorporateAccountTypes = [
  {
    key: "COMPANY",
    value: "Company",
  },
  {
    key: "BUSINESS_NAME",
    value: "Business Name",
  },
  {
    key: "INCORPORATED_TRUSTEES",
    value: "Incorporated Trustees",
  },
  {
    key: "LIMITED_PARTNERSHIP",
    value: "Limited Partnership",
  },
  {
    key: "LIMITED_LIABILITY_PARTNERSHIP",
    value: "Limited Liability Partnership",
  },
];

const Channels = [
  {
    key: "Globus",
    value: "Globus",
  },
  {
    key: "Wema",
    value: "Wema",
  },
  {
    key: "Mozfin",
    value: "Mozfin",
  },
];

interface AddAccountProps {
  isModalOpen: boolean;
  closeModal: () => void;
  fetchVirtualAccounts: () => void;
}

interface StateProps {
  banks: [];
  accountType: string;
  virtualType: string;
  businessType: string;
  subAccounts: any[];
  selectedSubAccount: string;
  selectedCorporateAccountType: string;
  selectedChannel: string;
  isLoading: boolean;
}

const RequestVirtualAccount: React.FC<AddAccountProps> = ({
  isModalOpen,
  closeModal,
  fetchVirtualAccounts,
}) => {
  const [state, setState] = useState<StateProps>({
    banks: [],
    accountType: "",
    virtualType: "",
    businessType: "",
    subAccounts: [],
    selectedSubAccount: "",
    selectedCorporateAccountType: "",
    selectedChannel: "",
    isLoading: false,
  });

  const notRequiredValidation = (accountType: string, errorMessage: string) => {
    if (state.accountType === accountType) {
      return Yup.string().notRequired();
    } else {
      return Yup.string().required(errorMessage);
    }
  };

  const requiredValidation = (accountType: string, errorMessage: string) => {
    if (state.accountType === accountType) {
      return Yup.string().required(errorMessage);
    } else {
      return Yup.string().notRequired();
    }
  };

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      otherName: "",
      phoneNumber: "",
      businessName: "",
      rcNumber: "",
      bvn: "",
      dob: "",
      nin: "",
      amount: "",
    },
    validationSchema:
      state.virtualType !== "Onetime"
        ? Yup.object().shape({
            firstName: requiredValidation(
              "Personal",
              "First name is required!"
            ),
            lastName: requiredValidation("Personal", "Last name is required!"),
            otherName: requiredValidation(
              "Personal",
              "Other name is required!"
            ),
            phoneNumber: nigerianPhoneNumberSchema,
            businessName: notRequiredValidation(
              "Personal",
              "Business name is required!"
            ),
            rcNumber: notRequiredValidation(
              "Personal",
              "RC Number is required!"
            ),
            bvn: Yup.string()
              .required("Bvn is required!")
              .min(11, "BVN should contain 11 digits"),
            nin: Yup.string()
              .required("Nin is required!")
              .min(11, "Nin should contain 11 digits"),
            dob:
              state.accountType === "Personal"
                ? Yup.string().required("Date of birth is required!")
                : Yup.string().notRequired(),
            amount:
              state.virtualType === "Onetime"
                ? Yup.string().required("Amount is required!")
                : Yup.string().notRequired(),
          })
        : Yup.object().shape({
            amount: Yup.string().required("Amount is required!"),
          }),

    validateOnMount: true,

    onSubmit: async () => {
      requestVirtualAccount();
    },
  });

  const resetState = () => {
    setState({
      ...state,
      isLoading: false,
      virtualType: "",
      accountType: "",
      businessType: "",
    });
    formik.setValues({
      firstName: "",
      lastName: "",
      otherName: "",
      phoneNumber: "",
      businessName: "",
      rcNumber: "",
      dob: "",
      amount: "",
      bvn: "",
      nin: "",
    });
  };

  useEffect(() => {
    if (state.businessType === "subaccount") {
      fetchSubAccounts();
    }
  }, [state.businessType]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({ ...state, [e.target.name]: value });
  };

  const fetchSubAccounts = async () => {
    const response = await getSubaccountHistory();
    setState({ ...state, subAccounts: response.subaccounts });
  };

  const requestVirtualAccount = async () => {
    const {
      firstName,
      lastName,
      otherName,
      phoneNumber,
      bvn,
      dob,
      nin,
      amount,
      businessName,
      rcNumber,
    } = formik.values;

    const commonPayload = {
      type: state.accountType,
      virtual_account_type: state.virtualType,
      bvn,
      nin,
      phone_number: phoneNumber,
      business_type: state.businessType,
      subaccount_id: state.selectedSubAccount
        ? state.selectedSubAccount
        : undefined,
      channel: state.selectedChannel,
    };
    const personalAccountPayload = {
      ...commonPayload,
      first_name: firstName,
      last_name: lastName,
      other_name: otherName,
      dob,
    };

    const corporateAccountPayload = {
      ...commonPayload,
      rc_number: rcNumber,
      business_name: businessName,
      corporate_account_type: state.selectedCorporateAccountType,
    };

    try {
      setState({ ...state, isLoading: true });
      let payloadDecider = {};

      if (state.virtualType === "Onetime") {
        payloadDecider = {
          virtual_account_type: state.virtualType,
          amount: removeCommasFromValue(amount),
          channel: state.selectedChannel,
        };
      } else if (state.accountType === "Personal") {
        payloadDecider = personalAccountPayload;
      } else {
        payloadDecider = corporateAccountPayload;
      }

      const response = await createVirtualAccount(payloadDecider);
      // @ts-ignore
      notifySuccess(response.message);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      closeModal();
      resetState();
      await fetchVirtualAccounts();
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="mt-5">
        <form onSubmit={formik.handleSubmit}>
          <label className="text-sm">Virtual account type</label>
          <select
            className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
            onChange={handleChange}
            name="virtualType"
            value={state.virtualType}
          >
            <option value="Virtual account type">
              --Virtual account type--
            </option>

            <option value="Onetime">Onetime</option>
            <option value="Permanent">Permanent</option>
          </select>

          {state.virtualType && (
            <Fragment>
              {state.virtualType === "Onetime" ? (
                <Fragment>
                  <FloatingLabelInput
                    label="Amount"
                    id="amount"
                    type="text"
                    htmlFor="amount"
                    formik={formik}
                    {...formik.getFieldProps("amount")}
                  />
                  <select
                    className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                    onChange={handleChange}
                    name="selectedChannel"
                    value={state.selectedChannel}
                  >
                    <option value="Channel">--Select channel--</option>
                    <option value="Globus">Globus</option>
                    <option value="Wema">Wema</option>
                  </select>
                </Fragment>
              ) : (
                <Fragment>
                  <label className="text-sm">Select Type</label>
                  <select
                    className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                    onChange={handleChange}
                    name="accountType"
                    value={state.accountType}
                  >
                    <option value="Account Type">--Select type--</option>
                    <option value="Personal">Personal</option>
                    <option value="Corporate">Corporate</option>
                  </select>

                  {state.accountType && (
                    <Fragment>
                      {state.accountType === "Personal" ? (
                        <Fragment>
                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="First name"
                              id="firstName"
                              type="text"
                              htmlFor="firstName"
                              formik={formik}
                              maxLength={10}
                              {...formik.getFieldProps("firstName")}
                            />

                            <FloatingLabelInput
                              label="Last name"
                              id="lastName"
                              type="text"
                              htmlFor="lastName"
                              formik={formik}
                              {...formik.getFieldProps("lastName")}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="Other name"
                              id="otherName"
                              type="text"
                              htmlFor="otherName"
                              formik={formik}
                              {...formik.getFieldProps("otherName")}
                            />
                            <FloatingLabelInput
                              label="Phone number"
                              id="phoneNumber"
                              type="text"
                              htmlFor="phoneNumber"
                              formik={formik}
                              maxLength={11}
                              {...formik.getFieldProps("phoneNumber")}
                              numberOnly
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="NIN"
                              id="nin"
                              type="text"
                              htmlFor="nin"
                              formik={formik}
                              maxLength={11}
                              {...formik.getFieldProps("nin")}
                              numberOnly
                            />

                            <FloatingLabelInput
                              label="BVN"
                              id="bvn"
                              type="text"
                              htmlFor="bvn"
                              formik={formik}
                              maxLength={11}
                              {...formik.getFieldProps("bvn")}
                              numberOnly
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="Date of birth"
                              id="dob"
                              type="date"
                              htmlFor="dob"
                              formik={formik}
                              {...formik.getFieldProps("dob")}
                            />
                            <select
                              className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                              onChange={handleChange}
                              name="businessType"
                              value={state.businessType}
                            >
                              <option value="Virtual account type">
                                --Business type--
                              </option>

                              <option value="main">Main</option>
                              <option value="subaccount">Sub-account</option>
                            </select>
                          </div>

                          <select
                            className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                            onChange={handleChange}
                            name="selectedChannel"
                            value={state.selectedChannel}
                          >
                            <option value="Corporate account type">
                              --Select channel--
                            </option>

                            {Channels.map(({ key, value }, index) => (
                              <option value={key} key={index}>
                                {value}
                              </option>
                            ))}
                          </select>

                          <div className="grid gris-cols-2 gap-4">
                            {state.businessType === "subaccount" && (
                              <select
                                className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                                onChange={handleChange}
                                name="selectedSubAccount"
                                value={state.selectedSubAccount}
                              >
                                <option value="Virtual account type">
                                  --Select sub-account--
                                </option>

                                {state?.subAccounts?.map((option: any) => (
                                  <option key={option.id} value={option.id}>
                                    {option.merchant_name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </Fragment>
                      ) : (
                        <Fragment>
                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="Business name"
                              id="businessName"
                              type="text"
                              htmlFor="businessName"
                              formik={formik}
                              {...formik.getFieldProps("businessName")}
                            />
                            <FloatingLabelInput
                              label="RC Number"
                              id="rcNumber"
                              type="text"
                              htmlFor="rcNumber"
                              formik={formik}
                              {...formik.getFieldProps("rcNumber")}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="Phone number"
                              id="phoneNumber"
                              type="text"
                              htmlFor="phoneNumber"
                              formik={formik}
                              maxLength={11}
                              {...formik.getFieldProps("phoneNumber")}
                              numberOnly
                            />

                            <FloatingLabelInput
                              label="BVN"
                              id="bvn"
                              type="text"
                              htmlFor="bvn"
                              formik={formik}
                              maxLength={11}
                              {...formik.getFieldProps("bvn")}
                              numberOnly
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FloatingLabelInput
                              label="NIN"
                              id="nin"
                              type="text"
                              htmlFor="nin"
                              formik={formik}
                              maxLength={11}
                              {...formik.getFieldProps("nin")}
                              numberOnly
                            />
                            <select
                              className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                              onChange={handleChange}
                              name="businessType"
                              value={state.businessType}
                            >
                              <option value="Virtual account type">
                                --Business type--
                              </option>

                              <option value="main">Main</option>
                              <option value="subaccount">Sub-account</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <select
                              className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                              onChange={handleChange}
                              name="selectedCorporateAccountType"
                              value={state.selectedCorporateAccountType}
                            >
                              <option value="Corporate account type">
                                --Select corporate account type--
                              </option>

                              {CorporateAccountTypes.map(
                                ({ key, value }, index) => (
                                  <option value={key} key={index}>
                                    {value}
                                  </option>
                                )
                              )}
                            </select>

                            <select
                              className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                              onChange={handleChange}
                              name="selectedChannel"
                              value={state.selectedChannel}
                            >
                              <option value="Corporate account type">
                                --Select channel--
                              </option>

                              {Channels.map(({ key, value }, index) => (
                                <option value={value} key={index}>
                                  {key}
                                </option>
                              ))}
                            </select>
                          </div>

                          {state.businessType === "subaccount" && (
                            <select
                              className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                              onChange={handleChange}
                              name="selectedSubAccount"
                              value={state.selectedSubAccount}
                            >
                              <option value="Virtual account type">
                                --Select sub-account--
                              </option>

                              {state?.subAccounts?.map((option: any) => (
                                <option key={option.id} value={option.id}>
                                  {option.merchant_name}
                                </option>
                              ))}
                            </select>
                          )}
                        </Fragment>
                      )}
                    </Fragment>
                  )}
                </Fragment>
              )}
            </Fragment>
          )}

          <Button
            className="text-white mt-2 text-xs p-2 rounded"
            text={state.isLoading ? <Loader /> : "Submit"}
            ariaLabel="Submit"
            disabled={!formik.isValid || state.isLoading}
            primary
          />
        </form>
      </div>
    </Modal>
  );
};

export default RequestVirtualAccount;
