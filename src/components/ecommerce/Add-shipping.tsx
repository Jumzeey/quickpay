import React, { useState, ChangeEvent } from "react";
import Button from "@/components/button";
import Modal from "@/components/modal";
import FloatingLabelInput from "@/components/floating-input";
import { useFormik } from "formik";
import * as Yup from "yup";
import { notifyError, notifySuccess, removeCommasFromValue } from "@/util/utils";
import Loader from "@/components/loader";
import { addShippingFee } from "@/services/e-commerce";

interface AddAccountProps {
  isModalOpen: boolean;
  closeModal: () => void;
  fetchShippingFees: () => void;
}

interface StateProps {
  selectedOption: string;
  isLoading: boolean;
  isSubmitting: boolean;
}

const AddShipping: React.FC<AddAccountProps> = ({
  isModalOpen,
  closeModal,
  fetchShippingFees,
}) => {
  const formik = useFormik({
    initialValues: {
      amount: "",
    },
    validationSchema: Yup.object().shape({
      amount: Yup.string().required("Amount is required!"),
    }),

    validateOnMount: true,

    onSubmit: async () => {
      createShipping();
    },
  });

  const [state, setState] = useState<StateProps>({
    selectedOption: "",
    isLoading: false,
    isSubmitting: false,
  });

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({ ...state, selectedOption: value });
  };

  const createShipping = async () => {
    const payload = {
      amount: removeCommasFromValue(formik.values.amount),
      region: "South-west, Nigeria",
    };
    try {
      setState({ ...state, isSubmitting: true });
      const response = await addShippingFee(payload);
      // @ts-ignore
      notifySuccess(response.message);
      closeModal();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState({ ...state, isSubmitting: false });
      closeModal();
      fetchShippingFees();
    }
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className="mt-5">
        <form onSubmit={formik.handleSubmit}>
          <label className="text-sm">Select region</label>
          <select
            className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
            onChange={handleChange}
          >
            <option value="Select Region">--Region--</option>
            {/* {state.banks.map((bank: any, index) => (
              <option key={index} value={bank.code}>
                {bank.name}
              </option>
            ))} */}
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

          <Button
            className="openSansLight text-white mt-2 text-xs p-2 rounded"
            text={state.isLoading || state.isSubmitting ? <Loader /> : "Submit"}
            ariaLabel="Submit"
            disabled={!formik.isValid || state.isLoading || state.isSubmitting}
            primary
          />
        </form>
      </div>
    </Modal>
  );
};

export default AddShipping;
