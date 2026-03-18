import Button from "@/components/button";
import FormSelect from "@/components/FormSelect";
import FormTextArea from "@/components/FormTextArea";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import UploadComponent from "@/components/upload-component";
import { useFormValidation } from "@/hooks/useFormValidation";
import { raiseConversionDispute } from "@/services/conversions";
import { notifyError, notifySuccess } from "@/util/utils";
import React, { useState } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

interface RaiseDisputeProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchConversionHistory: (params?: object) => void;
    conversionId: number | null;
}

interface StateProps {
    isLoading: boolean;
    isSubmitting: boolean;
}

interface FormValues {
    reason: string;
    description: string;
    attachment: string;
}

const validationSchema = Yup.object().shape({
    reason: Yup.string().required("Reason is required!"),
    description: Yup.string()
        .required("Description is required!")
        .min(10, "The description must be at least 10 characters."),
    attachment: Yup.string().notRequired(),
});

const disputeReasons = [
    { value: "failed", label: "Failed" },
    { value: "processing_timeout", label: "Processing Timeout" },
    { value: "settlement_delay", label: "Settlement Delay" },
    { value: "other", label: "Other" },
];

const RaiseDispute: React.FC<RaiseDisputeProps> = ({
    isModalOpen,
    closeModal,
    fetchConversionHistory,
    conversionId,
}) => {
    const [state, setState] = useState<StateProps>({
        isLoading: false,
        isSubmitting: false,
    });

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
        setError,
        reset
    } = useFormValidation<FormValues>(validationSchema, {
        defaultValues: {
            reason: "",
            description: "",
            attachment: "",
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
        if (!conversionId) {
            notifyError("Conversion ID is missing");
            return;
        }

        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            const response = await raiseConversionDispute(conversionId, {
                reason: values.reason,
                description: values.description,
                attachment_url: values.attachment || undefined,
            });
            
            notifySuccess(response.message || "Dispute raised successfully");
            closeModalAndReset();
            await fetchConversionHistory();
        } catch (error: any) {
            setState(prev => ({ ...prev, isSubmitting: false }));
            const payload = error?.payload;
            if (payload && typeof payload === "object" && Array.isArray(payload.description)) {
                const msg = payload.description[0];
                if (typeof msg === "string") {
                    setError("description", { type: "server", message: msg });
                    return;
                }
            }
            notifyError(error.message || "Failed to raise dispute");
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
                        name="reason"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Reason"
                                id="reason"
                                htmlFor="reason"
                                options={disputeReasons}
                                error={errors.reason?.message}
                                touched={!!errors.reason}
                                placeholder="Select dispute reason"
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
                                placeholder="Please explain your issue"
                                {...field}
                            />
                        )}
                    />

                    <Controller
                        name="attachment"
                        control={control}
                        render={({ field }) => (
                            <UploadComponent
                                name="attachment"
                                text="Attachment (Optional)"
                                folderName="conversion-disputes"
                                onFileUpload={(url) => {
                                    setValue('attachment', url, { shouldValidate: true });
                                    field.onChange(url);
                                }}
                                value={field.value}
                                error={errors.attachment?.message}
                                touched={!!errors.attachment}
                            />
                        )}
                    />

                    <div className="w-1/3">
                        <Button
                            className="openSansLight text-white text-xs p-2 rounded w-full"
                            text={state.isSubmitting ? <Loader /> : "Send request"}
                            ariaLabel="Send request"
                            disabled={state.isSubmitting || state.isLoading || !isValid}
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

