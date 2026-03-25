import Button from "@/components/button";
import FormSelect from "@/components/FormSelect";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useModuleOptions } from "@/hooks/useModuleAccess";
import { initiateBulkPayout, completeBulkPayout, getBulkPayoutStatus, cancelBulkPayout } from "@/services/payout";
import useAuthentication from "@/stores/useAuthentication";
import useCurrency, { CurrencyOption } from "@/stores/useCurrency";
import { formatBalance, notifyError, notifySuccess } from "@/util/utils";
import { uploadConfig } from "@/config/upload";
import { uploadToS3 } from "@/lib/uploadToS3";
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
    fetchBulkPayoutHistory?: () => void;
}

interface BulkPayoutFormValues {
    currency: string;
    file: File | null;
    otp: string;
}

const CODE_LENGTH = 6;
const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;
const EMAIL_OTP_LENGTH = 6;
const BULK_PAYOUT_RECOMMENDED_MAX = 100;
const VERIFICATION_WARN_AFTER_MS = 60 * 1000;   // 60s: show "takes longer for 100+"
const VERIFICATION_TIMEOUT_MS = 5 * 60 * 1000;  // 5 min: show timeout message + Try again

const BulkPayout: React.FC<BulkPayoutProps> = ({
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
    fetchBulkPayoutHistory,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
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
    const [completeOtpValue, setCompleteOtpValue] = useState("");
    const [completeUseRecoveryCode, setCompleteUseRecoveryCode] = useState(false);
    const [completeRecoveryCodeValue, setCompleteRecoveryCodeValue] = useState("");
    const [bulkPayoutId, setBulkPayoutId] = useState<number | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verification_completed' | 'failed' | null>(null);
    const [bulkPayoutDetails, setBulkPayoutDetails] = useState<{ total: number; currency: string } | null>(null);
    const [verificationFailure, setVerificationFailure] = useState<{
        reason: string;
        failedRows: Array<{ account_name: string; account_number: string; bank_name?: string; amount?: string; failure_reason: string }>;
    } | null>(null);
    const [verificationLongMessage, setVerificationLongMessage] = useState(false);
    const [verificationTimedOut, setVerificationTimedOut] = useState(false);
    const verificationStartTimeRef = useRef<number | null>(null);
    const mappingDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { activeCurrencies: userActiveCurrencies, fetchActiveCurrencies } = useCurrency();
    const bulkPayoutAllowed = useModuleOptions("payout", "bulk-payout");
    const singlePayoutAllowed = useModuleOptions("payout", "single-payout");
    const { totp_enabled } = useAuthentication();

    const allowedBulkCurrencies = useMemo(() => {
        if (bulkPayoutAllowed.length > 0) return new Set(bulkPayoutAllowed);
        if (singlePayoutAllowed.length > 0) return new Set(singlePayoutAllowed);
        return null;
    }, [bulkPayoutAllowed, singlePayoutAllowed]);

    const currencyOptions = useMemo(() => {
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
        const allCodes = userActiveCurrencies.length > 0 ? userActiveCurrencies : ["NGN", "USD", "GHS", "KES", "TZS", "XOF", "ZMW"];
        return allCodes
            .filter((code) => code !== 'USD')
            .map((code) => ({
                value: code as CurrencyOption,
                label: currencyNames[code] || code,
                disabled: allowedBulkCurrencies !== null ? !allowedBulkCurrencies.has(code) : false,
            }));
    }, [userActiveCurrencies, allowedBulkCurrencies]);

    const defaultCurrency: CurrencyOption = useMemo(() => {
        const firstEnabled = currencyOptions.find((o) => !o.disabled);
        return (firstEnabled?.value as CurrencyOption) ?? 'NGN';
    }, [currencyOptions]);

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
                    is: () => currentStep === 1 && !totp_enabled,
                    then: (schema) => schema
                        .required("OTP is required")
                        .length(EMAIL_OTP_LENGTH, `OTP must be ${EMAIL_OTP_LENGTH} digits`),
                    otherwise: (schema) => schema.nullable(),
                }),
        };

        return Yup.object().shape(baseSchema);
    }, [currentStep, totp_enabled]);

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

    // When main modal opens (e.g. user opens bulk payout again), close any previously open child modal
    const prevModalOpenRef = useRef(isModalOpen);
    useEffect(() => {
        if (isModalOpen && !prevModalOpenRef.current) {
            setShowConfirmationModal(false);
        }
        prevModalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

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

    const processFile = async (file: File) => {
        setSelectedFile(file);
        setValue('file', file, { shouldValidate: true });

        setIsExtractingHeaders(true);
        try {
            const headers = await extractFileHeaders(file);
            setFileHeaders(headers);
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
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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

            if (file.size > 10 * 1024 * 1024) {
                notifyError("File size must be less than 10MB");
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            await processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.csv', '.xlsx', '.xls'];
            const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValidType) {
                notifyError("Only CSV and Excel files are allowed");
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                notifyError("File size must be less than 10MB");
                return;
            }

            await processFile(file);
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

    const getCompleteStepCode = (): string | null => {
        if (completeUseRecoveryCode) {
            const trimmed = completeRecoveryCodeValue.trim().toUpperCase();
            return trimmed.length === RECOVERY_CODE_LENGTH && /^[A-Z0-9]+$/.test(trimmed) ? trimmed : null;
        }
        return completeOtpValue.length === TOTP_LENGTH ? completeOtpValue : null;
    };

    const onSubmit = async (values: BulkPayoutFormValues) => {
        // Handle OTP verification step (complete bulk payout). Same API for 2FA or email OTP.
        if (currentStep === 1) {
            setIsSubmitting(true);
            const code = totp_enabled ? getCompleteStepCode() : values.otp;
            if (!code) {
                if (totp_enabled) {
                    notifyError(completeUseRecoveryCode ? "Enter a valid 10-character recovery code" : "Enter the 6-digit authenticator code");
                } else {
                    notifyError(`Enter the ${EMAIL_OTP_LENGTH}-digit code sent to your email`);
                }
                setIsSubmitting(false);
                return;
            }
            if (bulkPayoutId == null) {
                notifyError("Bulk payout session expired. Please start again.");
                setIsSubmitting(false);
                return;
            }
            try {
                const response = await completeBulkPayout({
                    bulk_payout_id: bulkPayoutId,
                    otp: code,
                });

                if (response?.status || response?.message) {
                    notifySuccess(response?.message || 'Bulk payout completed successfully!');
                    await fetchPayoutHistory();
                    await fetchBulkPayoutHistory?.();
                    handleClose();
                }
            } catch (error: any) {
                const message = error?.message || "Failed to complete bulk payout";
                notifyError(message);
                // Close modal when user must reinitiate (too many failed attempts)
                if (typeof message === 'string' && /reinitiate|too many failed attempts/i.test(message)) {
                    handleClose();
                }
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
        await doInitiateBulkPayout(file, currency);
    };

    const doInitiateBulkPayout = async (file: File, currency: string) => {
        const mappingHeaders = buildMappingHeaders(headerMapping);
        setIsLoading(true);
        try {
            let fileUrl: string | undefined;
            if (uploadConfig.useS3) {
                const result = await uploadToS3({
                    file,
                    key: `bulk-payout/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
                });
                fileUrl = result.url;
            }
            const response = await initiateBulkPayout({
                ...(fileUrl ? { file_url: fileUrl } : { file }),
                currency,
                mapping_headers: mappingHeaders,
            });
            if (response?.status || response?.message) {
                const id = response?.data?.bulk_payout_id ?? null;
                if (id != null) {
                    setBulkPayoutId(id);
                    setVerificationStatus('pending');
                    setVerificationLongMessage(false);
                    setVerificationTimedOut(false);
                    verificationStartTimeRef.current = Date.now();
                }
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

    // Poll bulk payout status until verification_completed or failed, then show OTP or failure
    useEffect(() => {
        if (currentStep !== 1 || bulkPayoutId == null || verificationStatus === 'verification_completed' || verificationStatus === 'failed' || verificationTimedOut) return;

        const pollInterval = 2000;
        const maxAttempts = 30;
        let attempts = 0;
        let cancelled = false;

        const poll = async () => {
            if (cancelled || attempts >= maxAttempts) return;
            const startTime = verificationStartTimeRef.current ?? 0;
            const elapsed = Date.now() - startTime;
            if (elapsed >= VERIFICATION_TIMEOUT_MS) {
                setVerificationTimedOut(true);
                return;
            }
            if (elapsed >= VERIFICATION_WARN_AFTER_MS) {
                setVerificationLongMessage(true);
            }
            try {
                const res = await getBulkPayoutStatus(bulkPayoutId);
                if (cancelled) return;
                const bulkPayout = res?.data?.bulk_payout;
                const status = bulkPayout?.status;
                const transactions = res?.data?.transactions;
                const total = transactions?.total ?? 0;
                const currency = bulkPayout?.currency ?? watch("currency") ?? "NGN";

                if (status === 'verification_completed') {
                    setVerificationStatus('verification_completed');
                    setBulkPayoutDetails({ total, currency });
                    return;
                }
                if (status === 'failed') {
                    const reason = bulkPayout?.reason ?? "Verification failed.";
                    const rows = transactions?.data ?? [];
                    const failedRows = rows
                        .filter((r: { failure_reason?: string }) => r?.failure_reason)
                        .map((r: { account_name?: string; account_number?: string; bank_name?: string; amount?: string; failure_reason?: string }) => ({
                            account_name: r.account_name ?? "",
                            account_number: r.account_number ?? "",
                            bank_name: r.bank_name,
                            amount: r.amount,
                            failure_reason: r.failure_reason ?? "",
                        }));
                    setVerificationStatus('failed');
                    setVerificationFailure({ reason, failedRows });
                    notifyError(reason);
                    return;
                }
            } catch {
                if (cancelled) return;
            }
            attempts += 1;
            if (attempts < maxAttempts) {
                pollTimeoutRef.current = setTimeout(poll, pollInterval);
            } else {
                setVerificationTimedOut(true);
            }
        };

        pollTimeoutRef.current = setTimeout(poll, 500);

        return () => {
            cancelled = true;
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
                pollTimeoutRef.current = null;
            }
        };
    }, [currentStep, bulkPayoutId, verificationStatus, verificationTimedOut, watch]);

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
        setBulkPayoutId(null);
        setVerificationStatus(null);
        setBulkPayoutDetails(null);
        setVerificationFailure(null);
        setVerificationLongMessage(false);
        setVerificationTimedOut(false);
        verificationStartTimeRef.current = null;
        setCompleteOtpValue("");
        setCompleteRecoveryCodeValue("");
        setCompleteUseRecoveryCode(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        closeModal();
    };

    const handleCompleteStepSubmit = async () => {
        if (totp_enabled) {
            const code = getCompleteStepCode();
            if (!code) return;
            if (bulkPayoutId == null) {
                notifyError("Bulk payout session expired. Please start again.");
                return;
            }
            setIsSubmitting(true);
            try {
                // Same API verifies OTP for both 2FA (TOTP/recovery) and email OTP
                const response = await completeBulkPayout({ bulk_payout_id: bulkPayoutId, otp: code });
                if (response?.status || response?.message) {
                    notifySuccess(response?.message || 'Bulk payout completed successfully!');
                    await fetchPayoutHistory();
                    await fetchBulkPayoutHistory?.();
                    handleClose();
                }
            } catch (error: any) {
                const message = error?.message || "Failed to complete bulk payout";
                notifyError(message);
                // Close modal when user must reinitiate (too many failed attempts)
                if (typeof message === 'string' && /reinitiate|too many failed attempts/i.test(message)) {
                    handleClose();
                }
            } finally {
                setIsSubmitting(false);
            }
        } else {
            handleSubmit(onSubmit)();
        }
    };

    const handleTryAgainBulkPayout = () => {
        setVerificationTimedOut(false);
        setVerificationLongMessage(false);
        setCurrentStep(0);
        setBulkPayoutId(null);
        setVerificationStatus(null);
        setBulkPayoutDetails(null);
        setCompleteOtpValue("");
        setCompleteRecoveryCodeValue("");
        setCompleteUseRecoveryCode(false);
    };

    const handleCancelBulkPayout = async () => {
        if (bulkPayoutId == null) {
            handleClose();
            return;
        }
        setIsCancelling(true);
        try {
            const response = await cancelBulkPayout(bulkPayoutId);
            notifySuccess(response?.message || "Bulk payout cancelled.");
            await fetchPayoutHistory();
            await fetchBulkPayoutHistory?.();
            handleClose();
        } catch (error: any) {
            notifyError(error?.message || "Failed to cancel bulk payout");
        } finally {
            setIsCancelling(false);
        }
    };

    const renderOtpVerificationStep = () => {
        if (verificationStatus === 'failed' && verificationFailure) {
            return (
                <div className="space-y-5 py-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="rounded-full bg-red-100 p-3">
                            <Icon name="red-cross" className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-center text-lg font-medium text-gray-800">
                            Verification failed
                        </h3>
                        <p className="text-center text-gray-600 text-sm max-w-md">
                            {verificationFailure.reason}
                        </p>
                        {verificationFailure.failedRows.length > 0 && (
                            <div className="w-full max-h-48 overflow-auto rounded-lg border border-gray-200 bg-gray-50">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left py-2 px-3 font-medium text-gray-700">Account</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-700 hidden sm:table-cell">Bank</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-700">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verificationFailure.failedRows.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 last:border-0">
                                                <td className="py-2 px-3 text-gray-800">{row.account_name} ({row.account_number})</td>
                                                <td className="py-2 px-3 text-gray-600 hidden sm:table-cell">{row.bank_name ?? "—"}</td>
                                                <td className="py-2 px-3 text-red-600">{row.failure_reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Button
                            className="openSansLight text-white text-lg p-2 rounded w-52"
                            text="Start over"
                            ariaLabel="Start over"
                            primary
                            type="button"
                            onClick={handleClose}
                        />
                    </div>
                </div>
            );
        }

        if (verificationTimedOut) {
            return (
                <div className="space-y-5 py-8">
                    <div className="flex flex-col items-center gap-5">
                        <div className="rounded-full bg-amber-100 p-3">
                            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="sr-only">Timeout</span>
                        </div>
                        <h3 className="text-center text-lg font-medium text-gray-800">
                            Verification took too long
                        </h3>
                        <p className="text-center text-gray-600 text-sm max-w-sm">
                            Please ensure your file has 100 or fewer recipients per batch and try again. For larger payouts, split your file into multiple files of 100 or fewer.
                        </p>
                        <Button
                            className="openSansLight text-white text-lg p-2 rounded w-52"
                            text="Try again"
                            ariaLabel="Try again"
                            primary
                            type="button"
                            onClick={handleTryAgainBulkPayout}
                        />
                    </div>
                </div>
            );
        }

        if (verificationStatus !== 'verification_completed') {
            return (
                <div className="space-y-5 py-8">
                    <div className="flex flex-col items-center justify-center gap-5">
                        <div className="flex items-center justify-center">
                            <Icon name="loader" className="animate-spin h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-medium text-gray-800">
                                Verifying your bulk payout
                            </h3>
                            <p className="text-gray-500 text-sm max-w-sm">
                                {verificationLongMessage
                                    ? "Files with more than 100 recipients take longer to verify. We're still processing — you'll be prompted for a code when ready."
                                    : "We're verifying the accounts in your file. This usually takes a few seconds."}
                            </p>
                            <p className="text-gray-400 text-xs">
                                You’ll be asked to enter a verification code when ready.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        if (totp_enabled) {
            return (
                <div className="space-y-5">
                    {bulkPayoutDetails && (
                        <p className="text-sm text-gray-600 text-center">
                            {bulkPayoutDetails.total} recipient{bulkPayoutDetails.total !== 1 ? 's' : ''} verified. Enter your code to complete.
                        </p>
                    )}
                    <div className="space-y-4">
                        <h3 className="text-center text-lg font-medium">
                            {completeUseRecoveryCode ? "Enter recovery code" : "Enter authenticator code"}
                        </h3>
                        <p className="text-center text-gray-500 text-sm">
                            {completeUseRecoveryCode
                                ? "Enter one of the 10-character recovery codes you saved when you set up 2FA."
                                : "Enter the 6-digit code from your authenticator app to complete the bulk payout."}
                        </p>
                        <div className="mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setCompleteUseRecoveryCode((prev: boolean) => !prev);
                                    setCompleteOtpValue("");
                                    setCompleteRecoveryCodeValue("");
                                }}
                                className="text-sm font-medium text-primary hover:text-blue-700"
                            >
                                {completeUseRecoveryCode ? "Use authenticator code" : "Use a backup code"}
                            </button>
                        </div>
                        {completeUseRecoveryCode ? (
                            <div className="flex flex-col">
                                <label htmlFor="complete-recovery-code" className="text-sm font-medium text-[#111827] mb-1">
                                    Recovery code
                                </label>
                                <input
                                    id="complete-recovery-code"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="one-time-code"
                                    maxLength={RECOVERY_CODE_LENGTH}
                                    value={completeRecoveryCodeValue}
                                    onChange={(e) =>
                                        setCompleteRecoveryCodeValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                                    placeholder="e.g. WO1EBITAQJ"
                                    className="w-full h-11 px-3 border border-[#C4C4C43D] rounded-lg text-center font-mono text-base tracking-widest text-[#111827] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <label className="text-sm font-medium text-[#111827] mb-2 block">Authenticator code</label>
                                <PinInput
                                    length={TOTP_LENGTH}
                                    initialValue=""
                                    type="numeric"
                                    inputMode="number"
                                    focus
                                    onChange={(value) => setCompleteOtpValue(value)}
                                    onComplete={(value) => setCompleteOtpValue(value)}
                                    style={{ display: "flex", gap: "8px", flexWrap: "nowrap", justifyContent: "center" }}
                                    inputStyle={{
                                        width: "44px",
                                        height: "50px",
                                        border: "1.5px solid #C4C4C43D",
                                        borderRadius: "5px",
                                        fontSize: "16px",
                                        color: "#111827",
                                    }}
                                    inputFocusStyle={{ border: "2px solid #2563EB", outline: "none" }}
                                    autoSelect
                                    regexCriteria={/^[0-9]*$/}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-3 mt-8">
                        <Button
                            className="openSansLight text-white text-lg p-2 rounded w-52"
                            text={isSubmitting ? <Loader /> : "Complete Bulk Payout"}
                            ariaLabel="Complete Bulk Payout"
                            disabled={isSubmitting || !getCompleteStepCode()}
                            primary
                            type="button"
                            onClick={handleCompleteStepSubmit}
                        />
                        <Button
                            className="openSansLight text-lg p-2 rounded !border-red-500 !text-red-600 hover:!bg-red-50 hover:!text-red-700"
                            text={isCancelling ? <Loader /> : "Cancel bulk payout"}
                            ariaLabel="Cancel bulk payout"
                            plain
                            medium
                            type="button"
                            disabled={isSubmitting || isCancelling}
                            onClick={handleCancelBulkPayout}
                        />
                    </div>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {bulkPayoutDetails && (
                    <p className="text-sm text-gray-600 text-center">
                        {bulkPayoutDetails.total} recipient{bulkPayoutDetails.total !== 1 ? 's' : ''} verified. Enter the code sent to your email to complete.
                    </p>
                )}
                <div className="space-y-4">
                    <h3 className="text-center text-lg font-medium">Enter verification code</h3>
                    <p className="text-center text-gray-500 text-sm">
                        Please enter the {EMAIL_OTP_LENGTH}-digit code sent to your email
                    </p>
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex justify-center" style={{ flexWrap: 'nowrap' }}>
                                    <PinInput
                                        length={EMAIL_OTP_LENGTH}
                                        initialValue=""
                                        focus
                                        onChange={(value) => field.onChange(value)}
                                        onComplete={(value) => field.onChange(value)}
                                        type="numeric"
                                        inputMode="number"
                                        style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', justifyContent: 'center' }}
                                        inputStyle={{
                                            borderColor: errors.otp?.message ? 'red' : '#e2e8f0',
                                            borderRadius: '8px',
                                            margin: '0 4px',
                                            width: '44px',
                                            height: '50px',
                                        }}
                                        inputFocusStyle={{ borderColor: '#2563eb' }}
                                        autoSelect={true}
                                        regexCriteria={/^[0-9]*$/}
                                    />
                                </div>
                                {errors.otp?.message && (
                                    <p className="text-red-500 text-xs text-center w-full">{errors.otp?.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>
                <div className="flex flex-col items-center gap-3 mt-8">
                    <Button
                        className="openSansLight text-white text-lg p-2 rounded w-52"
                        text={isSubmitting ? <Loader /> : "Complete Bulk Payout"}
                        ariaLabel="Complete Bulk Payout"
                        disabled={isSubmitting || (watch("otp")?.length !== EMAIL_OTP_LENGTH)}
                        primary
                        type="submit"
                    />
                    <Button
                        className="openSansLight text-lg p-2 rounded !border-red-500 !text-red-600 hover:!bg-red-50 hover:!text-red-700"
                        text={isCancelling ? <Loader /> : "Cancel bulk payout"}
                        ariaLabel="Cancel bulk payout"
                        plain
                        medium
                        type="button"
                        disabled={isSubmitting || isCancelling}
                        onClick={handleCancelBulkPayout}
                    />
                </div>
            </form>
        );
    };

    const renderFileUploadStep = () => (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
            <p className="text-sm text-gray-500 mb-5">
                Choose currency, upload your file, then map columns to the required fields.
            </p>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF8E1] dark:bg-[#F0B90B14] border border-[#F0B90B33] mb-5">
                <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-[#F0B90B] text-white text-xs font-bold mt-0.5">
                    !
                </span>
                <div>
                    <p className="text-xs font-semibold text-[#B78A00] dark:text-[#F0B90B] mb-1">
                        Important
                    </p>
                    <p className="text-xs text-[#8B6914] dark:text-[#F0B90B99] leading-relaxed">
                        For best performance, limit each file to {BULK_PAYOUT_RECOMMENDED_MAX} recipients or fewer. For larger payouts, split your list into multiple files of {BULK_PAYOUT_RECOMMENDED_MAX} or fewer and upload in batches.
                    </p>
                </div>
            </div>
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
                                                                className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] ${selectedValue === option.value ? "bg-[#005BB00D]" : ""
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
                        text={isLoadingPreview ? <Loader /> : "Continue"}
                        ariaLabel="Continue"
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

    const formatBulkAmount = (currencyCode: string, raw: string): string => {
        const cleaned = String(raw ?? "").replace(/,/g, "").trim();
        const num = parseFloat(cleaned);
        if (cleaned === "" || isNaN(num)) return raw || "—";
        return formatBalance(num, currencyCode);
    };

    const renderConfirmationModal = () => {
        const currency = watch("currency");
        return (
            <Modal
                isOpen={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                title="Confirm bulk payout"
                className="max-w-4xl"
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
                        <table className="min-w-full divide-y divide-gray-200 text-sm" style={{ minWidth: "640px" }}>
                            <thead className="bg-[#005BB01A]">
                                <tr>
                                    {BULK_PAYOUT_MAPPING_KEYS.map(({ label }) => (
                                        <th
                                            key={label}
                                            className="px-4 py-3 text-left font-semibold text-[#005BB0] whitespace-nowrap"
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
                                                    {key === "amnt"
                                                        ? formatBulkAmount(currency || "NGN", row[headerMapping[key]] ?? "")
                                                        : (row[headerMapping[key]] ?? "—")}
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
                onClose={currentStep === 1 ? undefined : handleClose}
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
