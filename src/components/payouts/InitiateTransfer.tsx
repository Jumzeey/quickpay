import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import FormPhoneInput from "@/components/FormPhoneInput";
import FormSelect from "@/components/FormSelect";
import FormSelectSearch from "@/components/FormSelectSearch";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useEffectFetch } from "@/hooks/useEffectFetch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { getBanks, performNameCheck } from "@/services/bank";
import { BankResponse, getPayoutOptions } from "@/services/payout";
import useAuthentication from "@/stores/useAuthentication";
import usePayout from "@/stores/usePayout";
import useCurrency, { CurrencyOption } from "@/stores/useCurrency";
import { useModuleOptions } from "@/hooks/useModuleAccess";
import { notifyError, notifySuccess, removeCommasFromValue, uuid } from "@/util/utils";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import PinInput from "react-pin-input";
import * as Yup from "yup";
import { TRANSFER_OPTIONS } from "./constants";
import { TransferFormValues, TransferState } from "./types";
import dynamic from "next/dynamic";

const BulkPayout = dynamic(() => import("./BulkPayout"), { ssr: false });

interface InitiateTransferProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

const CODE_LENGTH = 6;
const TOTP_LENGTH = 6;
const RECOVERY_CODE_LENGTH = 10;
const EMAIL_OTP_LENGTH = 6;

const MOBILE_MONEY_PROVIDERS = [
    { value: 'mtn', label: 'MTN' },
    { value: 'airtel', label: 'Airtel' },
    { value: 'vodafone', label: 'Vodafone' }
];

// Currency to country code mapping
const getCountryCode = (currency: string): string => {
    const currencyToCountry: Record<string, string> = {
        'NGN': 'NG',
        'GHS': 'GH',
        'KES': 'KE',
        'ZMW': 'ZM',
        'XOF': 'SN', // Senegal (West African CFA franc)
    };
    return currencyToCountry[currency] || '';
};

