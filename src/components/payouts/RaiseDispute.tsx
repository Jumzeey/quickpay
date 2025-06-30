import Button from "@/components/button";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import TextArea from "@/components/text-area";
import { addShippingFee } from "@/services/e-commerce";
import { notifyError, notifySuccess } from "@/util/utils";
import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";

interface RaiseDisputeProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

interface StateProps {
    isLoading: boolean;
    isSubmitting: boolean;
}

const initialFormValues = {
    category: "",
    description: "",
};

const RaiseDispute: React.FC<RaiseDisputeProps> = ({
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
}) => {
    const [state, setState] = useState<StateProps>({
        isLoading: false,
        isSubmitting: false,
    });

    const validationSchema = Yup.object().shape({
        category: Yup.string().required("Category is required!"),
        description: Yup.string().required("Description is required!"),
    });

    const closeModalAndReset = () => {
        // formik.resetForm({ values: initialFormValues });
        // setState(prev => ({
        //     ...prev,
        //     isLoading: false,
        //     isSubmitting: false,
        // }));
        console.log("close modal");
        closeModal();
    };

    const handleFormSubmit = async (values: typeof initialFormValues) => {
        setState(prev => ({ ...prev, isSubmitting: true }));

        const payload: any = {
            category: values.category,
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
            title="Raise Dispute"
        >
            <div className="mt-5">
                <form onSubmit={formik.handleSubmit}>
                    <select
                        className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.category}
                    >
                        <option value="">Select Category</option>
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

export default RaiseDispute;
