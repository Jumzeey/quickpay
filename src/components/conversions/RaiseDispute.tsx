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
    description: Yup.string().required("Description is required!"),
    attachment: Yup.string().notRequired(),
});

interface FileState {
    file: File | null;
    previewUrl: string | null;
}

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

    const [fileState, setFileState] = useState<FileState>({
        file: null,
        previewUrl: null,
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
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
        if (fileState.previewUrl) {
            URL.revokeObjectURL(fileState.previewUrl);
        }
        setFileState({ file: null, previewUrl: null });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setState(prev => ({
            ...prev,
            isLoading: false,
            isSubmitting: false,
        }));
        closeModal();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type (images only)
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(file.type)) {
            notifyError("Please upload an image file (JPG, PNG, or GIF)");
            return;
        }

        // Validate file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            notifyError("File size exceeds 2MB. Please upload a smaller file.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setFileState({ file, previewUrl });
        setValue('attachment', file.name, { shouldValidate: true });
    };

    const handleRemoveFile = () => {
        if (fileState.previewUrl) {
            URL.revokeObjectURL(fileState.previewUrl);
        }
        setFileState({ file: null, previewUrl: null });
        setValue('attachment', '', { shouldValidate: true });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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
                attachment: fileState.file || undefined,
            });
            
            notifySuccess(response.message || "Dispute raised successfully");
            closeModalAndReset();
            await fetchConversionHistory();
        } catch (error: any) {
            notifyError(error.message || "Failed to raise dispute");
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

                    <div>
                        <label className="text-sm font-semibold text-black mb-0.5 block">
                            Attachment (Optional)
                        </label>
                        <div className="rounded border border-[#C4C4C43D] bg-[#D9D9D90D] p-4 min-h-[200px] flex flex-col items-center justify-center">
                            {!fileState.file ? (
                                <>
                                    <div className="w-full flex flex-col items-center justify-center text-center">
                                        <div className="size-10 rounded bg-[#FDFDFD] flex items-center justify-center border border-[#C4C4C41A]">
                                            <svg
                                                className="w-6 h-6 text-[#121212]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-[#7F7F7F] mt-3">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-primary mr-1 cursor-pointer"
                                                type="button"
                                            >
                                                Click to upload
                                            </button>
                                            JPG, PNG or GIF file (max. 2MB)
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            name="attachment"
                                            onChange={handleFileChange}
                                            accept="image/jpeg,image/jpg,image/png,image/gif"
                                            className="hidden"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="w-full flex flex-col items-center">
                                    <div className="relative">
                                        <img
                                            src={fileState.previewUrl || ''}
                                            alt="Preview"
                                            className="max-w-full max-h-48 rounded border"
                                        />
                                        <button
                                            onClick={handleRemoveFile}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 cursor-pointer text-white hover:bg-red-600"
                                            type="button"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-center text-primary font-semibold">
                                        {fileState.file.name}
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum file size: 2MB. Accepted formats: JPG, PNG, GIF
                        </p>
                    </div>

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