const InitiateTransfer: React.FC<InitiateTransferProps> = ({
    isModalOpen,
    closeModal,
    fetchPayoutHistory,
}) => {
    const initialState = {
        selectedOptionName: "",
        isLoading: false,
        isSubmitting: false,
        currentStep: 0,
        banks: [],
        payoutOptions: null,
    }
    const [state, setState] = useState<TransferState>(initialState);
    const [isBulkPayoutModalOpen, setIsBulkPayoutModalOpen] = useState(false);
    const [transferOtpValue, setTransferOtpValue] = useState("");
    const [transferUseRecoveryCode, setTransferUseRecoveryCode] = useState(false);
    const [transferRecoveryCodeValue, setTransferRecoveryCodeValue] = useState("");
    const { initiateInterBankPayout, verifyPayoutOtp } = usePayout();
    const { selectedCurrency, activeCurrencies: userActiveCurrencies, fetchActiveCurrencies } = useCurrency();
    const allowedPayoutCurrencies = useModuleOptions("payout", "single-payout");
    const { totp_enabled } = useAuthentication();

    // Currency names mapping (same as CurrencySwitcher)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const currencyOptions = useMemo(() => {
        const allCodes = userActiveCurrencies.length > 0 ? userActiveCurrencies : ["NGN", "USD", "GHS", "KES", "TZS", "XOF", "ZMW"];
        const allowedSet = allowedPayoutCurrencies.length > 0 ? new Set(allowedPayoutCurrencies) : null;
        return allCodes.map((code) => ({
            value: code as CurrencyOption,
            label: currencyNames[code] || code,
            disabled: allowedSet !== null ? !allowedSet.has(code) : false,
        }));
    }, [userActiveCurrencies, allowedPayoutCurrencies, currencyNames]);

    useEffect(() => {
        fetchActiveCurrencies();
    }, [fetchActiveCurrencies]);

    const defaultCurrency = useMemo(() => {
        const allowed = allowedPayoutCurrencies.length > 0 ? allowedPayoutCurrencies : (userActiveCurrencies.length > 0 ? userActiveCurrencies : ["NGN", "USD"]);
        if (selectedCurrency && allowed.includes(selectedCurrency)) return selectedCurrency;
        const firstAllowed = allowed[0];
        return (firstAllowed as CurrencyOption) || 'NGN';
    }, [selectedCurrency, allowedPayoutCurrencies, userActiveCurrencies]);

    const validationSchema = useMemo(() => {
        const baseAmountValidation = Yup.string()
            .required("Amount is required")
            .test("min-amount", "Amount must be greater than 0", (value) => {
                if (!value) return false;
                const numericValue = parseFloat(removeCommasFromValue(value));
                return numericValue > 0;
            });

        if (state.selectedOptionName === "Same Currency Transfer") {
            // Currency-based validation
            return Yup.object().shape({
                currency: Yup.string().required("Currency is required"),
                amount: baseAmountValidation,
                narration: Yup.string().when("currency", {
                    is: (val: string) => val !== "USD",
                    then: (schema) => schema.required("Narration is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                // Currency-specific validations
                accountNumber: Yup.string()
                    .required("Account number is required")
                    .test("account-number-format", "Invalid account number format", function (value): boolean {
                        if (!value) return false;
                        const currentCurrency = this.parent?.currency;
                        const currentChannel = this.parent?.channel;
                        const cleanValue = value.replace(/[^\d]/g, '');

                        // ZMW: phone number format
                        if (currentCurrency === "ZMW") {
                            return cleanValue.length >= 9 && cleanValue.length <= 15;
                        }
                        // GHS: 10 digits for bank, 12 digits for momo/network
                        if (currentCurrency === "GHS") {
                            if (currentChannel === "bank") {
                                return cleanValue.length === 10;
                            } else if (currentChannel === "momo") {
                                return cleanValue.length === 12;
                            }
                            // If no channel selected yet, allow both
                            return cleanValue.length === 10 || cleanValue.length === 12;
                        }
                        // NGN: 10 digits
                        if (currentCurrency === "NGN") {
                            return cleanValue.length === 10;
                        }
                        // KES: phone number format
                        if (currentCurrency === "KES") {
                            return cleanValue.length >= 9 && cleanValue.length <= 15;
                        }
                        // XOF: phone number format
                        if (currentCurrency === "XOF") {
                            return cleanValue.length >= 9 && cleanValue.length <= 15;
                        }
                        // TZS: phone number format
                        if (currentCurrency === "TZS") {
                            return cleanValue.length >= 9 && cleanValue.length <= 15;
                        }
                        return true;
                    }),
                // Channel selection for GHS, KES, TZS, and XOF
                channel: Yup.string().when("currency", {
                    is: (val: string) => ["GHS", "KES", "TZS", "XOF", "USD"].includes(val),
                    then: (schema) => schema.required("Please select a channel"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                // Bank code for NGN and GHS bank channel
                bank_code: Yup.string().when(["currency", "channel"], {
                    is: (currency: string, channel: string) =>
                        currency === "NGN" || (currency === "GHS" && channel === "bank"),
                    then: (schema) => schema.required("Bank code is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                // Network for GHS, KES, and XOF momo channel
                network: Yup.string().when(["currency", "channel"], {
                    is: (currency: string, channel: string) =>
                        (currency === "GHS" || currency === "KES" || currency === "XOF") && channel === "momo",
                    then: (schema) => schema.required("Network is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                ref_id: Yup.string().when("currency", {
                    is: "NGN",
                    then: (schema) => schema.required("Please validate your account details"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                recipient_name: Yup.string().when("currency", {
                    is: (val: string) => ["KES", "XOF"].includes(val), // NGN uses accountName instead
                    then: (schema) => schema.required("Recipient name is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                // Sender info - required for GHS, NGN, KES, XOF
                sender_name: Yup.string().when("currency", {
                    is: (val: string) => ["GHS", "NGN", "KES", "XOF"].includes(val),
                    then: (schema) => schema.required("Sender name is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                sender_phone: Yup.string().when("currency", {
                    is: (val: string) => ["NGN", "KES", "XOF"].includes(val),
                    then: (schema) => schema.notRequired(), // Optional for NGN, KES, XOF
                    otherwise: (schema) => schema.notRequired(),
                }),
                sender_email: Yup.string().when("currency", {
                    is: (val: string) => ["NGN", "KES", "XOF"].includes(val),
                    then: (schema) => schema.email("Invalid email format").notRequired(),
                    otherwise: (schema) => schema.notRequired(),
                }),
                // Recipient info fields
                recipient_account_name: Yup.string().when("currency", {
                    is: "GHS", // KES and XOF use recipient_name instead
                    then: (schema) => schema.required("Recipient account name is required"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                // KES uses network name for both bank_name and bank_code, so no separate fields needed
                // Account name - auto-filled for NGN and GHS bank channel, not required for GHS momo/KES/XOF/TZS/ZMW
                accountName: Yup.string()
                    .when(["currency", "channel"], {
                        is: (currency: string, channel: string) =>
                            currency === "NGN" ||
                            currency === "GHS" || // GHS: auto-filled for bank, not needed for momo
                            ["KES", "XOF", "TZS", "ZMW"].includes(currency),
                        then: (schema) => schema.notRequired(), // Auto-filled or not needed
                        otherwise: (schema) => schema.required("Account name is required"),
                    }),
            });
        }

        if (state.selectedOptionName === "Cray Balance Transfer") {
            return Yup.object().shape({
                walletId: Yup.string()
                    .required("Wallet ID is required")
                    .min(3, "Wallet ID must be at least 3 characters"),
                accountName: Yup.string().required("Account name is required"),
                amount: baseAmountValidation,
            });
        }

        if (state.selectedOptionName === "Cross Currency Transfer") {
            if (state.currentStep === 1) {
                return Yup.object().shape({
                    amount: baseAmountValidation,
                });
            }
            if (state.currentStep === 2) {
                return Yup.object().shape({
                    amount: baseAmountValidation,
                    targetAccountName: Yup.string().required("Target account name is required"),
                    targetAccountNumber: Yup.string()
                        .required("Target account number is required")
                        .length(10, "Account number must be 10 digits")
                        .matches(/^\d+$/, "Account number must contain only digits"),
                });
            }
        }

        // if (currency === "GHS") {
        //     return Yup.object().shape({
        //         mobileProvider: Yup.string().required("Mobile provider is required"),
        //         phoneNumber: Yup.string()
        //             .required("Phone number is required")
        //             .test("valid-phone", "Please enter a valid phone number", function (value) {
        //                 if (!value) return false;
        //                 return value.length >= 8 && value.length <= 15;
        //             }),
        //         amount: baseAmountValidation,
        //     });
        // }

        if (state.currentStep === 3) {
            if (!totp_enabled) {
                return Yup.object().shape({
                    otp: Yup.string()
                        .required("OTP is required")
                        .length(EMAIL_OTP_LENGTH, `Enter ${EMAIL_OTP_LENGTH}-digit code sent to your email`),
                });
            }
            return Yup.object().shape({});
        }

        return Yup.object().shape({});
    }, [state.selectedOptionName, state.currentStep, totp_enabled]);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        getValues,
        setValue,
        watch
    } = useFormValidation<TransferFormValues & { otp: string }>(validationSchema, {
        defaultValues: {
            amount: "",
            currency: defaultCurrency,
            channel: undefined,
            bank: "",
            bank_code: "",
            network: "",
            ref_id: "",
            accountNumber: "",
            accountName: "",
            walletId: "",
            targetAccountName: "",
            targetAccountNumber: "",
            otp: "",
            mobileProvider: "mtn",
            phoneNumber: "",
            narration: "",
            recipient_name: "",
            countryCode: "",
            sender_name: "",
            sender_phone: "",
            sender_email: "",
            recipient_account_name: "",
            recipient_bank_name: "",
            recipient_bank_code: "",
        },
        mode: 'onChange'
    });

    const watchedCurrency = watch("currency");
    const currency = watchedCurrency || defaultCurrency;
    const accountNumber = watch("accountNumber");
    const selectedBank = watch("bank");
    const selectedBankCode = watch("bank_code");
    const selectedChannel = watch("channel");

    // Track previous currency to detect actual changes
    const prevCurrencyRef = React.useRef<string | undefined>(undefined);

    // Determine the currency to use - always fallback to defaultCurrency
    const effectiveCurrency = React.useMemo(() => {
        return watchedCurrency || defaultCurrency;
    }, [watchedCurrency, defaultCurrency]);

    // Only fetch payout options when on Same Currency Transfer step
    const shouldFetchOptions =
        state.selectedOptionName === "Same Currency Transfer" &&
        !!effectiveCurrency &&
        effectiveCurrency !== "USD";

    // Fetch payout options instead of banks
    const { data: payoutOptionsData, loading: payoutOptionsLoading } = useEffectFetch(
        async () => {
            if (!shouldFetchOptions || !effectiveCurrency) return null;
            try {
                const response = await getPayoutOptions(effectiveCurrency);
                // Handle null response (no payout options available for currency)
                if (!response) {
                    return null;
                }
                // response is { status, message, data: { payout_options: { channels: [...] } } }
                // So we access response.data.payout_options.channels[0]
                const channelData = response?.data?.payout_options?.channels?.[0] || null;
                console.log('Payout options response:', response);
                console.log('Channel data:', channelData);
                return channelData;
            } catch (error) {
                // If error indicates no options available, return null instead of throwing
                console.warn('Error fetching payout options:', error);
                return null;
            }
        },
        [effectiveCurrency, shouldFetchOptions],
        {
            onSuccess: (channelData) => {
                console.log('onSuccess channelData:', channelData);
                if (channelData) {
                    const payoutOpts = {
                        supportsBank: channelData.supportsBank || false,
                        supportsMomo: channelData.supportsMomo || false,
                        banks: channelData.banks || [],
                        networks: channelData.networks || [],
                    };
                    console.log('Setting payoutOptions:', payoutOpts);
                    setState(prev => ({
                        ...prev,
                        payoutOptions: payoutOpts
                    }));
                } else {
                    // No payout options available for this currency
                    setState(prev => ({
                        ...prev,
                        payoutOptions: null
                    }));
                }

                // Only reset channel when currency actually changes (not on initial load)
                if (prevCurrencyRef.current !== undefined && prevCurrencyRef.current !== effectiveCurrency) {
                    setValue("channel", effectiveCurrency === "USD" ? "tron" : undefined);
                    setValue("bank", "");
                    setValue("network", "");
                    setValue("accountNumber", "");
                    setValue("accountName", "");
                    setValue("ref_id", "");
                }
                prevCurrencyRef.current = effectiveCurrency;
            },
            onError: (error) => {
                console.error('Error fetching payout options:', error);
                // Don't show error toast if it's just "no options available" - that's expected for some currencies
                const errorMessage = error?.message || error?.responseText || '';
                if (!errorMessage.includes('No available payout option') &&
                    !errorMessage.includes('Failed to retrieve payout options')) {
                    notifyError(errorMessage || 'Error fetching payout options');
                }
                setState(prev => ({
                    ...prev,
                    payoutOptions: null
                }));
            }
        }
    );

    const bankOptions = useMemo(() => {
        if (!state.payoutOptions?.banks || state.payoutOptions.banks.length === 0) {
            return [];
        }
        return (state.payoutOptions.banks || []).map((bank: any) => ({
            value: bank.bank_code || bank.institutionCode || bank.short_code,
            label: bank.bank_name || bank.institutionName,
        }));
    }, [state.payoutOptions?.banks]);

    const networkOptions = useMemo(() => {
        if (!state.payoutOptions?.networks || state.payoutOptions.networks.length === 0) {
            return [];
        }
        return (state.payoutOptions.networks || []).map((network: any) => ({
            value: network.name, // Network name is used as bank_code in payload
            label: network.name,
        }));
    }, [state.payoutOptions?.networks]);

    const channelOptions = useMemo(() => {
        const options = [];
        console.log('Computing channelOptions, state.payoutOptions:', state.payoutOptions);
        if (state.payoutOptions?.supportsBank) {
            options.push({ value: 'bank', label: 'Bank' });
        }
        if (state.payoutOptions?.supportsMomo) {
            options.push({ value: 'momo', label: 'Mobile Money' });
        }
        console.log('channelOptions result:', options);
        return options;
    }, [state.payoutOptions]);

    const nameCheck = async () => {
        const payload = {
            bank_code: selectedBankCode || selectedBank,
            account_number: accountNumber,
            // if country is gh then pass country_code
            ...(currency === "GHS" && { country_code: "GH" })
        };
        try {
            setState({ ...state, isLoading: true });
            const { account_name, ref_id } = await performNameCheck(payload);
            setValue("accountName", account_name);
            setValue("ref_id", ref_id);
            // For NGN, accountName is used for both account name and recipient_name in payload
            // No need to set recipient_name separately
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            setState({ ...state, isLoading: false });
        }
    };

    useEffect(() => {
        // Validate account name for NGN and GHS bank channel with bank_code
        if (currency === 'NGN' && selectedBankCode && accountNumber.length === 10) {
            nameCheck();
            return;
        }

        // For GHS bank channel, validate when account number is 10 digits and bank_code is selected
        if (currency === 'GHS' && selectedChannel === 'bank' && selectedBankCode && accountNumber.length === 10) {
            nameCheck();
            return;
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountNumber, currency, selectedBankCode, selectedChannel]);

    useEffect(() => {
        if (currency === "USD" && selectedChannel !== "tron") {
            setValue("channel", "tron");
        }
    }, [currency, selectedChannel, setValue]);

    const getTransferOtpCode = (): string | null => {
        if (transferUseRecoveryCode) {
            const trimmed = transferRecoveryCodeValue.trim().toUpperCase();
            return trimmed.length === RECOVERY_CODE_LENGTH && /^[A-Z0-9]+$/.test(trimmed) ? trimmed : null;
        }
        return transferOtpValue.length === TOTP_LENGTH ? transferOtpValue : null;
    };

    const handleFormSubmit = async (values: TransferFormValues & { otp: string }) => {
        console.log('🚀 Form submitted with values:', values);
        console.log('📋 Current state:', state);
        console.log('💰 Currency:', currency);
        console.log('✅ Form errors:', errors);

        setState((prev) => ({ ...prev, isSubmitting: true }));

        // OTP verification step – keep loading state from the start so button stays disabled
        if (state.currentStep === 3) {
            const code = totp_enabled ? getTransferOtpCode() : values.otp;
            const selectedFormCurrency = values.currency || currency;
            const isUsdPayout = selectedFormCurrency === "USD";
            if (!code) {
                if (totp_enabled) {
                    notifyError(transferUseRecoveryCode ? "Enter a valid 10-character recovery code" : "Enter the 6-digit authenticator code");
                } else {
                    notifyError(`Enter the ${EMAIL_OTP_LENGTH}-digit code sent to your email`);
                }
                setState((prev) => ({ ...prev, isSubmitting: false }));
                return;
            }
            try {
                const response = await verifyPayoutOtp({ otp: code, _isUsdtPayout: isUsdPayout } as any);
                if (response?.success) {
                    notifySuccess(response?.message || 'Payout completed successfully!');
                    closeModalAndReset();
                    await fetchPayoutHistory();
                } else {
                    notifyError(response?.message || "Verification failed. Please check the code and try again.");
                }
            } catch (err: any) {
                notifyError(err?.message || "Verification failed. Please try again.");
            } finally {
                setState((prev) => ({ ...prev, isSubmitting: false }));
            }
            return;
        }

        if (state.selectedOptionName === "Cross Currency Transfer" && state.currentStep === 1) {
            setState((prev) => ({ ...prev, currentStep: 2, isSubmitting: false }));
            setValue("targetAccountName", "");
            setValue("targetAccountNumber", "");
            return;
        }

        try {
            // For NGN, require ref_id validation
            if (state.selectedOptionName === "Same Currency Transfer" && currency === "NGN" && !values.ref_id) {
                console.warn('⚠️ NGN payout requires ref_id validation');
                setState((prev) => ({ ...prev, isSubmitting: false }));
                return;
            }

            let payload: any = {};

            if (state.selectedOptionName === "Same Currency Transfer") {
                // Base fields for all currencies
                payload = {
                    customer_reference: uuid(),
                    account_number: values.accountNumber,
                    amount: removeCommasFromValue(values.amount),
                    narration: values.narration || "Payout",
                    currency: values.currency,
                };

                // Currency-specific payload structures
                if (currency === "ZMW") {
                    payload = {
                        ...payload,
                        countryCode: getCountryCode(currency),
                        receipient_info: {
                            account_number: values.accountNumber,
                        },
                    };
                } else if (currency === "GHS") {
                    // GHS can be bank (10 digits) or momo (12 digits)
                    // For bank: use bank_code from bank selection
                    // For momo: use network name as bank_code
                    const bankCode = values.channel === "bank"
                        ? values.bank_code
                        : values.network; // Network name is used as bank_code

                    const recipientAccountName = values.recipient_account_name || values.accountName || "";
                    const senderName = values.sender_name || "";

                    console.log('🇬🇭 Building GHS payload:', {
                        channel: values.channel,
                        bankCode,
                        recipientAccountName,
                        senderName,
                        accountNumber: values.accountNumber
                    });

                    payload = {
                        ...payload,
                        countryCode: getCountryCode(currency), // "GH"
                        receipient_info: {
                            account_name: recipientAccountName,
                            account_number: values.accountNumber,
                            bank_code: bankCode || "",
                        },
                        sender_info: {
                            name: senderName,
                        },
                    };

                    console.log('🇬🇭 GHS payload built:', JSON.stringify(payload, null, 2));
                } else if (currency === "NGN") {
                    payload = {
                        ...payload,
                        bank_code: values.bank_code || values.bank,
                        recipient_name: values.accountName, // Use accountName for recipient_name
                        ref_id: values.ref_id,
                        sender_info: {
                            name: values.sender_name || "",
                            ...(values.sender_phone && { phone: values.sender_phone }),
                            ...(values.sender_email && { email: values.sender_email }),
                        },
                    };
                } else if (currency === "KES") {
                    // Use recipient_name for both top-level recipient_name and receipient_info.account_name
                    // Network name is used for both bank_name and bank_code
                    const recipientName = values.recipient_name || "";
                    const networkName = values.network || ""; // Network name used for both bank_name and bank_code
                    payload = {
                        ...payload,
                        recipient_name: recipientName,
                        sender_info: {
                            name: values.sender_name || "",
                            phone: values.sender_phone || "", // Optional
                            email: values.sender_email || "", // Optional
                        },
                        receipient_info: {
                            account_number: values.accountNumber,
                            account_name: recipientName, // Same as recipient_name
                            bank_name: networkName, // Network name
                            bank_code: networkName.toLowerCase(), // Network name (lowercase) as bank_code
                        },
                        currency: "KES",
                    };
                } else if (currency === "USD") {
                    payload = {
                        amount: Number(removeCommasFromValue(values.amount)),
                        account_number: values.accountNumber,
                    };
                } else if (currency === "TZS") {
                    // TZS requires channel selection
                    payload = {
                        ...payload,
                        // Add TZS-specific fields based on channel if needed
                    };
                } else if (currency === "XOF") {
                    // Use recipient_name for both top-level recipient_name and receipient_info.account_name
                    const recipientName = values.recipient_name || "";
                    payload = {
                        ...payload,
                        recipient_name: recipientName,
                        sender_info: {
                            name: values.sender_name || "",
                            phone: values.sender_phone || "", // Optional
                            email: values.sender_email || "", // Optional
                        },
                        receipient_info: {
                            account_number: values.accountNumber,
                            account_name: recipientName, // Same as recipient_name
                            // bank_name and bank_code removed for XOF
                        },
                        currency: "XOF",
                    };
                }
            } else if (state.selectedOptionName === "Cross Currency Transfer" && state.currentStep === 2) {
                payload = {
                    amount: removeCommasFromValue(values.amount),
                    targetAccountName: values.targetAccountName,
                    targetAccountNumber: values.targetAccountNumber,
                };
            } else if (state.selectedOptionName === "Cray Balance Transfer") {
                payload = {
                    walletId: values.walletId,
                    accountName: values.accountName,
                };
            }

            console.log('📦 Final payload:', payload);
            console.log('🌐 Calling initiateInterBankPayout with payload:', JSON.stringify(payload, null, 2));

            // Check if payload is empty or missing required fields
            if (!payload || Object.keys(payload).length === 0) {
                console.error('❌ Payload is empty! Cannot proceed with API call.');
                notifyError('Invalid form data. Please check all required fields are filled.');
                setState((prev) => ({ ...prev, isSubmitting: false }));
                return;
            }

            // Check if required base fields are present
            if (!payload.account_number || !payload.amount || (currency !== "USD" && !payload.currency)) {
                console.error('❌ Payload missing required base fields:', {
                    account_number: payload.account_number,
                    amount: payload.amount,
                    currency: payload.currency
                });
                notifyError('Missing required fields. Please fill in all required information.');
                setState((prev) => ({ ...prev, isSubmitting: false }));
                return;
            }

            // GHS-specific validation - ensure all required fields are present
            if (currency === "GHS") {
                if (!values.channel) {
                    console.error('❌ GHS requires channel selection');
                    notifyError('Please select a channel (Bank or Mobile Money)');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
                if (values.channel === "bank" && !values.bank_code) {
                    console.error('❌ GHS bank channel requires bank_code');
                    notifyError('Please select a bank');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
                if (values.channel === "momo" && !values.network) {
                    console.error('❌ GHS momo channel requires network');
                    notifyError('Please select a network');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
                if (!values.recipient_account_name && !values.accountName) {
                    console.error('❌ GHS requires recipient account name');
                    notifyError('Recipient account name is required');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
                if (!values.sender_name) {
                    console.error('❌ GHS requires sender name');
                    notifyError('Sender name is required');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }

                // Verify GHS payload structure matches expected format
                if (!payload.receipient_info || !payload.receipient_info.account_name) {
                    console.error('❌ GHS payload missing receipient_info.account_name');
                    notifyError('Recipient account name is required');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
                if (!payload.receipient_info.bank_code) {
                    console.error('❌ GHS payload missing receipient_info.bank_code');
                    notifyError('Bank/Network code is required');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
                if (!payload.sender_info || !payload.sender_info.name) {
                    console.error('❌ GHS payload missing sender_info.name');
                    notifyError('Sender name is required');
                    setState((prev) => ({ ...prev, isSubmitting: false }));
                    return;
                }
            }

            const response = await initiateInterBankPayout({ ...payload, _isUsdtPayout: currency === "USD" });
            console.log('📥 API Response:', response);
            if (response?.message) {
                notifySuccess(response?.message);
                // Move to OTP step
                setState(prev => ({ ...prev, currentStep: 3 }));
            }
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            setState((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    const resetForm = () => {
        reset({
            amount: "",
            currency: defaultCurrency,
            channel: undefined,
            bank: "",
            bank_code: "",
            network: "",
            ref_id: "",
            accountNumber: "",
            accountName: "",
            walletId: "",
            targetAccountName: "",
            targetAccountNumber: "",
            otp: "",
            mobileProvider: "mtn",
            phoneNumber: "",
            narration: "",
            recipient_name: "",
            countryCode: "",
            sender_name: "",
            sender_phone: "",
            sender_email: "",
            recipient_account_name: "",
            recipient_bank_name: "",
            recipient_bank_code: "",
        });
    };

    const closeModalAndReset = () => {
        resetForm();
        setTransferOtpValue("");
        setTransferRecoveryCodeValue("");
        setTransferUseRecoveryCode(false);

        if (state.currentStep === 0 || state.currentStep === 3) {
            if (state.currentStep === 3) {
                // If on the final step, reset to initial state
                setState(initialState);
            }
            return closeModal();
        }

        setState((prev) => ({
            ...prev,
            currentStep: prev.currentStep - 1,
            selectedOptionName: prev.currentStep === 1 ? "" : prev.selectedOptionName,
            isLoading: false,
            isSubmitting: false,
        }));
    };

    const handleOptionClick = (option: typeof TRANSFER_OPTIONS[0]) => {
        // If Bulk Payout is selected, open BulkPayout modal instead
        if (option.name === 'Bulk Payout') {
            setIsBulkPayoutModalOpen(true);
            return;
        }

        setState((prev) => ({
            ...prev,
            selectedOptionName: option.name,
            currentStep: 1,
            isSubmitting: false,
            isLoading: false,
        }));

        resetForm();
    };

    const renderTransferOptions = () => (
        <ul className="space-y-2">
            {TRANSFER_OPTIONS.map((option) => (
                <li key={option.id}>
                    <button
                        type="button"
                        className={`w-full flex items-center justify-between font-semibold text-sm text-black py-5 ${option !== TRANSFER_OPTIONS[TRANSFER_OPTIONS.length - 1] ? "border-b border-[#C4C4C452]" : ""}`}
                        onClick={() => handleOptionClick(option)}
                    >
                        {option.name}
                        <Image
                            src="/images/arrow-right.svg"
                            alt="Arrow Image"
                            width={6}
                            height={8}
                            priority
                        />
                    </button>
                </li>
            ))}
        </ul>
    );

    const renderNGNForm = () => (
        <>
            <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Account Number"
                        id="accountNumber"
                        type="text"
                        htmlFor="accountNumber"
                        isLoading={state.isLoading}
                        loadingText="Loading details..."
                        maxLength={10}
                        error={errors.accountNumber?.message}
                        touched={!!errors.accountNumber}
                        {...field}
                    />
                )}
            />
        </>
    );

    const renderGHSForm = () => (
        <>
            <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Account Number"
                        id="accountNumber"
                        type="text"
                        htmlFor="accountNumber"
                        isLoading={state.isLoading}
                        loadingText="Loading details..."
                        error={errors.accountNumber?.message}
                        touched={!!errors.accountNumber}
                        {...field}
                    />
                )}
            />
        </>
    );

    const renderSameCurrencyForm = () => {
        return (
            <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
                console.error('❌ Form validation errors preventing submission:', errors);
                console.error('📋 Current form values:', getValues());
                console.error('💰 Selected currency:', currency);
                console.error('📊 Form state:', { isValid, errors });
            })} className="space-y-5">
                {/* Currency Selection */}
                <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                        <FormSelect
                            id="currency"
                            htmlFor="currency"
                            label="Select Currency"
                            placeholder="Select Currency"
                            options={currencyOptions}
                            error={errors.currency?.message}
                            touched={!!errors.currency}
                            {...field}
                            value={field.value || defaultCurrency}
                            onChange={(event) => {
                                const selectedValue = event?.target?.value;
                                field.onChange(selectedValue);
                                // Reset all fields when currency changes
                                setValue("channel", selectedValue === "USD" ? "tron" : undefined);
                                setValue("bank", "");
                                setValue("bank_code", "");
                                setValue("network", "");
                                setValue("accountNumber", "");
                                setValue("accountName", "");
                                setValue("ref_id", "");
                                setValue("recipient_name", "");
                                setValue("sender_name", "");
                                setValue("sender_phone", "");
                                setValue("sender_email", "");
                                setValue("recipient_account_name", "");
                                setValue("recipient_bank_code", "");
                                setValue("recipient_bank_name", "");
                            }}
                        />
                    )}
                />

                {/* NGN Specific Fields */}
                {currency === "NGN" && (
                    <>
                        <Controller
                            name="bank_code"
                            control={control}
                            render={({ field }) => (
                                <FormSelectSearch
                                    id="bank_code"
                                    htmlFor="bank_code"
                                    label="Select Bank"
                                    isLoading={payoutOptionsLoading}
                                    loadingText="Loading banks..."
                                    placeholder={payoutOptionsLoading ? "Loading banks..." : "Search banks..."}
                                    options={bankOptions}
                                    error={errors.bank_code?.message}
                                    touched={!!errors.bank_code}
                                    disabled={payoutOptionsLoading}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Account Number"
                                    id="accountNumber"
                                    type="text"
                                    htmlFor="accountNumber"
                                    isLoading={state.isLoading}
                                    loadingText="Loading details..."
                                    maxLength={10}
                                    error={errors.accountNumber?.message}
                                    touched={!!errors.accountNumber}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="accountName"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Account Name"
                                    id="accountName"
                                    type="text"
                                    htmlFor="accountName"
                                    error={errors.accountName?.message}
                                    touched={!!errors.accountName}
                                    readOnly
                                    disabled
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Name"
                                    id="sender_name"
                                    type="text"
                                    htmlFor="sender_name"
                                    error={errors.sender_name?.message}
                                    touched={!!errors.sender_name}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_phone"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Phone (Optional)"
                                    id="sender_phone"
                                    type="text"
                                    htmlFor="sender_phone"
                                    error={errors.sender_phone?.message}
                                    touched={!!errors.sender_phone}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_email"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Email (Optional)"
                                    id="sender_email"
                                    type="email"
                                    htmlFor="sender_email"
                                    error={errors.sender_email?.message}
                                    touched={!!errors.sender_email}
                                    {...field}
                                />
                            )}
                        />
                    </>
                )}

                {/* GHS Specific Fields */}
                {currency === "GHS" && (
                    <>
                        <Controller
                            name="channel"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    id="channel"
                                    htmlFor="channel"
                                    label="Select Channel"
                                    placeholder={payoutOptionsLoading ? "Loading channels..." : channelOptions.length > 0 ? "Select Channel" : "No channels available"}
                                    options={channelOptions}
                                    error={errors.channel?.message}
                                    touched={!!errors.channel}
                                    isLoading={payoutOptionsLoading}
                                    disabled={payoutOptionsLoading || channelOptions.length === 0}
                                    {...field}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        // Reset dependent fields when channel changes
                                        setValue("bank_code", "");
                                        setValue("network", "");
                                        setValue("accountNumber", "");
                                        setValue("accountName", "");
                                        setValue("recipient_account_name", "");
                                    }}
                                />
                            )}
                        />

                        {watch("channel") === "bank" && (
                            <Controller
                                name="bank_code"
                                control={control}
                                render={({ field }) => (
                                    <FormSelectSearch
                                        id="bank_code"
                                        htmlFor="bank_code"
                                        label="Select Bank"
                                        isLoading={payoutOptionsLoading}
                                        loadingText="Loading banks..."
                                        placeholder={payoutOptionsLoading ? "Loading banks..." : "Search banks..."}
                                        options={bankOptions}
                                        error={errors.bank_code?.message}
                                        touched={!!errors.bank_code}
                                        disabled={payoutOptionsLoading}
                                        {...field}
                                    />
                                )}
                            />
                        )}

                        {watch("channel") === "momo" && (
                            <Controller
                                name="network"
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        id="network"
                                        htmlFor="network"
                                        label="Select Network"
                                        placeholder="Select Network"
                                        options={networkOptions}
                                        error={errors.network?.message}
                                        touched={!!errors.network}
                                        disabled={payoutOptionsLoading}
                                        {...field}
                                    />
                                )}
                            />
                        )}

                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Account Number"
                                    id="accountNumber"
                                    type="text"
                                    htmlFor="accountNumber"
                                    maxLength={watch("channel") === "bank" ? 10 : 12}
                                    isLoading={state.isLoading && watch("channel") === "bank"}
                                    loadingText="Loading details..."
                                    error={errors.accountNumber?.message}
                                    touched={!!errors.accountNumber}
                                    {...field}
                                />
                            )}
                        />

                        {watch("channel") === "bank" && (
                            <Controller
                                name="accountName"
                                control={control}
                                render={({ field }) => (
                                    <FormInput
                                        label="Account Name"
                                        id="accountName"
                                        type="text"
                                        htmlFor="accountName"
                                        error={errors.accountName?.message}
                                        touched={!!errors.accountName}
                                        readOnly
                                        disabled
                                        {...field}
                                    />
                                )}
                            />
                        )}

                        <Controller
                            name="recipient_account_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Recipient Account Name"
                                    id="recipient_account_name"
                                    type="text"
                                    htmlFor="recipient_account_name"
                                    error={errors.recipient_account_name?.message}
                                    touched={!!errors.recipient_account_name}
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="sender_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Name"
                                    id="sender_name"
                                    type="text"
                                    htmlFor="sender_name"
                                    error={errors.sender_name?.message}
                                    touched={!!errors.sender_name}
                                    {...field}
                                />
                            )}
                        />
                    </>
                )}

                {/* USD (USDT) Specific Fields */}
                {currency === "USD" && (
                    <>
                        <Controller
                            name="channel"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    id="channel"
                                    htmlFor="channel"
                                    label="Select Channel"
                                    placeholder="Select Channel"
                                    options={[{ value: "tron", label: "TRON" }]}
                                    error={errors.channel?.message}
                                    touched={!!errors.channel}
                                    {...field}
                                    value={field.value || "tron"}
                                    disabled
                                    onChange={() => field.onChange("tron")}
                                />
                            )}
                        />
                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Wallet Address"
                                    id="accountNumber"
                                    type="text"
                                    htmlFor="accountNumber"
                                    error={errors.accountNumber?.message}
                                    touched={!!errors.accountNumber}
                                    {...field}
                                />
                            )}
                        />
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF8E1] border border-[#F0B90B33]">
                            <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-[#F0B90B] text-white text-xs font-bold mt-0.5">
                                !
                            </span>
                            <div>
                                <p className="text-xs font-semibold text-[#B78A00] mb-1">
                                    Important
                                </p>
                                <p className="text-xs text-[#8B6914] leading-relaxed">
                                    Only send <strong>USDT</strong> on the <strong>TRON</strong> network to this address.
                                    Sending any other token or using a different network may result in permanent loss of funds.
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* ZMW Specific Fields */}
                {currency === "ZMW" && (
                    <Controller
                        name="accountNumber"
                        control={control}
                        render={({ field }) => (
                            <FormPhoneInput
                                label="Phone Number"
                                id="accountNumber"
                                htmlFor="accountNumber"
                                error={errors.accountNumber?.message}
                                touched={!!errors.accountNumber}
                                country="zm"
                                onlyCountries={["zm"]}
                                {...field}
                            />
                        )}
                    />
                )}

                {/* KES Specific Fields */}
                {currency === "KES" && (
                    <>
                        <Controller
                            name="channel"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    id="channel"
                                    htmlFor="channel"
                                    label="Select Channel"
                                    placeholder={payoutOptionsLoading ? "Loading channels..." : channelOptions.length > 0 ? "Select Channel" : "No channels available"}
                                    options={channelOptions}
                                    error={errors.channel?.message}
                                    touched={!!errors.channel}
                                    isLoading={payoutOptionsLoading}
                                    disabled={payoutOptionsLoading || channelOptions.length === 0}
                                    {...field}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        // Reset dependent fields when channel changes
                                        setValue("network", "");
                                        setValue("accountNumber", "");
                                    }}
                                />
                            )}
                        />

                        {watch("channel") === "momo" && (
                            <Controller
                                name="network"
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        id="network"
                                        htmlFor="network"
                                        label="Select Network"
                                        placeholder="Select Network"
                                        options={networkOptions}
                                        error={errors.network?.message}
                                        touched={!!errors.network}
                                        disabled={payoutOptionsLoading}
                                        {...field}
                                    />
                                )}
                            />
                        )}

                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <FormPhoneInput
                                    label="Phone Number"
                                    id="accountNumber"
                                    htmlFor="accountNumber"
                                    error={errors.accountNumber?.message}
                                    touched={!!errors.accountNumber}
                                    country="ke"
                                    onlyCountries={["ke"]}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="recipient_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Recipient Name"
                                    id="recipient_name"
                                    type="text"
                                    htmlFor="recipient_name"
                                    error={errors.recipient_name?.message}
                                    touched={!!errors.recipient_name}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Name"
                                    id="sender_name"
                                    type="text"
                                    htmlFor="sender_name"
                                    error={errors.sender_name?.message}
                                    touched={!!errors.sender_name}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_phone"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Phone (Optional)"
                                    id="sender_phone"
                                    type="text"
                                    htmlFor="sender_phone"
                                    error={errors.sender_phone?.message}
                                    touched={!!errors.sender_phone}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_email"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Email (Optional)"
                                    id="sender_email"
                                    type="email"
                                    htmlFor="sender_email"
                                    error={errors.sender_email?.message}
                                    touched={!!errors.sender_email}
                                    {...field}
                                />
                            )}
                        />
                    </>
                )}

                {/* TZS Specific Fields */}
                {currency === "TZS" && (
                    <>
                        <Controller
                            name="channel"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    id="channel"
                                    htmlFor="channel"
                                    label="Select Channel"
                                    placeholder={payoutOptionsLoading ? "Loading channels..." : channelOptions.length > 0 ? "Select Channel" : "No channels available"}
                                    options={channelOptions}
                                    error={errors.channel?.message}
                                    touched={!!errors.channel}
                                    isLoading={payoutOptionsLoading}
                                    disabled={payoutOptionsLoading || channelOptions.length === 0}
                                    {...field}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        // Reset dependent fields when channel changes
                                        setValue("accountNumber", "");
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <FormPhoneInput
                                    label="Account Number"
                                    id="accountNumber"
                                    htmlFor="accountNumber"
                                    error={errors.accountNumber?.message}
                                    touched={!!errors.accountNumber}
                                    country="tz"
                                    onlyCountries={["tz"]}
                                    {...field}
                                />
                            )}
                        />
                    </>
                )}

                {/* XOF Specific Fields */}
                {currency === "XOF" && (
                    <>
                        <Controller
                            name="channel"
                            control={control}
                            render={({ field }) => (
                                <FormSelect
                                    id="channel"
                                    htmlFor="channel"
                                    label="Select Channel"
                                    placeholder={payoutOptionsLoading ? "Loading channels..." : channelOptions.length > 0 ? "Select Channel" : "No channels available"}
                                    options={channelOptions}
                                    error={errors.channel?.message}
                                    touched={!!errors.channel}
                                    isLoading={payoutOptionsLoading}
                                    disabled={payoutOptionsLoading || channelOptions.length === 0}
                                    {...field}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        // Reset dependent fields when channel changes
                                        setValue("network", "");
                                        setValue("accountNumber", "");
                                    }}
                                />
                            )}
                        />

                        {watch("channel") === "momo" && (
                            <Controller
                                name="network"
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        id="network"
                                        htmlFor="network"
                                        label="Select Network"
                                        placeholder="Select Network"
                                        options={networkOptions}
                                        error={errors.network?.message}
                                        touched={!!errors.network}
                                        disabled={payoutOptionsLoading}
                                        {...field}
                                    />
                                )}
                            />
                        )}

                        <Controller
                            name="accountNumber"
                            control={control}
                            render={({ field }) => (
                                <FormPhoneInput
                                    label="Phone Number"
                                    id="accountNumber"
                                    htmlFor="accountNumber"
                                    error={errors.accountNumber?.message}
                                    touched={!!errors.accountNumber}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="recipient_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Recipient Name"
                                    id="recipient_name"
                                    type="text"
                                    htmlFor="recipient_name"
                                    error={errors.recipient_name?.message}
                                    touched={!!errors.recipient_name}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_name"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Name"
                                    id="sender_name"
                                    type="text"
                                    htmlFor="sender_name"
                                    error={errors.sender_name?.message}
                                    touched={!!errors.sender_name}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_phone"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Phone (Optional)"
                                    id="sender_phone"
                                    type="text"
                                    htmlFor="sender_phone"
                                    error={errors.sender_phone?.message}
                                    touched={!!errors.sender_phone}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="sender_email"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label="Sender Email (Optional)"
                                    id="sender_email"
                                    type="email"
                                    htmlFor="sender_email"
                                    error={errors.sender_email?.message}
                                    touched={!!errors.sender_email}
                                    {...field}
                                />
                            )}
                        />
                    </>
                )}

                {/* Common Fields - Amount and Narration */}
                <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label="Amount"
                            id="amount"
                            type="text"
                            htmlFor="amount"
                            error={errors.amount?.message}
                            touched={!!errors.amount}
                            numberOnly
                            {...field}
                        />
                    )}
                />

                {currency !== "USD" && (
                    <Controller
                        name="narration"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Narration"
                                id="narration"
                                type="text"
                                htmlFor="narration"
                                error={errors.narration?.message}
                                touched={!!errors.narration}
                                {...field}
                            />
                        )}
                    />
                )}

                <div className="pt-10 w-52">
                    <Button
                        className="openSansLight text-white text-lg p-2 rounded w-full"
                        text={state.isSubmitting ? <Loader /> : "Initiate Transfer"}
                        ariaLabel="Initiate Transfer"
                        disabled={
                            state.isSubmitting ||
                            state.isLoading ||
                            !currency ||
                            // Disable if channel is required but not selected or not available
                            (["GHS", "KES", "TZS", "XOF", "USD"].includes(currency) && (!selectedChannel || (currency !== "USD" && channelOptions.length === 0)))
                        }
                        primary
                        type="submit"
                    />
                </div>
            </form>
        );
    };

    const renderCrayBalanceForm = () => (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <Controller
                name="walletId"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Cray Wallet ID"
                        id="walletId"
                        type="text"
                        htmlFor="walletId"
                        maxLength={10}
                        error={errors.walletId?.message}
                        {...field}
                    />
                )}
            />

            <Controller
                name="accountName"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Account Name"
                        id="accountName"
                        type="text"
                        htmlFor="accountName"
                        error={errors.accountName?.message}
                        readOnly
                        {...field}
                    />
                )}
            />

            <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Amount"
                        id="amount"
                        type="text"
                        htmlFor="amount"
                        error={errors.amount?.message}
                        numberOnly
                        {...field}
                    />
                )}
            />

            <div className="pt-10 w-52">
                <Button
                    className="openSansLight text-white text-lg p-2 rounded w-full"
                    text={state.isSubmitting ? <Loader /> : "Initiate Transfer"}
                    ariaLabel="Initiate Transfer"
                    disabled={state.isSubmitting || state.isLoading}
                    primary
                    type="submit"
                />
            </div>
        </form>
    );

    const renderCrossCurrencyForm = () => {
        if (state.currentStep === 1) {
            return (
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Amount"
                                id="amount"
                                type="text"
                                htmlFor="amount"
                                error={errors.amount?.message}
                                numberOnly
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                            />
                        )}
                    />

                    <Button
                        className="openSansLight text-white mt-5 text-xs p-2 rounded w-full"
                        text={state.isSubmitting ? <Loader /> : "Continue"}
                        ariaLabel="Continue to next step"
                        disabled={!isValid || state.isSubmitting || state.isLoading}
                        primary
                        type="submit"
                    />
                </form>
            );
        }

        if (state.currentStep === 2) {
            return (
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                    <Controller
                        name="amount"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Amount"
                                id="amount"
                                type="text"
                                htmlFor="amount"
                                error={errors.amount?.message}
                                numberOnly
                                readOnly
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                            />
                        )}
                    />

                    <Controller
                        name="targetAccountName"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Target Account Name"
                                id="targetAccountName"
                                type="text"
                                htmlFor="targetAccountName"
                                error={errors.targetAccountName?.message}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                            />
                        )}
                    />

                    <Controller
                        name="targetAccountNumber"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Target Account Number"
                                id="targetAccountNumber"
                                type="text"
                                htmlFor="targetAccountNumber"
                                maxLength={10}
                                error={errors.targetAccountNumber?.message}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                            />
                        )}
                    />

                    <div className="pt-10 w-52">
                        <Button
                            className="openSansLight text-white text-lg p-2 rounded w-full"
                            text={state.isSubmitting ? <Loader /> : "Initiate Transfer"}
                            ariaLabel="Initiate Transfer"
                            disabled={state.isSubmitting || state.isLoading}
                            primary
                            type="submit"
                        />
                    </div>
                </form>
            );
        }

        return null;
    };

    const handleOtpStepSubmit = () => {
        if (totp_enabled) {
            const code = getTransferOtpCode();
            if (!code) return;
            handleFormSubmit({ ...getValues(), otp: code } as TransferFormValues & { otp: string });
        } else {
            handleSubmit(handleFormSubmit)();
        }
    };

    const renderOtpVerificationStep = () => {
        if (totp_enabled) {
            return (
                <div className="space-y-5">
                    <div className="space-y-4">
                        <h3 className="text-center text-lg font-medium">
                            {transferUseRecoveryCode ? "Enter recovery code" : "Enter authenticator code"}
                        </h3>
                        <p className="text-center text-gray-500 text-sm">
                            {transferUseRecoveryCode
                                ? "Enter one of the 10-character recovery codes you saved when you set up 2FA."
                                : "Enter the 6-digit code from your authenticator app to verify the transfer."}
                        </p>
                        <div className="mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setTransferUseRecoveryCode((prev: boolean) => !prev);
                                    setTransferOtpValue("");
                                    setTransferRecoveryCodeValue("");
                                }}
                                className="text-sm font-medium text-primary hover:text-blue-700"
                            >
                                {transferUseRecoveryCode ? "Use authenticator code" : "Use a backup code"}
                            </button>
                        </div>
                        {transferUseRecoveryCode ? (
                            <div className="flex flex-col">
                                <label htmlFor="transfer-recovery-code" className="text-sm font-medium text-[#111827] mb-1">
                                    Recovery code
                                </label>
                                <input
                                    id="transfer-recovery-code"
                                    type="text"
                                    inputMode="text"
                                    autoComplete="one-time-code"
                                    maxLength={RECOVERY_CODE_LENGTH}
                                    value={transferRecoveryCodeValue}
                                    onChange={(e) =>
                                        setTransferRecoveryCodeValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
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
                                    onChange={(value) => setTransferOtpValue(value)}
                                    onComplete={(value) => setTransferOtpValue(value)}
                                    style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}
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
                    <div className="flex justify-center mt-8">
                        <Button
                            className="openSansLight text-white text-lg p-2 rounded w-52"
                            text={state.isSubmitting ? <Loader /> : "Verify & Complete"}
                            ariaLabel="Verify and complete transfer"
                            disabled={state.isSubmitting || !getTransferOtpCode()}
                            primary
                            type="button"
                            onClick={handleOtpStepSubmit}
                        />
                    </div>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                <div className="space-y-4">
                    <h3 className="text-center text-lg font-medium">Enter verification code</h3>
                    <p className="text-center text-gray-500 text-sm">
                        Please enter the {EMAIL_OTP_LENGTH}-digit code sent to your email
                    </p>
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2 flex items-center justify-center">
                                <PinInput
                                    length={EMAIL_OTP_LENGTH}
                                    initialValue=""
                                    focus
                                    onChange={(value) => field.onChange(value)}
                                    onComplete={(value) => field.onChange(value)}
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
                                    <p className="text-red-500 text-xs">{errors.otp?.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>
                <Button
                    className="openSansLight text-white mt-8 text-lg p-2 rounded w-52"
                    text={state.isSubmitting ? <Loader /> : "Verify & Complete"}
                    ariaLabel="Verify OTP"
                    disabled={state.isSubmitting || (watch("otp")?.length !== EMAIL_OTP_LENGTH)}
                    primary
                    type="submit"
                />
            </form>
        );
    };

    const renderStepContent = () => {
        if (state.currentStep === 0) return renderTransferOptions();
        if (state.currentStep === 3) return renderOtpVerificationStep();

        if (state.currentStep >= 1) {
            switch (state.selectedOptionName) {
                case "Same Currency Transfer":
                    return renderSameCurrencyForm();
                case "Cray Balance Transfer":
                    return renderCrayBalanceForm();
                case "Cross Currency Transfer":
                    return renderCrossCurrencyForm();
                default:
                    return null;
            }
        }

        return null;
    };

    const getModalTitle = () => {
        if (state.currentStep === 0) return "Initiate Payout";
        if (state.currentStep === 3) return "Verify Transfer";
        if (state.selectedOptionName === "Cross Currency Transfer" && state.currentStep === 2) {
            return "Target Account Details";
        }
        return state.selectedOptionName || "Transfer Details";
    };

    return (
        <>
            <Modal
                isOpen={isModalOpen}
                onClose={closeModalAndReset}
                title={getModalTitle()}
                className={state.currentStep === 1 && state.selectedOptionName === "Cross Currency Transfer" ? "max-w-lg" : ""}
            >
                <div className="mt-5">{renderStepContent()}</div>
            </Modal>

            <BulkPayout
                isModalOpen={isBulkPayoutModalOpen}
                closeModal={() => setIsBulkPayoutModalOpen(false)}
                fetchPayoutHistory={fetchPayoutHistory}
            />
        </>
    );
};

export default InitiateTransfer;
