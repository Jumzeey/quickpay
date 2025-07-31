import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import Modal from "@/components/modal";
import TabButton from "@/components/TabButton";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createVirtualAccount } from "@/services/collections";
import { getSubaccountHistory } from "@/services/sub-account";
import {
  nigerianPhoneNumberSchema,
  notifyError,
  notifySuccess,
  removeCommasFromValue,
} from "@/util/utils";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import Loader from "../loader";

export const VIRTUAL_ACCOUNT_TYPES: { id: number; name: string; }[] = [
  { id: 1, name: 'Onetime' },
  { id: 2, name: 'Permanent' },
];

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
  currentStep: number;
}

type FormValues = {
  firstName: string;
  lastName: string;
  otherName: string;
  phoneNumber: string;
  businessName: string;
  rcNumber: string;
  bvn: string;
  dob: string;
  nin: string;
  amount: string;
};

const RequestVirtualAccount: React.FC<AddAccountProps> = ({
  isModalOpen,
  closeModal,
  fetchVirtualAccounts,
}) => {
  const initialValues: FormValues = {
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
  };

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
    currentStep: 0,
  });

  // Dynamic validation schema based on state
  const validationSchema = useMemo(() => {
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

    if (state.virtualType !== "Onetime") {
      return Yup.object().shape({
        firstName: requiredValidation("Personal", "First name is required!"),
        lastName: requiredValidation("Personal", "Last name is required!"),
        otherName: requiredValidation("Personal", "Other name is required!"),
        phoneNumber: nigerianPhoneNumberSchema,
        businessName: notRequiredValidation("Personal", "Business name is required!"),
        rcNumber: notRequiredValidation("Personal", "RC Number is required!"),
        bvn: Yup.string()
          .required("Bvn is required!")
          .min(11, "BVN should contain 11 digits"),
        nin: Yup.string()
          .required("Nin is required!")
          .min(11, "Nin should contain 11 digits"),
        dob: state.accountType === "Personal"
          ? Yup.string().required("Date of birth is required!")
          : Yup.string().notRequired(),
        amount: state.virtualType === "Onetime"
          ? Yup.string().required("Amount is required!")
          : Yup.string().notRequired(),
      });
    } else {
      return Yup.object().shape({
        amount: Yup.string().required("Amount is required!"),
      });
    }
  }, [state.virtualType, state.accountType]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
    reset,
    setValue,
    watch
  } = useFormValidation<FormValues>(validationSchema as Yup.ObjectSchema<any>, {
    defaultValues: initialValues,
    mode: 'onChange'
  });

  const handleOptionClick = (option: typeof VIRTUAL_ACCOUNT_TYPES[0]) => {
    setState((prev) => ({
      ...prev,
      virtualType: option.name,
      currentStep: 1,
      isLoading: false,
      accountType: option.name === "Permanent" ? "Personal" : "",
    }));
    reset(initialValues);
  };

  const resetState = () => {
    if (state.currentStep === 1) {
      setState(prev => ({
        ...prev,
        currentStep: 0,
        accountType: "",
        virtualType: "",
        businessType: "",
        selectedSubAccount: "",
        selectedCorporateAccountType: "",
        selectedChannel: "",
        isLoading: false,
      }));
      reset(initialValues);
    } else {
      closeModal();
      setState({
        banks: [],
        accountType: "",
        virtualType: "",
        businessType: "",
        subAccounts: [],
        selectedSubAccount: "",
        selectedCorporateAccountType: "",
        selectedChannel: "",
        isLoading: false,
        currentStep: 0,
      });
      reset(initialValues);
    }
  };

  useEffect(() => {
    if (state.businessType === "subaccount") {
      fetchSubAccounts();
    }
  }, [state.businessType]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const fetchSubAccounts = async () => {
    try {
      const response = await getSubaccountHistory();
      setState(prev => ({ ...prev, subAccounts: response.subaccounts }));
    } catch (error) {
      console.error("Failed to fetch sub-accounts:", error);
    }
  };

  const requestVirtualAccount = async (formValues: FormValues) => {
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
    } = formValues;

    const commonPayload = {
      type: state.accountType,
      virtual_account_type: state.virtualType,
      bvn,
      nin,
      phone_number: phoneNumber,
      business_type: state.businessType,
      subaccount_id: state.selectedSubAccount || undefined,
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
      setState(prev => ({ ...prev, isLoading: true }));
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
      resetState();
      await fetchVirtualAccounts();
    }
  };

  // Helper function to get form field props
  const getFieldProps = (fieldName: keyof FormValues) => {
    return {
      error: errors[fieldName]?.message,
      touched: touchedFields[fieldName],
      ...register(fieldName)
    };
  };

  return (
    <Modal
      title={state.currentStep === 0 ? "Select Virtual Account Type" : "Request Virtual Account"}
      isOpen={isModalOpen}
      onClose={resetState}
    >
      <div className="mt-5">
        {state.currentStep === 0 && (
          <ul className="space-y-2">
            {VIRTUAL_ACCOUNT_TYPES.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between font-semibold text-sm text-black dark:text-white py-5 ${option.id !== VIRTUAL_ACCOUNT_TYPES.length ? "border-b border-[#C4C4C452]" : ""
                    }`}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.name}
                  <Image
                    src="/images/arrow-right.svg"
                    alt="Arrow Image"
                    width={6}
                    height={8}
                    priority
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {state.currentStep === 1 && (
          <form onSubmit={handleSubmit(requestVirtualAccount)}>
            {state.virtualType && (
              <>
                {state.virtualType === "Onetime" ? (
                  <div className="space-y-6">
                    <FormInput
                      label="Amount"
                      id="amount"
                      type="text"
                      htmlFor="amount"
                      numberOnly
                      {...getFieldProps("amount")}
                    />

                    <FormSelect
                      onChange={handleChange}
                      name="selectedChannel"
                      id="selectedChannel"
                      htmlFor="selectedChannel"
                      value={state.selectedChannel}
                      label="Select channel"
                      options={[
                        { value: "Globus", label: "Globus" },
                        { value: "Wema", label: "Wema" },
                      ]}
                    />
                  </div>
                ) : (
                  <>
                    <TabButton
                      tabs={[
                        {
                          title: "Personal Account",
                          value: "Personal",
                          isActive: state.accountType === "Personal"
                        },
                        {
                          title: "Corporate Account",
                          value: "Corporate",
                          isActive: state.accountType === "Corporate"
                        },
                      ]}
                      onTabClick={(value) => {
                        // handleChange({
                        //   target: { name: "accountType", value },
                        // } as ChangeEvent<HTMLSelectElement>);
                        setState(prev => ({
                          ...prev,
                          accountType: value
                        }));
                      }}
                    />

                    <>
                      {state.accountType && (
                        <div className="mt-6">
                          {state.accountType === "Personal" ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="First name"
                                  id="firstName"
                                  type="text"
                                  htmlFor="firstName"
                                  maxLength={50}
                                  {...getFieldProps("firstName")}
                                />

                                <FormInput
                                  label="Last name"
                                  id="lastName"
                                  type="text"
                                  htmlFor="lastName"
                                  maxLength={50}
                                  {...getFieldProps("lastName")}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="Other name"
                                  id="otherName"
                                  type="text"
                                  htmlFor="otherName"
                                  maxLength={50}
                                  {...getFieldProps("otherName")}
                                />
                                <FormInput
                                  label="Phone number"
                                  id="phoneNumber"
                                  type="text"
                                  htmlFor="phoneNumber"
                                  maxLength={11}
                                  numberOnly
                                  {...getFieldProps("phoneNumber")}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="NIN"
                                  id="nin"
                                  type="text"
                                  htmlFor="nin"
                                  maxLength={11}
                                  numberOnly
                                  {...getFieldProps("nin")}
                                />

                                <FormInput
                                  label="BVN"
                                  id="bvn"
                                  type="text"
                                  htmlFor="bvn"
                                  maxLength={11}
                                  numberOnly
                                  {...getFieldProps("bvn")}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="Date of birth"
                                  id="dob"
                                  type="date"
                                  htmlFor="dob"
                                  {...getFieldProps("dob")}
                                />

                                <FormSelect
                                  onChange={handleChange}
                                  name="businessType"
                                  id="businessType"
                                  htmlFor="businessType"
                                  value={state.businessType}
                                  label="Select business type"
                                  options={[
                                    { label: "Main", value: "main" },
                                    { label: "Sub-account", value: "subaccount" }
                                  ]}
                                />
                              </div>

                              <FormSelect
                                onChange={handleChange}
                                name="selectedChannel"
                                id="selectedChannel"
                                htmlFor="selectedChannel"
                                value={state.selectedChannel}
                                label="Select channel"
                                options={Channels.map(
                                  ({ key, value }) => ({
                                    value: key,
                                    label: value,
                                  })
                                )}
                              />

                              {state.businessType === "subaccount" && (
                                <FormSelect
                                  onChange={handleChange}
                                  name="selectedSubAccount"
                                  id="selectedSubAccount"
                                  htmlFor="selectedSubAccount"
                                  value={state.selectedSubAccount}
                                  label="Select sub-account"
                                  options={
                                    state?.subAccounts?.map((option: any) => ({
                                      value: option.id,
                                      label: option.merchant_name,
                                    })) || []
                                  }
                                />
                              )}
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="Business name"
                                  id="businessName"
                                  type="text"
                                  htmlFor="businessName"
                                  {...getFieldProps("businessName")}
                                />
                                <FormInput
                                  label="RC Number"
                                  id="rcNumber"
                                  type="text"
                                  htmlFor="rcNumber"
                                  {...getFieldProps("rcNumber")}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="Phone number"
                                  id="phoneNumber"
                                  type="text"
                                  htmlFor="phoneNumber"
                                  maxLength={11}
                                  numberOnly
                                  {...getFieldProps("phoneNumber")}
                                />

                                <FormInput
                                  label="BVN"
                                  id="bvn"
                                  type="text"
                                  htmlFor="bvn"
                                  maxLength={11}
                                  numberOnly
                                  {...getFieldProps("bvn")}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                  label="NIN"
                                  id="nin"
                                  type="text"
                                  htmlFor="nin"
                                  maxLength={11}
                                  numberOnly
                                  {...getFieldProps("nin")}
                                />

                                <FormSelect
                                  onChange={handleChange}
                                  name="businessType"
                                  id="businessType"
                                  htmlFor="businessType"
                                  value={state.businessType}
                                  label="Select business type"
                                  options={[
                                    { label: "Main", value: "main" },
                                    { label: "Sub-account", value: "subaccount" }
                                  ]}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelect
                                  onChange={handleChange}
                                  name="selectedCorporateAccountType"
                                  id="selectedCorporateAccountType"
                                  htmlFor="selectedCorporateAccountType"
                                  value={state.selectedCorporateAccountType}
                                  label="Select corporate account type"
                                  options={CorporateAccountTypes.map(
                                    ({ key, value }) => ({
                                      value: key,
                                      label: value,
                                    })
                                  )}
                                />

                                <FormSelect
                                  onChange={handleChange}
                                  name="selectedChannel"
                                  id="selectedChannel"
                                  htmlFor="selectedChannel"
                                  value={state.selectedChannel}
                                  label="Select channel"
                                  options={Channels.map(
                                    ({ key, value }) => ({
                                      value: key,
                                      label: value,
                                    })
                                  )}
                                />
                              </div>

                              {state.businessType === "subaccount" && (
                                <FormSelect
                                  onChange={handleChange}
                                  name="selectedSubAccount"
                                  id="selectedSubAccount"
                                  htmlFor="selectedSubAccount"
                                  value={state.selectedSubAccount}
                                  label="Select sub-account"
                                  options={
                                    state?.subAccounts?.map((option: any) => ({
                                      value: option.id,
                                      label: option.merchant_name,
                                    })) || []
                                  }
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  </>
                )}
              </>
            )}

            <div className="w-40">
              <Button
                className="text-white mt-8 text-xs p-2 rounded"
                text={state.isLoading ? <Loader /> : "Request Account"}
                ariaLabel="Submit"
                disabled={state.isLoading}
                primary
                type="submit"
              />
            </div>
          </form>
        )}
      </div>
    </Modal >
  );
};

export default RequestVirtualAccount;
