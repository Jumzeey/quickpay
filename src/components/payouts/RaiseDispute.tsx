import Button from "@/components/button";
import FormSelect from "@/components/FormSelect";
import FormTextArea from "@/components/FormTextArea";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import { addShippingFee } from "@/services/e-commerce";
import { notifyError, notifySuccess } from "@/util/utils";
import React, { useState } from "react";
import { Controller } from "react-hook-form";
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

interface FormValues {
    category: string;
    description: string;
}

const validationSchema = Yup.object().shape({
    category: Yup.string().required("Category is required!"),
    description: Yup.string().required("Description is required!"),
});

// TODO: replace with actual data
const disputeCategories = [
    { value: "wrong amount", label: "Wrong Amount" },
    { value: "failed transaction", label: "Failed Transaction" },
    { value: "double debit", label: "Double Debit" },
    { value: "other", label: "Other" },
];

const RaiseDispute: React.FC<RaiseDisputeProps> = ({
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
}) => {
    const [state, setState] = useState<StateProps>({
        isLoading: false,
        isSubmitting: false,
    });

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useFormValidation<FormValues>(validationSchema, {
        defaultValues: {
            category: "",
            description: "",
        }
    });

    const closeModalAndReset = () => {
        reset();
        setState(prev => ({
            ...prev,
            isLoading: false,
            isSubmitting: false,
        }));
        closeModal();
    };

    const onSubmit = async (values: FormValues) => {
        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            // TODO: Replace addShippingFee with the actual dispute API call
            // @ts-ignore
            const response = await addShippingFee(values);
            // @ts-ignore
            notifySuccess(response.message);
            closeModalAndReset();
            await fetchPayoutHistory();
        } catch (error: any) {
            notifyError(error.message);
            setState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeModalAndReset}
            title="Raise Dispute"
        >
            <div className="mt-5">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Category"
                                id="category"
                                htmlFor="category"
                                options={disputeCategories}
                                error={errors.category?.message}
                                touched={!!errors.category}
                                placeholder="Select dispute category"
                                {...field}
                            />
                        )}
                    />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <FormTextArea
                                label="Description"
                                id="description"
                                htmlFor="description"
                                error={errors.description?.message}
                                touched={!!errors.description}
                                className="min-h-[120px]"
                                placeholder="Provide details about your dispute"
                                {...field}
                            />
                        )}
                    />


                    <div className="w-1/3">
                        <Button
                            className="openSansLight text-white text-xs p-2 rounded w-full"
                            text={state.isSubmitting ? <Loader /> : "Send request"}
                            ariaLabel="Send request"
                            disabled={state.isSubmitting || state.isLoading}
                            primary
                            type="submit"
                        />
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default RaiseDispute;
