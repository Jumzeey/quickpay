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
import usePayout from "@/stores/usePayout";
import useCurrency, { CurrencyOption } from "@/stores/useCurrency";
import { notifyError, notifySuccess, removeCommasFromValue, uuid } from "@/util/utils";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import PinInput from "react-pin-input";
import * as Yup from "yup";
import { TRANSFER_OPTIONS } from "./constants";
import { TransferFormValues, TransferState } from "./types";
import BulkPayout from "./BulkPayout";

interface InitiateTransferProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

const CODE_LENGTH = 6;

const MOBILE_MONEY_PROVIDERS = [
    { value: 'mtn', label: 'MTN' },
    { value: 'airtel', label: 'Airtel' },
    { value: 'vodafone', label: 'Vodafone' }
];

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
    const { initiateInterBankPayout, verifyPayoutOtp } = usePayout();
    const { selectedCurrency, activeCurrencies, fetchActiveCurrencies } = useCurrency();

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

    // Generate currency options from active currencies, excluding USD
    const currencyOptions = useMemo(() => {
        return activeCurrencies
            .filter((code) => code !== 'USD') // Hide USD from payout currency list
            .map((code) => ({
                value: code as CurrencyOption,
                label: currencyNames[code] || code,
            }));
    }, [activeCurrencies, currencyNames]);

    // Fetch active currencies on mount
    useEffect(() => {
        fetchActiveCurrencies();
    }, [fetchActiveCurrencies]);

    // Get default currency (use selectedCurrency, fallback to first available or NGN)
    const defaultCurrency = useMemo(() => {
        if (selectedCurrency && activeCurrencies.includes(selectedCurrency)) {
            return selectedCurrency;
        }
        const firstAvailable = activeCurrencies[0];
        return (firstAvailable as CurrencyOption) || 'NGN';
    }, [selectedCurrency, activeCurrencies]);

    const validationSchema = useMemo(() => {
        const baseAmountValidation = Yup.string()
            .required("Amount is required")
            .test("min-amount", "Amount must be greater than 0", (value) => {
                if (!value) return false;
                const numericValue = parseFloat(removeCommasFromValue(value));
                return numericValue > 0;
            });

        if (state.selectedOptionName === "Same Currency Transfer") {
            return Yup.object().shape({
                channel: Yup.string().required("Please select a channel"),
                bank: Yup.string().when("channel", {
                    is: "bank",
                    then: (schema) => schema.required("Please select a bank"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                network: Yup.string().when("channel", {
                    is: "momo",
                    then: (schema) => schema.required("Please select a network"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                ref_id: Yup.string().when("channel", {
                    is: "bank",
                    then: (schema) => schema.required("Please validate your account details"),
                    otherwise: (schema) => schema.notRequired(),
                }),
                accountNumber: Yup.string()
                    .when("channel", {
                        is: "bank",
                        then: (schema) => schema
                            .required("Account number is required")
                            .test("account-number-length", "Account number must be 10 digits for NGN or 12 digits for GHS", function (value): boolean {
                                if (!value) return false;
                                const currentCurrency = this.parent?.currency;
                                const isNGN: boolean = currentCurrency === "NGN";
                                return isNGN ? value.length === 10 : value.length === 12;
                            })
                            .matches(/^\d+$/, "Account number must contain only digits"),
                        otherwise: (schema) => schema
                            .when("channel", {
                                is: "momo",
                                then: (schema) => schema
                                    .required("Phone number is required")
                                    .test("phone-number-length", "Please enter a valid phone number", function (value): boolean {
                                        if (!value) return false;
                                        // Remove any formatting characters
                                        const cleanValue = value.replace(/[^\d]/g, '');
                                        return cleanValue.length >= 8 && cleanValue.length <= 15;
                                    }),
                                otherwise: (schema) => schema.notRequired(),
                            }),
                    }),
                accountName: Yup.string()
                    .when("channel", {
                        is: "bank",
                        then: (schema) => schema.required("Account name is required"),
                        otherwise: (schema) => schema.when("channel", {
                            is: "momo",
                            then: (schema) => schema.required("Account name is required"),
                            otherwise: (schema) => schema.notRequired(),
                        }),
                    }),
                amount: baseAmountValidation,
                narration: Yup.string(),
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

        if (state.currentStep === 3) { // OTP step
            return Yup.object().shape({
                otp: Yup.string()
                    .required("OTP is required")
                    .length(CODE_LENGTH, `OTP must be ${CODE_LENGTH} digits`)
                    .matches(/^\d+$/, "OTP must contain only digits"),
            });
        }

        return Yup.object().shape({});
    }, [state.selectedOptionName, state.currentStep]);

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
        },
        mode: 'onChange'
    });

    const watchedCurrency = watch("currency");
    const currency = watchedCurrency || defaultCurrency;
    const accountNumber = watch("accountNumber");
    const selectedBank = watch("bank");
    const selectedChannel = watch("channel");

    // Track previous currency to detect actual changes
    const prevCurrencyRef = React.useRef<string | undefined>(undefined);

    // Determine the currency to use - always fallback to defaultCurrency
    const effectiveCurrency = React.useMemo(() => {
        return watchedCurrency || defaultCurrency;
    }, [watchedCurrency, defaultCurrency]);

    // Only fetch payout options when on Same Currency Transfer step
    const shouldFetchOptions = state.selectedOptionName === "Same Currency Transfer" && !!effectiveCurrency;

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
                    setValue("channel", undefined);
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
            value: bank.institutionCode || bank.bank_code,
            label: bank.institutionName || bank.bank_name,
        }));
    }, [state.payoutOptions?.banks]);

    const networkOptions = useMemo(() => {
        if (!state.payoutOptions?.networks || state.payoutOptions.networks.length === 0) {
            return [];
        }
        return (state.payoutOptions.networks || []).map((network: any) => ({
            value: network.name.toLowerCase(),
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
            bank_code: selectedBank,
            account_number: accountNumber,
            // if country is gh then pass country_code
            ...(currency === "GHS" && { country_code: "GH" })
        };
        try {
            setState({ ...state, isLoading: true });
            const { account_name, ref_id } = await performNameCheck(payload);
            setValue("accountName", account_name);
            setValue("ref_id", ref_id);
        } catch (error: any) {
            notifyError(error.message);
        } finally {
            setState({ ...state, isLoading: false });
        }
    };

    useEffect(() => {
        // Only validate account name if bank channel is selected
        if (selectedChannel !== "bank") {
            return;
        }

        // check if currency is NGN then check account name and selected bank
        // if currency is GHS then check phone number == 12 and selected bank
        const validateCheck =
            (currency === 'NGN' && accountNumber.length === 10) ||
            (currency === 'GHS' && accountNumber.length === 12) && selectedBank;

        if (validateCheck) {
            nameCheck();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountNumber, currency, selectedBank, selectedChannel]);

    const handleFormSubmit = async (values: TransferFormValues & { otp: string }) => {
        setState((prev) => ({ ...prev, isSubmitting: true }));

        if (state.selectedOptionName === "Cross Currency Transfer" && state.currentStep === 1) {
            setState((prev) => ({ ...prev, currentStep: 2, isSubmitting: false }));
            setValue("targetAccountName", "");
            setValue("targetAccountNumber", "");
            return;
        }

        try {
            // Handle OTP verification
            if (state.currentStep === 3) {
                const response = await verifyPayoutOtp({
                    otp: values.otp,
                });

                if (response?.success) {
                    notifySuccess(response?.message || 'Payout completed successfully!');
                    closeModalAndReset();
                    await fetchPayoutHistory();
                }

                return;
            }

            // Handle initial transfer submission
            // Only require ref_id validation for bank transfers
            if (state.selectedOptionName === "Same Currency Transfer" && values.channel === "bank" && !values.ref_id) {
                return;
            }

            const payload: any = {
                amount: removeCommasFromValue(values.amount),
                ...(state.selectedOptionName === "Cross Currency Transfer" && state.currentStep === 2 && {
                    targetAccountName: values.targetAccountName,
                    targetAccountNumber: values.targetAccountNumber,
                }),
                ...(state.selectedOptionName === "Same Currency Transfer" && values.channel === "bank" && {
                    currency: values.currency,
                    bank_code: values.bank,
                    account_number: values.accountNumber,
                    account_name: values.accountName,
                    ref_id: values.ref_id,
                }),
                ...(state.selectedOptionName === "Same Currency Transfer" && values.channel === "momo" && {
                    currency: values.currency,
                    account_number: values.accountNumber, // phone number for mobile money
                    customer_reference: uuid(), // Generate random UUID for customer reference
                    receipient_info: {
                        account_number: values.accountNumber, // phone number for mobile money
                        account_name: values.accountName,
                        bank_code: values.network || "",
                    },
                }),
                ...(state.selectedOptionName === "Cray Balance Transfer" && {
                    walletId: values.walletId,
                    accountName: values.accountName,
                }),
            };

            // Add narration if present and currency is GHS
            if (values.narration && currency === "GHS") {
                payload.narration = values.narration;
            }

            const response = await initiateInterBankPayout(payload);
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
            network: "",
            accountNumber: "",
            accountName: "",
            walletId: "",
            targetAccountName: "",
            targetAccountNumber: "",
            otp: "",
            mobileProvider: "mtn",
            phoneNumber: "",
            narration: "",
        });
    };

    const closeModalAndReset = () => {
        resetForm();

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
        const currentChannel = watch("channel");

        return (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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
                        />
                    )}
                />

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
                                setValue("bank", "");
                                setValue("network", "");
                                setValue("accountNumber", "");
                                setValue("accountName", "");
                                setValue("ref_id", "");
                            }}
                        />
                    )}
                />

                {currentChannel === "bank" && (
                    <Controller
                        name="bank"
                        control={control}
                        render={({ field }) => (
                            <FormSelectSearch
                                id="bank"
                                htmlFor="bank"
                                label="Select Bank"
                                isLoading={payoutOptionsLoading}
                                loadingText="Loading banks..."
                                placeholder={payoutOptionsLoading ? "Loading banks..." : "Search banks..."}
                                options={bankOptions}
                                error={errors.bank?.message}
                                touched={!!errors.bank}
                                disabled={payoutOptionsLoading}
                                {...field}
                            />
                        )}
                    />
                )}

                {currentChannel === "momo" && (
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
                                onChange={(value) => {
                                    field.onChange(value);
                                    // Reset account number when network changes
                                    setValue("accountNumber", "");
                                }}
                            />
                        )}
                    />
                )}

                {/* Account Number field - always visible, different behavior based on channel */}
                {currentChannel === "bank" ? (
                    watch('currency') == null || watch('currency') === 'NGN' ? (
                        renderNGNForm()
                    ) : (
                        renderGHSForm()
                    )
                ) : currentChannel === "momo" ? (
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
                                country={currency === "GHS" ? "gh" : currency === "TZS" ? "tz" : undefined}
                                onlyCountries={currency === "GHS" ? ["gh"] : currency === "TZS" ? ["tz"] : undefined}
                                {...field}
                            />
                        )}
                    />
                ) : (
                    // Default/fallback - show account number field
                    <Controller
                        name="accountNumber"
                        control={control}
                        render={({ field }) => (
                            <FormInput
                                label="Account Number"
                                id="accountNumber"
                                type="text"
                                htmlFor="accountNumber"
                                isLoading={state.isLoading && currentChannel === "bank"}
                                loadingText="Loading details..."
                                error={errors.accountNumber?.message}
                                touched={!!errors.accountNumber}
                                {...field}
                            />
                        )}
                    />
                )}

                {/* Account Name - always visible, read-only for bank, editable for momo */}
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
                            readOnly={currentChannel === "bank"}
                            disabled={currentChannel === "bank"}
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
                            touched={!!errors.amount}
                            numberOnly
                            {...field}
                        />
                    )}
                />

                {currency === "GHS" ? (
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
                ) : null}

                <div className="pt-10 w-52">
                    <Button
                        className="openSansLight text-white text-lg p-2 rounded w-full"
                        text={state.isSubmitting ? <Loader /> : "Initiate Transfer"}
                        ariaLabel="Initiate Transfer"
                        disabled={state.isSubmitting || state.isLoading || !currentChannel}
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

    const renderOtpVerificationStep = () => (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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
                                    if (value.length === 6) {
                                        setTimeout(() => {
                                            field.onChange(value);
                                            handleSubmit(handleFormSubmit)();
                                        }, 100);
                                    }
                                }}
                                onComplete={(value) => {
                                    field.onChange(value);
                                    setTimeout(() => {
                                        handleSubmit(handleFormSubmit)();
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

            <Button
                className="openSansLight text-white mt-8 text-lg p-2 rounded w-52"
                text={state.isSubmitting ? <Loader /> : "Verify & Complete"}
                ariaLabel="Verify OTP"
                disabled={!isValid || state.isSubmitting}
                primary
                type="submit"
            />
        </form>
    );

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
