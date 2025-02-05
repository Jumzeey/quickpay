import React, { useState, useEffect, ChangeEvent } from "react";
import Button from "@/components/button";
import Layout from "@/components/layout";
import FloatingLabelInput from "@/components/floating-input";
import { getBanks, performNameCheck } from "@/services/bank";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import {
  notifyError,
  notifySuccess,
  removeCommasFromValue,
} from "@/util/utils";
import useSubAccount from "@/stores/useSubAccount";
import Loader from "@/components/loader";
import Card from "@/components/Card";
import Image from "next/image";
import { Spinner } from "@/components/Spinner";

interface StateProps {
  merchant_name: string;
  mode: boolean | undefined;
  contactEmail: string;
  amount: string;
  banks: [];
  selectedOption: string;
  accountName: string;
  percentage: string;
  message: string;
  accountNumber: string;
  isLoading: boolean;
}

const SubAccountForm: React.FC = () => {
  const router = useRouter();
  const { postSubAccountAmount } = useSubAccount();
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      accountNumber: "",
      accountName: "",
      amount: "",
      merchant_name: "",
      mode: undefined,
      contactEmail: "",
      percentage: "",
      message: "",
    },
    validationSchema: Yup.object().shape({
      accountNumber: Yup.string()
        .required("Account number is required!")
        .min(10, "Account number must be 10 digits"),
      accountName: Yup.string().required("Account name is required!"),
      amount: Yup.string().required("Amount is required!"),
      merchant_name: Yup.string().required("Merchant name is required!"),
      mode: Yup.boolean().required("Mode is required!"),
      contactEmail: Yup.string()
        .email("Invalid email format")
        .required("Contact email is required!"),
      percentage: Yup.string().required("Percentage is required!"),
    }),
    validateOnMount: true,
    onSubmit: async () => {
      postDisbursement();
    },
  });

  const [state, setState] = useState<StateProps>({
    banks: [],
    selectedOption: "",
    accountNumber: "",
    accountName: "",
    amount: "",
    merchant_name: "",
    mode: undefined,
    contactEmail: "",
    percentage: "",
    message: "",
    isLoading: false,
  });

  const accountNumber = formik.values.accountNumber;

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (accountNumber.length === 10) {
      nameCheck();
    }
  }, [accountNumber]);

  const fetchBanks = async () => {
    const banks = await getBanks();
    setState({ ...state, banks });
  };

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({ ...state, selectedOption: value });
  };

  const postDisbursement = async () => {
    setIsLoading(true);
    const payload = {
      amount: removeCommasFromValue(formik.values.amount),
      bank_code: state.selectedOption,
      account_number: formik.values.accountNumber,
      account_name: formik.values.accountName,
      merchant_name: formik.values.merchant_name,
      email: formik.values.contactEmail,
      mode: formik.values.mode,
      percentage: formik.values.percentage,
      message: formik.values.message,
    };
    try {
      const response = await postSubAccountAmount(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      router.push({
        pathname: "/your-business/sub-accounts",
      });
    } catch (error: any) {
      notifyError(error.message);
      setIsLoading(false);
    }
  };

  const nameCheck = async () => {
    const payload = {
      bank_code: state.selectedOption,
      account_number: accountNumber,
    };
    try {
      setState({ ...state, isLoading: true });
      const accountName = await performNameCheck(payload);
      formik.setFieldValue("accountName", accountName);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState({ ...state, isLoading: false });
    }
  };

  return (
    <Layout pageTitle="Sub Account" icon="sub-accounts">
      <div className="flex justify-between items-center p-4 sm:p-6 lg:p-12">
        <Image
          src="/images/arrow-back.svg"
          className="cursor-pointer"
          width={36}
          height={36}
          onClick={() => router.back()}
          alt="back icon"
        />
      </div>
      <div className="flex justify-center mt-4 sm:mt-6 lg:mt-2">
        <Card extraPadding>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="font-semibold">
                Select Sub Account Mode Type
              </label>
              <select
                className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                onChange={(e) => {
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
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
            <FloatingLabelInput
              label="Contact Email"
              id="contactEmail"
              type="text"
              htmlFor="contactEmail"
              formik={formik}
              {...formik.getFieldProps("contactEmail")}
            />
            <div>
              <label className="text-sm block mb-2">Select bank</label>
              <select
                className="h-[45px] sm:h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm sm:text-base"
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mt-4">
              <div>
                <FloatingLabelInput
                  label="Account number"
                  id="accountNumber"
                  type="text"
                  htmlFor="accountNumber"
                  formik={formik}
                  maxLength={10}
                  {...formik.getFieldProps("accountNumber")}
                />
              </div>
              <div>
                <FloatingLabelInput
                  label="Amount"
                  id="amount"
                  type="text"
                  htmlFor="amount"
                  formik={formik}
                  maxLength={10}
                  {...formik.getFieldProps("amount")}
                />
              </div>
            </div>
            <div className="relative mt-4">
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
            <FloatingLabelInput
              label="Message"
              id="message"
              type="text"
              htmlFor="message"
              formik={formik}
              {...formik.getFieldProps("message")}
            />
            <Button
              className="text-white mt-4 text-xs sm:text-sm p-2 sm:p-3 rounded"
              text={isLoading ? <Loader /> : "Create Sub Account"}
              ariaLabel="Create Sub Account Button"
              disabled={!formik.isValid || state.isLoading}
              primary
            />
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default SubAccountForm;
