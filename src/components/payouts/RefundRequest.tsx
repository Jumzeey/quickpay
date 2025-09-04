import Button from "@/components/button";
import FloatingLabelInput from "@/components/floating-input";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import TextArea from "@/components/text-area";
import { addShippingFee } from "@/services/e-commerce";
import { notifyError, notifySuccess, removeCommasFromValue } from "@/util/utils";
import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";

interface RefundRequestProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

interface StateProps {
    isLoading: boolean;
    isSubmitting: boolean;
}

const initialFormValues = {
    reference: "",
    amount: "",
    reason: "",
    description: "",
};

const RefundRequest: React.FC<RefundRequestProps> = ({
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
}) => {
    const [state, setState] = useState<StateProps>({
        isLoading: false,
        isSubmitting: false,
    });

    const validationSchema = Yup.object().shape({
        reference: Yup.string().required("Transaction reference is required!"),
        amount: Yup.string().required("Amount is required!"),
        reason: Yup.string().required("Reason is required!"),
        description: Yup.string().required("Description is required!"),
    });


    const closeModalAndReset = () => {
        // formik.resetForm({ values: initialFormValues });
        // setState(prev => ({
        //     ...prev,
        //     isLoading: false,
        //     isSubmitting: false,
        // }));
        closeModal();
    };

    const handleFormSubmit = async (values: typeof initialFormValues) => {
        setState(prev => ({ ...prev, isSubmitting: true }));

        const payload: any = {
            amount: removeCommasFromValue(values.amount),
            reference: values.reference,
            reason: values.reason,
            description: values.description,
        };

        try {
            // TODO: Replace addShippingFee with the actual transfer API call
            const response = await addShippingFee(payload);
            // @ts-ignore
            notifySuccess(response.message);
            closeModalAndReset();
        } catch (error: any) {
            notifyError(error.message);
            setState(prev => ({ ...prev, isSubmitting: false }));
        } finally {
            fetchPayoutHistory();
        }
    };

    const formik = useFormik({
        initialValues: initialFormValues,
        validationSchema: validationSchema,
        validateOnMount: true,
        onSubmit: handleFormSubmit,
    });

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeModalAndReset}
            title="Refund Request"
        >
            <div className="mt-5">
                <form onSubmit={formik.handleSubmit}>
                    <FloatingLabelInput
                        label="Transaction reference"
                        id="reference"
                        type="text"
                        htmlFor="reference"
                        maxLength={10}
                        formik={formik}
                        {...formik.getFieldProps("reference")}
                        readOnly
                    />

                    <FloatingLabelInput
                        label="Transaction amount"
                        id="amount"
                        type="text"
                        htmlFor="amount"
                        formik={formik}
                        {...formik.getFieldProps("amount")}
                        numberOnly
                        divClassname="w-5/12"
                        readOnly
                    />

                    <select
                        className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.reason}
                    >
                        <option value="">Select Reason</option>
                        {[].map((item: any, index) => (
                            <option key={index} value={item.code}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <TextArea
                        label="Description"
                        rows={4}
                        cols={50}
                        id="description"
                        formik={formik}
                        {...formik.getFieldProps("description")}
                    />

                    <Button
                        className="openSansLight text-white text-xs rounded mt-5"
                        text={state.isSubmitting ? <Loader /> : "Send request"}
                        ariaLabel="Send request"
                        disabled={!formik.isValid || state.isSubmitting || state.isLoading}
                        primary
                        type="submit"
                    />
                </form>
            </div>
        </Modal>
    );
};

export default RefundRequest;
