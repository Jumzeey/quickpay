import React, { useState, useEffect, ChangeEvent } from "react";
import Button from "@/components/button";
import Modal from "@/components/modal";
import FloatingLabelInput from "@/components/floating-input";
import { getBanks, performNameCheck } from "@/services/bank";
import { addSettlementAccount } from "@/services/transaction";
import { useFormik } from "formik";
import * as Yup from "yup";
import { notifyError, notifySuccess } from "@/util/utils";
import { Spinner } from "@/components/Spinner";
import Loader from "@/components/loader";

interface AddAccountProps {
  isModalOpen: boolean;
  closeModal: () => void;
  fetchSettlementAccounts: () => void;
}

interface StateProps {
  banks: [];
  selectedOption: string;
  accountName: string;
  isLoading: boolean;
  isSubmitting: boolean;
}

const AddSettlementAccount: React.FC<AddAccountProps> = ({
  isModalOpen,
  closeModal,
  fetchSettlementAccounts,
}) => {
  const formik = useFormik({
    initialValues: {
      accountNumber: "",
      accountName: "",
    },
    validationSchema: Yup.object().shape({
      accountNumber: Yup.string()
        .required("Account number is required!")
        .min(10, "Account number must be 10 digits"),
      accountName: Yup.string().required("Account name is required!"),
    }),

    validateOnMount: true,

    onSubmit: async () => {
      createSettlementAccount();
    },
  });

  const [state, setState] = useState<StateProps>({
    banks: [],
    selectedOption: "",
    accountName: "",
    isLoading: false,
    isSubmitting: false,
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

  const createSettlementAccount = async () => {
    const payload = {
      bank_code: state.selectedOption,
      account_number: formik.values.accountNumber,
      account_name: formik.values.accountName,
    };
    try {
      setState({ ...state, isSubmitting: true });
      const response = await addSettlementAccount(payload);
      // @ts-ignore
      notifySuccess(response.message);
      closeModal();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState({ ...state, isSubmitting: false });
      closeModal();
      fetchSettlementAccounts();
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
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="mt-5">
        <form onSubmit={formik.handleSubmit}>
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
            disabled={!formik.isValid || state.isSubmitting || state.isLoading}
            primary
          />
        </form>
      </div>
    </Modal>
  );
};

export default AddSettlementAccount;
