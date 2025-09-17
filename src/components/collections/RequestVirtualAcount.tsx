import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import Modal from "@/components/modal";
import TabButton from "@/components/TabButton";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createVirtualAccount } from "@/services/collections";
import { getSubaccountHistory } from "@/services/sub-account";
import {
  notifyError,
  notifyInfo,
  notifySuccess
} from "@/util/utils";
import Image from "next/image";
import React, { ChangeEvent, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";
import Loader from "../loader";

export const VIRTUAL_ACCOUNT_TYPES: { id: number; name: string; }[] = [
  { id: 1, name: 'Onetime' },
  { id: 2, name: 'Permanent' },
];

export const VIRTUAL_ACCOUNT_CURRENCIES: { value: string; label: string; disabled?: boolean }[] = [
  { value: "NGN", label: "₦ Nigerian Naira (NGN)" },
  { value: "USD", label: "$ US Dollar (USD)", disabled: true },
  { value: "EUR", label: "€ Euro (EUR)", disabled: true },
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

// const Channels = [
//   {
//     key: "Globus",
//     value: "Globus",
//   },
//   {
//     key: "Wema",
//     value: "Wema",
//   },
//   {
//     key: "Mozfin",
//     value: "Mozfin",
//   },
// ];

interface AddAccountProps {
  isModalOpen: boolean;
  closeModal: () => void;
  fetchVirtualAccounts: () => void;
}

interface StateProps {
  // banks: [];
  accountType: "Personal" | "Corporate";
  virtualType: string;
  // business_type: string;
  // subAccounts: any[];
  currency: string;
  // selectedSubAccount: string;
  // selectedCorporateAccountType: string;
  // selectedChannel: string;
  isLoading: boolean;
  currentStep: number;
}

export type VirtualAccountFormValues = {
  // type: string;
  // Personal account fields
  first_name?: string;
  last_name?: string;
  other_name?: string;
  dob?: string;
  // amount?: string;

  // Corporate account fields
  business_name?: string;
  rc_number?: string;

  // Common fields
  // phone_number: string;
  nin: string;
  bvn: string;
  // business_type: "main" | "subaccount";
  // subaccount_id?: string;
};

const RequestVirtualAccount: React.FC<AddAccountProps> = ({
  isModalOpen,
  closeModal,
  fetchVirtualAccounts,
}) => {
  const initialValues: VirtualAccountFormValues = {
    first_name: "",
    last_name: "",
    other_name: "",
    // phone_number: "",
    bvn: "",
    nin: "",
    dob: "",
    business_name: "",
    rc_number: "",
    // business_type: "main",
    // subaccount_id: ""
  };

  const [state, setState] = useState<StateProps>({
    // // banks: [],
    // accountType: "Personal",
    // virtualType: "",
    // // business_type: "",
    // // subAccounts: [],
    // // selectedSubAccount: "",
    // // selectedCorporateAccountType: "",
    // // selectedChannel: "",
    // subAccounts: [],
    // isLoading: false,
    // currentStep: 0,
    accountType: "Personal",
    virtualType: "",
    currency: "",
    // subAccounts: [],
    isLoading: false,
    currentStep: 0,
  });

  const validationSchema = useMemo(() => {
    const baseSchema = {
      // phone_number: Yup.string().required("Phone number is required"),
      bvn: Yup.string()
        .required("BVN is required")
        .min(11, "BVN should contain 11 digits")
        .max(11, "BVN should contain 11 digits"),
      nin: Yup.string()
        .required("NIN is required")
        .min(11, "NIN should contain 11 digits")
        .max(11, "NIN should contain 11 digits"),
      // business_type: Yup.string().required("Business type is required")
    };

    if (state.accountType === "Personal") {
      return Yup.object().shape({
        ...baseSchema,
        first_name: Yup.string().required("First name is required"),
        last_name: Yup.string().required("Last name is required"),
        other_name: Yup.string().required("Other name is required"),
        dob: Yup.string().required("Date of birth is required"),
        // subaccount_id: Yup.string().when('business_type', {
        //   is: (val: string) => val === 'subaccount',
        //   then: () => Yup.string().required("Sub-account is required"),
        //   otherwise: () => Yup.string().notRequired()
        // })
      });
    } else if (state.accountType === "Corporate") {
      return Yup.object().shape({
        ...baseSchema,
        business_name: Yup.string().required("Business name is required"),
        rc_number: Yup.string().required("RC Number is required"),
        // subaccount_id: Yup.string().when('business_type', {
        //   is: (val: string) => val === 'subaccount',
        //   then: () => Yup.string().required("Sub-account is required"),
        //   otherwise: () => Yup.string().notRequired()
        // })
      });
    }

    return Yup.object().shape(baseSchema);
  }, [state.accountType]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useFormValidation<VirtualAccountFormValues>(validationSchema as Yup.ObjectSchema<any>, {
    defaultValues: initialValues,
    mode: 'onChange'
  });
  // const business_type = watch('business_type');

  const handleCurrencySelect = (currency: string) => {
    setState(prev => ({
      ...prev,
      currency,
      currentStep: 2,
    }));
  };

  const handleOptionClick = (option: typeof VIRTUAL_ACCOUNT_TYPES[0]) => {
    if (option.name === "Onetime") {
      notifyInfo("Onetime virtual accounts are not supported at the moment.");
      return;
    }
    setState((prev) => ({
      ...prev,
      virtualType: option.name,
      currentStep: 1,
      isLoading: false,
    }));
    reset();
  };

  const resetAndClose = () => {
    setState(prev => ({
      ...prev,
      virtualType: "Permanent",
      // currency: "",
      accountType: "Personal",
      // subAccounts: [],
      isLoading: false,
      currentStep: prev.currentStep === 0 ? 0 : prev.currentStep - 1,
    }));
    reset();

    if (state.currentStep === 0) {
      closeModal();
    }
  };

  // useEffect(() => {
  //   if (business_type === "subaccount") {
  //     fetchSubAccounts();
  //   }
  // }, [business_type]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const fetchSubAccounts = async () => {
    try {
      const response = await getSubaccountHistory();
      setState(prev => ({ ...prev, subAccounts: response.subaccounts || [] }));
    } catch (error) {
      console.error("Failed to fetch sub-accounts:", error);
    }
  };

  const requestVirtualAccount = async (values: VirtualAccountFormValues) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const payload = {
        type: state.accountType,
        virtual_account_type: "Permanent",
        // phone_number: values.phone_number,
        bvn: values.bvn,
        nin: values.nin,
        // business_type: values.business_type,
        // ...(values.business_type === "subaccount" && {
        //   subaccount_id: values.subaccount_id
        // }),
        currency: state.currency,

        // Personal accounts
        ...(state.accountType === "Personal" && {
          first_name: values.first_name,
          last_name: values.last_name,
          other_name: values.other_name,
          dob: values.dob,
          // amount: removeCommasFromValue(values.amount || "0"),
        }),

        // Corporate accounts
        ...(state.accountType === "Corporate" && {
          business_name: values.business_name,
          rc_number: values.rc_number
        })
      };

      const response = await createVirtualAccount(payload);
      // @ts-ignore
      notifySuccess(response.message || "Virtual account created successfully");
      resetAndClose();
      closeModal();
      await fetchVirtualAccounts();
    } catch (error: any) {
      notifyError(error.message || "Failed to create virtual account");
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getModalTitle = () => {
    switch (state.currentStep) {
      case 0:
        return "Select Virtual Account Currency";
      case 1:
        return "Select Virtual Account Type";
      case 2:
        return "Request Virtual Account";
      default:
        return "Request Virtual Account";
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      isOpen={isModalOpen}
      onClose={resetAndClose}
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
          <ul className="space-y-2">
            {VIRTUAL_ACCOUNT_CURRENCIES.map((currency, index) => (
              <li key={currency.value}>
                <button
                  type="button"
                  disabled={!!currency.disabled}
                  className={`w-full flex items-center justify-between font-semibold text-sm 
                      ${currency.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-black dark:text-white cursor-pointer'}
                      py-5 ${index !== VIRTUAL_ACCOUNT_CURRENCIES.length - 1 ? "border-b border-[#C4C4C452]" : ""}`}
                  onClick={() => !currency.disabled && handleCurrencySelect(currency.value)}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{currency.label.split(' ')[0]}</span>
                    <span>{currency.label.split(' ').slice(1).join(' ')}</span>
                  </div>
                  {!currency.disabled ? (
                    <Image
                      src="/images/arrow-right.svg"
                      alt="Arrow Image"
                      width={6}
                      height={8}
                      priority
                    />
                  ) : (
                    <span className="text-xs text-gray-400">(Coming soon)</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {state.currentStep === 2 && (
          <form onSubmit={handleSubmit(requestVirtualAccount)}>
            {state.virtualType && (
              <>
                {state.virtualType === "Onetime" ? (
                  <div className="space-y-6">
                    {/* <Controller
                      name="amount"
                      control={control}
                      render={({ field }) => (
                        <FormInput
                          label="Amount"
                          id="amount"
                          type="text"
                          htmlFor="amount"
                          numberOnly
                          error={errors.amount?.message}
                          touched={!!errors.amount}
                          {...field}
                        />
                      )}
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
                    /> */}
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
                        setState(prev => ({
                          ...prev,
                          accountType: value as "Personal" | "Corporate"
                        }));
                      }}
                    />

                    <div className="flex items-center text-sm mt-6">
                      <span className="text-gray-500 mr-2">Currency:</span>
                      <span className="font-medium">{state.currency}</span>
                      <span className="mx-4">•</span>
                      <span className="text-gray-500 mr-2">Type:</span>
                      <span className="font-medium">{state.virtualType}</span>
                    </div>

                    <div className="mt-6">
                      {state.accountType === "Personal" ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                              name="first_name"
                              control={control}
                              render={({ field }) => (
                                <FormInput
                                  label="First name"
                                  id="first_name"
                                  type="text"
                                  htmlFor="first_name"
                                  maxLength={50}
                                  error={errors.first_name?.message}
                                  touched={!!errors.first_name}
                                  {...field}
                                />
                              )}
                            />

                            <Controller
                              name="last_name"
                              control={control}
                              render={({ field }) => (
                                <FormInput
                                  label="Last name"
                                  id="last_name"
                                  type="text"
                                  htmlFor="last_name"
                                  maxLength={50}
                                  error={errors.last_name?.message}
                                  touched={!!errors.last_name}
                                  {...field}
                                />
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                              name="other_name"
                              control={control}
                              render={({ field }) => (
                                <FormInput
                                  label="Other name"
                                  id="other_name"
                                  type="text"
                                  htmlFor="other_name"
                                  maxLength={50}
                                  error={errors.other_name?.message}
                                  touched={!!errors.other_name}
                                  {...field}
                                />
                              )}
                            />

                            {/* <Controller
                              name="phone_number"
                              control={control}
                              render={({ field }) => (
                                <FormPhoneInput
                                  label="Phone number"
                                  id="phone_number"
                                  htmlFor="phone_number"
                                  error={errors.phone_number?.message}
                                  touched={!!errors.phone_number}
                                  {...field}
                                />
                              )}
                            /> */}
                            <Controller
                              name="dob"
                              control={control}
                              render={({ field }) => (
                                <FormInput
                                  label="Date of birth"
                                  id="dob"
                                  type="date"
                                  htmlFor="dob"
                                  error={errors.dob?.message}
                                  touched={!!errors.dob}
                                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split("T")[0]}
                                  {...field}
                                />
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                              name="nin"
                              control={control}
                              render={({ field }) => (
                                <FormInput
                                  label="NIN"
                                  id="nin"
                                  type="text"
                                  htmlFor="nin"
                                  maxLength={11}
                                  numberOnly
                                  error={errors.nin?.message}
                                  touched={!!errors.nin}
                                  {...field}
                                />
                              )}
                            />

                            <Controller
                              name="bvn"
                              control={control}
                              render={({ field }) => (
                                <FormInput
                                  label="BVN"
                                  id="bvn"
                                  type="text"
                                  htmlFor="bvn"
                                  maxLength={11}
                                  numberOnly
                                  error={errors.bvn?.message}
                                  touched={!!errors.bvn}
                                  {...field}
                                />
                              )}
                            />


                          </div>

                          {/* <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => (
                              <FormInput
                                label="Amount"
                                id="amount"
                                type="text"
                                htmlFor="amount"
                                numberOnly
                                error={errors.amount?.message}
                                touched={!!errors.amount}
                                {...field}
                              />
                            )}
                          /> */}

                          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                              name="business_type"
                              control={control}
                              render={({ field }) => (
                                <FormSelect
                                  label="Business Type"
                                  id="business_type"
                                  htmlFor="business_type"
                                  error={errors.business_type?.message}
                                  touched={!!errors.business_type}
                                  options={[
                                    { label: "Main", value: "main" },
                                    { label: "Sub-account", value: "subaccount" }
                                  ]}
                                  {...field}
                                />
                              )}
                            />

                            {business_type === "subaccount" && (
                              <Controller
                                name="subaccount_id"
                                control={control}
                                render={({ field }) => (
                                  <FormSelect
                                    label="Select Sub-account"
                                    id="subaccount_id"
                                    htmlFor="subaccount_id"
                                    error={errors?.subaccount_id?.message}
                                    touched={!!errors?.subaccount_id}
                                    options={
                                      state.subAccounts.map((option: any) => ({
                                        value: option.id,
                                        label: option.merchant_name,
                                      })) || []
                                    }
                                    {...field}
                                  />
                                )}
                              />
                            )}
                          </div> */}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Controller
                                name="business_name"
                                control={control}
                                render={({ field }) => (
                                  <FormInput
                                    label="Business Name"
                                    id="business_name"
                                    type="text"
                                    htmlFor="business_name"
                                    error={errors.business_name?.message}
                                    touched={!!errors.business_name}
                                    {...field}
                                  />
                                )}
                              />

                              <Controller
                                name="rc_number"
                                control={control}
                                render={({ field }) => (
                                  <FormInput
                                    label="RC Number"
                                    id="rc_number"
                                    type="text"
                                    htmlFor="rc_number"
                                    error={errors.rc_number?.message}
                                    touched={!!errors.rc_number}
                                    {...field}
                                  />
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* <Controller
                                name="phone_number"
                                control={control}
                                render={({ field }) => (
                                  <FormPhoneInput
                                    label="Phone number"
                                    id="phone_number"
                                    htmlFor="phone_number"
                                    error={errors.phone_number?.message}
                                    touched={!!errors.phone_number}
                                    {...field}
                                  />
                                )}
                              /> */}
                              <Controller
                                name="nin"
                                control={control}
                                render={({ field }) => (
                                  <FormInput
                                    label="NIN"
                                    id="nin"
                                    type="text"
                                    htmlFor="nin"
                                    maxLength={11}
                                    numberOnly
                                    error={errors.nin?.message}
                                    touched={!!errors.nin}
                                    {...field}
                                  />
                                )}
                              />

                              <Controller
                                name="bvn"
                                control={control}
                                render={({ field }) => (
                                  <FormInput
                                    label="BVN"
                                    id="bvn"
                                    type="text"
                                    htmlFor="bvn"
                                    maxLength={11}
                                    numberOnly
                                    error={errors.bvn?.message}
                                    touched={!!errors.bvn}
                                    {...field}
                                  />
                                )}
                              />
                            </div>

                            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Controller
                                name="business_type"
                                control={control}
                                render={({ field }) => (
                                  <FormSelect
                                    label="Business Type"
                                    id="business_type"
                                    htmlFor="business_type"
                                    error={errors.business_type?.message}
                                    touched={!!errors.business_type}
                                    options={[
                                      { label: "Main", value: "main" },
                                      { label: "Sub-account", value: "subaccount" }
                                    ]}
                                    {...field}
                                  />
                                )}
                              />

                              {business_type === "subaccount" && (
                                <Controller
                                  name="subaccount_id"
                                  control={control}
                                  render={({ field }) => (
                                    <FormSelect
                                      label="Select Sub-account"
                                      id="subaccount_id"
                                      htmlFor="subaccount_id"
                                      error={errors?.subaccount_id?.message}
                                      touched={!!errors?.subaccount_id}
                                      options={
                                        state.subAccounts.map((option: any) => ({
                                          value: option.id,
                                          label: option.merchant_name,
                                        })) || []
                                      }
                                      {...field}
                                    />
                                  )}
                                />
                              )}
                            </div> */}
                          </div>
                        </>
                      )}
                    </div>
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
