import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import FormTextArea from "@/components/FormTextArea";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import { Payout } from "@/services/payout";
import usePayout, { RequestRefundPayload } from "@/stores/usePayout";
import { notifyError, notifySuccess, removeCommasFromValue } from "@/util/utils";
import React from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface RequestRefundProps {
    log: Payout;
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

interface FormValues {
    reference: string;
    amount: string;
    reason: string;
    description: string;
}

const validationSchema = Yup.object().shape({
    reference: Yup.string().required("Transaction reference is required!"),
    amount: Yup.string().required("Amount is required!"),
    reason: Yup.string().required("Reason is required!"),
    description: Yup.string().required("Description is required!"),
});

const RequestRefund: React.FC<RequestRefundProps> = ({
    log,
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
}) => {
    const { requestRefundLoading, requestRefund } = usePayout();
    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useFormValidation<FormValues>(validationSchema, {
        defaultValues: {
            reference: log?.reference || "",
            amount: log?.amount || "",
            reason: "",
            description: "",
        }
    });

    const closeModalAndReset = () => {
        reset();
        closeModal();
    };

    const onSubmit = async (values: FormValues) => {
        const payload: RequestRefundPayload = {
            amount: Number(removeCommasFromValue(values.amount)),
            reference: values.reference,
            reason: values.reason,
            description: values.description,
        };

        try {
            // TODO: test and verify this
            const response = await requestRefund(payload);
            // @ts-ignore
            notifySuccess(response.message);
            closeModalAndReset();
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            await fetchPayoutHistory();
        }
    };

    // TODO: Example reasons for refund 
    const reasons = [
        { value: "wrong account", label: "Wrong Account" },
        { value: "duplicate transaction", label: "Duplicate Transaction" },
        { value: "payment error", label: "Payment Error" },
        { value: "other", label: "Other" },
    ];

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeModalAndReset}
            title="Request Refund"
        >
            <div className="mt-5">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6 w-full">
                    <Controller
                        name="reference"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Transaction reference"
                                id="reference"
                                type="text"
                                htmlFor="reference"
                                maxLength={10}
                                error={errors.reference?.message}
                                touched={!!errors.reference}
                                {...field}
                                readOnly
                            />
                        )}
                    />

                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Transaction amount"
                                id="amount"
                                type="text"
                                htmlFor="amount"
                                error={errors.amount?.message}
                                touched={!!errors.amount}
                                numberOnly
                                className="w-5/12"
                                {...field}
                                readOnly
                            />
                        )}
                    />

                    <Controller
                        name="reason"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Select Reason"
                                id="reason"
                                htmlFor="reason"
                                options={reasons}
                                error={errors.reason?.message}
                                touched={!!errors.reason}
                                placeholder="Select Reason"
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
                                rows={4}
                                cols={50}
                                id="description"
                                htmlFor="description"
                                name={field.name}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />

                    <div className="w-1/3">
                        <Button
                            className="openSansLight text-white text-xs rounded mt-5"
                            text={requestRefundLoading ? <Loader /> : "Send request"}
                            ariaLabel="Send request"
                            disabled={requestRefundLoading}
                            primary
                            type="submit"
                        />
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default RequestRefund;