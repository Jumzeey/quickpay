import React, { useState, useEffect, ChangeEvent } from "react";
import Button from "@/components/button";
import Modal from "@/components/modal";
import FloatingLabelInput from "@/components/floating-input";
import { getBanks, performNameCheck } from "@/services/bank";
import useDisbursement from "@/stores/useDisbursement";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { notifyError, notifySuccess, removeCommasFromValue } from "@/util/utils";
import { Spinner } from "@/components/Spinner";
import Loader from "@/components/loader";
import Layout from "@/components/layout";
import Card from "@/components/Card";
import WebPageTitle from "@/components/WebPageTitle";

interface Bank {
  code: string;
  name: string;
}

interface StateProps {
  amount: string;
  banks: Bank[];
  selectedOption: string;
  accountName: string;
  isLoading: boolean;
  isSubmitting: boolean;
}

const AddDisbursementAccount: React.FC = () => {
  const { postDisbursementAccount, disburse } = useDisbursement();
  const [bankCode, setBankCode] = useState("");
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      accountNumber: "",
      accountName: "",
      amount: "",
    },
    validationSchema: Yup.object().shape({
      accountNumber: Yup.string()
        .required("Account number is required!")
        .matches(
          /^\d{10}$/,
          "Account number must be exactly 10 digits and contain only numbers"
        ),
      accountName: Yup.string().required("Account name is required!"),
      amount: Yup.string()
        .required("Amount is required!"),
    }),
    validateOnMount: true,
    onSubmit: async () => {
      createDisbursementAccount();
    },
  });

  const [state, setState] = useState<StateProps>({
    banks: [],
    selectedOption: "",
    accountName: "",
    isLoading: false,
    isSubmitting: false,
    amount: "",
  });

  const getBankName = (code: any) => {
    const bank = state.banks.find((bank) => bank.code === code);
    return bank ? bank.name : "Bank not found";
  };

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
    setBankCode(e.target.value);
    const { value } = e.target;
    setState({ ...state, selectedOption: value });
  };

  const createDisbursementAccount = async () => {
    const payload = {
      bank_code: state.selectedOption,
      account_number: formik.values.accountNumber,
      account_name: formik.values.accountName,
      amount: removeCommasFromValue(formik.values.amount),
    };
    try {
      setState({ ...state, isSubmitting: true });
      const response = await postDisbursementAccount(payload);
      // @ts-ignore
      notifySuccess(response.message);
      localStorage.setItem("user-bank", getBankName(bankCode));
      router.push({
        pathname: "/disbursements/disburse/interbank-otp",
      });
    } catch (error: any) {
      notifyError(error.message);
    }finally {
      setState({ ...state, isSubmitting: false});
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
    <Layout pageTitle="Disbursement" icon="disbursement">
      <WebPageTitle title="Disbursement | Sarepay Merchant Portal" />
      <div className="flex justify-center">
        <Card extraPadding>
          <form onSubmit={formik.handleSubmit}>
            <h1 className="font-semibold mb-10">Make New Interbank Disbursement</h1>
            <label className="text-sm">Select bank</label>
            <select
              className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
              onChange={handleChange}
            >
              <option value="Select Type">--Select bank--</option>
              {state.banks.map((bank: any, index) => (
                <option key={index} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <FloatingLabelInput
              label="Amount"
              id="amount"
              type="text"
              htmlFor="amount"
              formik={formik}
              {...formik.getFieldProps("amount")}
              numberOnly
            />
            <FloatingLabelInput
              label="Account number"
              id="accountNumber"
              type="text"
              htmlFor="accountNumber"
              formik={formik}
              maxLength={10}
              {...formik.getFieldProps("accountNumber")}
              numberOnly
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
                <div className="absolute left-[90%] top-5">
                  <span>
                    <Spinner />
                  </span>
                </div>
              )}
            </div>

            <Button
              className="openSansLight text-white mt-2 text-xs p-2 rounded"
              text={state.isSubmitting ? <Loader /> : "Submit"}
              ariaLabel="Submit"
              disabled={
                !formik.isValid || state.isSubmitting || state.isLoading
              }
              primary
            />
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddDisbursementAccount;
