import Button from "@/components/button";
import FormSelect from "@/components/FormSelect";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import { initiateBulkPayout, completeBulkPayout } from "@/services/payout";
import useCurrency, { CurrencyOption } from "@/stores/useCurrency";
import { notifyError, notifySuccess } from "@/util/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import PinInput from "react-pin-input";
import * as Yup from "yup";
import { Upload } from "lucide-react";

interface BulkPayoutProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

interface BulkPayoutFormValues {
    currency: string;
    file: File | null;
    otp: string;
}

const CODE_LENGTH = 6;

const BulkPayout: React.FC<BulkPayoutProps> = ({
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // 0: file upload, 1: OTP verification
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { activeCurrencies, fetchActiveCurrencies } = useCurrency();

    // Generate currency options from active currencies, excluding USD
    const currencyOptions = useMemo(() => {
        // Currency names mapping
        const currencyNames: Record<string, string> = {
            NGN: '₦ NGN',
            USD: '$ USD',
            GHS: '₵ GHS',
            KES: 'KES',
            TZS: 'TZS',
            ZAR: 'ZAR',
            GBP: '£ GBP',
            EUR: '€ EUR',
            CAD: 'CAD',
            AUD: 'AUD',
            INR: 'INR',
            CNY: 'CNY',
            JPY: 'JPY',
            AED: 'AED',
            UGX: 'UGX',
            XOF: 'XOF',
            XAF: 'XAF',
        };

        return activeCurrencies
            .filter((code) => code !== 'USD') // Hide USD from payout currency list
            .map((code) => ({
                value: code as CurrencyOption,
                label: currencyNames[code] || code,
            }));
    }, [activeCurrencies]);

    // Get default currency
    const defaultCurrency = useMemo(() => {
        const firstAvailable = activeCurrencies.find(c => c !== 'USD');
        return (firstAvailable as CurrencyOption) || 'NGN';
    }, [activeCurrencies]);

    const validationSchema = useMemo(() => {
        const baseSchema = {
            currency: Yup.string().required("Currency is required"),
            file: Yup.mixed<File>()
                .when([], {
                    is: () => currentStep === 0,
                    then: (schema) => schema
                        .required("CSV file is required")
                        .test("fileType", "Only CSV and Excel files are allowed", (value) => {
                            if (!value) return false;
                            const fileName = value.name.toLowerCase();
                            const validExtensions = ['.csv', '.xlsx', '.xls'];
                            return validExtensions.some(ext => fileName.endsWith(ext));
                        })
                        .test("fileSize", "File size must be less than 10MB", (value) => {
                            if (!value) return false;
                            return value.size <= 10 * 1024 * 1024; // 10MB
                        }),
                    otherwise: (schema) => schema.nullable(),
                }),
            otp: Yup.string()
                .when([], {
                    is: () => currentStep === 1,
                    then: (schema) => schema
                        .required("OTP is required")
                        .length(CODE_LENGTH, `OTP must be ${CODE_LENGTH} digits`),
                    otherwise: (schema) => schema.nullable(),
                }),
        };

        return Yup.object().shape(baseSchema);
    }, [currentStep]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useFormValidation<BulkPayoutFormValues>(validationSchema, {
        defaultValues: {
            currency: defaultCurrency,
            file: null,
            otp: "",
        },
        mode: 'onChange',
    });

    // Fetch active currencies on mount
    useEffect(() => {
        fetchActiveCurrencies();
    }, [fetchActiveCurrencies]);

    // Update currency when defaultCurrency changes
    useEffect(() => {
        if (defaultCurrency) {
            setValue('currency', defaultCurrency);
        }
    }, [defaultCurrency, setValue]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.csv', '.xlsx', '.xls'];
            const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValidType) {
                notifyError("Only CSV and Excel files are allowed");
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                notifyError("File size must be less than 10MB");
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setSelectedFile(file);
            setValue('file', file, { shouldValidate: true });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file) {
            // Validate file type
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.csv', '.xlsx', '.xls'];
            const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValidType) {
                notifyError("Only CSV and Excel files are allowed");
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                notifyError("File size must be less than 10MB");
                return;
            }

            setSelectedFile(file);
            setValue('file', file, { shouldValidate: true });
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setValue('file', null, { shouldValidate: true });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (values: BulkPayoutFormValues) => {
        // Handle OTP verification step
        if (currentStep === 1) {
            setIsSubmitting(true);
            try {
                const response = await completeBulkPayout({
                    otp: values.otp,
                });

                if (response?.status || response?.message) {
                    notifySuccess(response?.message || 'Bulk payout completed successfully!');
                    handleClose();
                    await fetchPayoutHistory();
                }
            } catch (error: any) {
                notifyError(error?.message || "Failed to complete bulk payout");
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Handle file upload step
        if (!values.file) {
            notifyError("Please select a file");
            return;
        }

        setIsLoading(true);
        try {
            const response = await initiateBulkPayout({
                file: values.file,
                currency: values.currency,
            });

            if (response?.status || response?.message) {
                notifySuccess(response?.message || 'Bulk payout initiated. Please enter OTP to complete.');
                setCurrentStep(1); // Move to OTP verification step
            }
        } catch (error: any) {
            notifyError(error?.message || "Failed to initiate bulk payout");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setSelectedFile(null);
        setCurrentStep(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        closeModal();
    };

    const renderOtpVerificationStep = () => (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
                <h3 className="text-center text-lg font-medium">Enter Verification Code</h3>
                <p className="text-center text-gray-500 text-sm">
                    Please enter the {CODE_LENGTH}-digit code sent to you
                </p>

                <Controller
                    name="otp"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2 flex items-center justify-center">
                            <PinInput
                                length={CODE_LENGTH}
                                initialValue=""
                                focus
                                onChange={(value) => {
                                    field.onChange(value);
                                    if (value.length === CODE_LENGTH) {
                                        setTimeout(() => {
                                            field.onChange(value);
                                            handleSubmit(onSubmit)();
                                        }, 100);
                                    }
                                }}
                                onComplete={(value) => {
                                    field.onChange(value);
                                    setTimeout(() => {
                                        handleSubmit(onSubmit)();
                                    }, 100);
                                }}
                                type="numeric"
                                inputMode="number"
                                style={{ padding: '10px' }}
                                inputStyle={{
                                    borderColor: errors.otp?.message ? 'red' : '#e2e8f0',
                                    borderRadius: '8px',
                                    margin: '0 4px',
                                }}
                                inputFocusStyle={{ borderColor: '#2563eb' }}
                                autoSelect={true}
                                regexCriteria={/^[0-9]*$/}
                            />
                            {errors.otp?.message && (
                                <p className="text-red-500 text-xs">
                                    {errors.otp?.message}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>

            <div className="flex justify-center mt-8">
                <Button
                    className="openSansLight text-white text-lg p-2 rounded w-52"
                    text={isSubmitting ? <Loader /> : "Complete Bulk Payout"}
                    ariaLabel="Complete Bulk Payout"
                    disabled={isSubmitting}
                    primary
                    type="submit"
                />
            </div>
        </form>
    );

    const renderFileUploadStep = () => (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
            <div className="space-y-6">
                {/* Currency Selection */}
                <div>
                    <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Currency"
                                id="currency"
                                htmlFor="currency"
                                options={currencyOptions}
                                error={errors.currency?.message}
                                touched={!!errors.currency}
                                {...field}
                                value={field.value || defaultCurrency}
                            />
                        )}
                    />
                </div>

                {/* File Upload */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Upload Excel File
                        </label>
                        <a
                            href="/files/bulk_payout_template.xlsx"
                            download="bulk_payout_template.xlsx"
                            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
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
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Download Sample Template
                        </a>
                    </div>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${errors.file
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                            }`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {selectedFile ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                    <svg
                                        className="w-12 h-12 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile();
                                    }}
                                    className="text-sm text-red-600 hover:text-red-800 mt-2"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                    <Upload className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    Excel or CSV files only
                                </p>
                            </div>
                        )}
                    </div>
                    {errors.file && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.file.message}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        text="Cancel"
                        ariaLabel="Cancel"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={isLoading}
                        plain
                    />
                    <Button
                        type="submit"
                        text={isLoading ? <Loader /> : "Process Bulk Payout"}
                        ariaLabel="Process Bulk Payout"
                        className="flex-1"
                        disabled={isLoading || !selectedFile}
                        primary
                    />
                </div>
            </div>
        </form>
    );

    const getModalTitle = () => {
        if (currentStep === 1) return "Verify Bulk Payout";
        return "Bulk Payout";
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleClose}
            title={getModalTitle()}
            className="max-w-lg"
        >
            {currentStep === 0 ? renderFileUploadStep() : renderOtpVerificationStep()}
        </Modal>
    );
};

export default BulkPayout;
