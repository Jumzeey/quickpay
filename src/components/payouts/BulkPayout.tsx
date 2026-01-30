import Button from "@/components/button";
import FormSelect from "@/components/FormSelect";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import { initiateBulkPayout, completeBulkPayout } from "@/services/payout";
import useCurrency, { CurrencyOption } from "@/stores/useCurrency";
import { notifyError, notifySuccess } from "@/util/utils";
import { extractFileHeaders, BULK_PAYOUT_MAPPING_KEYS, buildMappingHeaders, getFilePreview, BulkPayoutMappingKey } from "@/util/fileHeaders";
import Icon from "@/components/icon";
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
    const [isExtractingHeaders, setIsExtractingHeaders] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // 0: file upload, 1: OTP verification
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [headerMapping, setHeaderMapping] = useState<Record<BulkPayoutMappingKey, string>>({
        acct_no: "",
        bank: "",
        amnt: "",
        acct_name: "",
    });
    const [openMappingKey, setOpenMappingKey] = useState<BulkPayoutMappingKey | null>(null);
    const [mappingSearchTerm, setMappingSearchTerm] = useState("");
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const mappingDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
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
            ZMW: 'ZMW',
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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

            // Extract headers from the file
            setIsExtractingHeaders(true);
            try {
                const headers = await extractFileHeaders(file);
                setFileHeaders(headers);
                // Auto-map headers if they match common patterns
                const autoMapping: Record<BulkPayoutMappingKey, string> = {
                    acct_no: "",
                    bank: "",
                    amnt: "",
                    acct_name: "",
                };
                headers.forEach((header) => {
                    const lowerHeader = header.toLowerCase().replace(/[_\s]/g, "");
                    if (lowerHeader.includes("acct") && lowerHeader.includes("no") || lowerHeader.includes("accountnumber") || lowerHeader.includes("accountno")) {
                        if (!autoMapping.acct_no) autoMapping.acct_no = header;
                    } else if (lowerHeader.includes("bank") || lowerHeader.includes("bankname") || lowerHeader.includes("bankname")) {
                        if (!autoMapping.bank) autoMapping.bank = header;
                    } else if (lowerHeader.includes("amnt") || lowerHeader.includes("amount") || lowerHeader.includes("amt")) {
                        if (!autoMapping.amnt) autoMapping.amnt = header;
                    } else if (lowerHeader.includes("acct") && lowerHeader.includes("name") || lowerHeader.includes("accountname") || lowerHeader.includes("accountname")) {
                        if (!autoMapping.acct_name) autoMapping.acct_name = header;
                    }
                });
                setHeaderMapping(autoMapping);
            } catch (error: any) {
                notifyError(error?.message || "Failed to extract file headers");
                setFileHeaders([]);
            } finally {
                setIsExtractingHeaders(false);
            }
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
        setFileHeaders([]);
        setHeaderMapping({
            acct_no: "",
            bank: "",
            amnt: "",
            acct_name: "",
        });
        setValue('file', null, { shouldValidate: true });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Close mapping dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMappingKey === null) return;
            const ref = mappingDropdownRefs.current[openMappingKey];
            if (ref && !ref.contains(event.target as Node)) {
                setOpenMappingKey(null);
                setMappingSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMappingKey]);

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

        // Handle file upload step: show confirmation modal with preview (do not call API yet)
        if (!values.file) {
            notifyError("Please select a file");
            return;
        }

        const allMapped = BULK_PAYOUT_MAPPING_KEYS.every(({ key }) => headerMapping[key]?.trim());
        if (!allMapped) {
            notifyError("Please map all required columns to your file headers");
            return;
        }

        setIsLoadingPreview(true);
        try {
            const { rows } = await getFilePreview(values.file, 10);
            setPreviewRows(rows);
            setShowConfirmationModal(true);
        } catch (err: any) {
            notifyError(err?.message || "Failed to load file preview");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleConfirmBulkPayout = async () => {
        const file = watch("file");
        const currency = watch("currency");
        if (!file) {
            notifyError("Please select a file");
            return;
        }
        const mappingHeaders = buildMappingHeaders(headerMapping);
        setIsLoading(true);
        try {
            const response = await initiateBulkPayout({
                file,
                currency,
                mapping_headers: mappingHeaders,
            });
            if (response?.status || response?.message) {
                notifySuccess(response?.message || "Bulk payout initiated. Please enter OTP to complete.");
                setShowConfirmationModal(false);
                setCurrentStep(1);
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
        setFileHeaders([]);
        setHeaderMapping({
            acct_no: "",
            bank: "",
            amnt: "",
            acct_name: "",
        });
        setShowConfirmationModal(false);
        setPreviewRows([]);
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
            <p className="text-sm text-gray-500 mb-5">
                Choose currency, upload your file, then map columns to the required fields.
            </p>
            <div className="space-y-6">
                {/* Currency Selection */}
                <div>
                    <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                            <FormSelect
                                label="Select currency"
                                id="currency"
                                htmlFor="currency"
                                options={currencyOptions}
                                error={errors.currency?.message}
                                touched={!!errors.currency}
                                placeholder="Select currency"
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
                            Upload File
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
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${errors.file
                            ? 'border-red-400 bg-red-50/50'
                            : 'border-primary/40 bg-[#005BB008] hover:border-primary/60 hover:bg-[#005BB00D]'
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
                                    {isExtractingHeaders ? (
                                        <Loader />
                                    ) : (
                                        <svg
                                            className="w-11 h-11 text-primary"
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
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                                {isExtractingHeaders && (
                                    <p className="text-xs text-gray-500">
                                        Extracting headers...
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile();
                                    }}
                                    className="text-sm text-primary hover:text-primary/80 font-medium mt-2"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    CSV or Excel (.xlsx, .xls) — max 10MB
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

                {/* Header Mapping Section - CurrencySwitcher-style dropdowns */}
                {fileHeaders.length > 0 && (
                    <div className="space-y-4 pt-5 border-t border-gray-200">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-1">
                                Map your file columns
                            </h3>
                            <p className="text-xs text-gray-500">
                                Match each required field to a column from your file.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {BULK_PAYOUT_MAPPING_KEYS.map((mappingKey) => {
                                const headerOptions = fileHeaders.map((header) => ({
                                    value: header,
                                    label: header,
                                }));
                                const selectedValue = headerMapping[mappingKey.key];
                                const selectedLabel = selectedValue || "Select column...";
                                const isOpen = openMappingKey === mappingKey.key;
                                const filteredOptions = isOpen && mappingSearchTerm.trim()
                                    ? headerOptions.filter(
                                        (opt) =>
                                            opt.label.toLowerCase().includes(mappingSearchTerm.toLowerCase())
                                    )
                                    : headerOptions;

                                return (
                                    <div
                                        key={mappingKey.key}
                                        className="space-y-1.5 relative"
                                        ref={(el) => {
                                            mappingDropdownRefs.current[mappingKey.key] = el;
                                        }}
                                    >
                                        <label className="block text-sm font-medium text-gray-700">
                                            {mappingKey.label} <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            className="flex justify-between items-center w-full h-12 rounded-lg px-4 bg-[#005BB01A] text-[#005BB0] font-bold text-sm border border-[#005BB040] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            onClick={() => {
                                                setOpenMappingKey((prev) =>
                                                    prev === mappingKey.key ? null : mappingKey.key
                                                );
                                                setMappingSearchTerm("");
                                            }}
                                        >
                                            <span className="truncate">
                                                {selectedValue ? selectedLabel : "Select column..."}
                                            </span>
                                            <Icon name="caretDown" />
                                        </button>
                                        {isOpen && (
                                            <div className="absolute z-50 mt-2 w-full bg-white text-black rounded-lg border border-gray-200 shadow-lg">
                                                <div className="p-2 border-b border-gray-100">
                                                    <input
                                                        type="text"
                                                        placeholder="Search column..."
                                                        value={mappingSearchTerm}
                                                        onChange={(e) => setMappingSearchTerm(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded"
                                                    />
                                                </div>
                                                <ul className="max-h-48 overflow-y-auto">
                                                    {filteredOptions.length > 0 ? (
                                                        filteredOptions.map((option) => (
                                                            <li
                                                                key={option.value}
                                                                onClick={() => {
                                                                    setHeaderMapping((prev) => ({
                                                                        ...prev,
                                                                        [mappingKey.key]: option.value,
                                                                    }));
                                                                    setOpenMappingKey(null);
                                                                    setMappingSearchTerm("");
                                                                }}
                                                                className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] ${
                                                                    selectedValue === option.value ? "bg-[#005BB00D]" : ""
                                                                }`}
                                                            >
                                                                {option.label}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-4 py-3 text-sm text-gray-500">
                                                            No matching column
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        text="Cancel"
                        ariaLabel="Cancel"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={isLoading || isLoadingPreview}
                        plain
                    />
                    <Button
                        type="submit"
                        text={isLoadingPreview ? <Loader /> : "Process Bulk Payout"}
                        ariaLabel="Process Bulk Payout"
                        className="flex-1"
                        disabled={
                            isLoading ||
                            isLoadingPreview ||
                            !selectedFile ||
                            !BULK_PAYOUT_MAPPING_KEYS.every(({ key }) => headerMapping[key]?.trim())
                        }
                        primary
                    />
                </div>
            </div>
        </form>
    );

    const renderConfirmationModal = () => {
        const currency = watch("currency");
        return (
            <Modal
                isOpen={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                title="Confirm bulk payout"
                className="max-w-2xl"
            >
                <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Please confirm the data below. Only the first 10 rows are shown. After you confirm, you will receive an OTP to complete the payout.
                    </p>
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2">
                        <span className="text-sm font-medium text-gray-700">Currency: </span>
                        <span className="text-sm text-gray-800">{currency}</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-[#005BB01A]">
                                <tr>
                                    {BULK_PAYOUT_MAPPING_KEYS.map(({ label }) => (
                                        <th
                                            key={label}
                                            className="px-4 py-3 text-left font-semibold text-[#005BB0]"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {previewRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={BULK_PAYOUT_MAPPING_KEYS.length}
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No rows to display
                                        </td>
                                    </tr>
                                ) : (
                                    previewRows.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50">
                                            {BULK_PAYOUT_MAPPING_KEYS.map(({ key }) => (
                                                <td key={key} className="px-4 py-2.5 text-gray-800">
                                                    {row[headerMapping[key]] ?? "—"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-500">
                        Showing up to 10 rows. Full file will be processed on confirm.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="button"
                            text="Back"
                            ariaLabel="Back"
                            onClick={() => setShowConfirmationModal(false)}
                            className="flex-1"
                            disabled={isLoading}
                            plain
                        />
                        <Button
                            type="button"
                            text={isLoading ? <Loader /> : "Confirm"}
                            ariaLabel="Confirm bulk payout"
                            className="flex-1"
                            disabled={isLoading}
                            primary
                            onClick={handleConfirmBulkPayout}
                        />
                    </div>
                </div>
            </Modal>
        );
    };

    const getModalTitle = () => {
        if (currentStep === 1) return "Verify Bulk Payout";
        return "Bulk Payout";
    };

    return (
        <>
            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={getModalTitle()}
                className="max-w-lg"
            >
                {currentStep === 0 ? renderFileUploadStep() : renderOtpVerificationStep()}
            </Modal>
            {renderConfirmationModal()}
        </>
    );
};

export default BulkPayout;
