import Button from "@/components/button";
import { walletCurrencies } from "@/components/CurrencySwitcher";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import FormSelectSearch from "@/components/FormSelectSearch";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { useEffectFetch } from "@/hooks/useEffectFetch";
import { useFormValidation } from "@/hooks/useFormValidation";
import { getBanks, performNameCheck } from "@/services/bank";
import usePayout from "@/stores/usePayout";
import { notifyError, notifySuccess, removeCommasFromValue } from "@/util/utils";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import PinInput from "react-pin-input";
import * as Yup from "yup";
import { TRANSFER_OPTIONS } from "./constants";
import { TransferFormValues, TransferState } from "./types";
import { BankResponse } from "@/services/payout";

interface InitiateTransferProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchPayoutHistory: () => void;
}

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
    }

    const { initiateInterBankPayout, verifyPayoutOtp } = usePayout();
    const [state, setState] = useState<TransferState>(initialState);

    const { data: banks, loading: banksLoading } = useEffectFetch(
        async () => {
            const response: BankResponse[] = await getBanks();
            return response;
        },
        [],
        {
            onSuccess: (response) => {
                setState(prev => ({
                    ...prev,
                    banks: response
                }));
            },
            onError: (error) => {
                notifyError(error.message);
            }
        }
    );

    const bankOptions = useMemo(() => {
        if (!banks || banks.length === 0) {
            return [];
        }
        return (banks || []).map((bank: BankResponse) => ({
            value: bank.institutionCode,
            label: bank.institutionName,
        }));
    }, [banks]);

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
                // currency: Yup.string().required("Please select a currency"),
                bank: Yup.string().required("Please select a bank"),
                ref_id: Yup.string().required("Please validate your account details"),
                accountNumber: Yup.string()
                    .required("Account number is required")
                    .length(10, "Account number must be 10 digits")
                    .matches(/^\d+$/, "Account number must contain only digits"),
                accountName: Yup.string().required("Account name is required"),
                amount: baseAmountValidation,
            });
        }

        if (state.selectedOptionName === "Ramp Balance Transfer") {
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

        if (state.currentStep === 3) { // OTP step
            return Yup.object().shape({
                otp: Yup.string()
                    .required("OTP is required")
                    .length(6, "OTP must be 6 digits")
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
            currency: "NGN",
            bank: "",
            ref_id: "",
            accountNumber: "",
            accountName: "",
            walletId: "",
            targetAccountName: "",
            targetAccountNumber: "",
            otp: "",
        },
        mode: 'onChange'
    });

    const accountNumber = watch("accountNumber");
    const selectedBank = watch("bank");

    const nameCheck = async () => {
        const payload = {
            bank_code: selectedBank,
            account_number: accountNumber,
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
        if (accountNumber.length === 10 && selectedBank) {
            nameCheck();
        }
    }, [accountNumber]);

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

                notifySuccess(response?.message || 'Payout completed successfully!');
                closeModalAndReset();
                await fetchPayoutHistory();
                return;
            }

            // Handle initial transfer submission
            if (!values.ref_id && state.selectedOptionName === "Same Currency Transfer") {
                return;
            }

            const payload = {
                amount: removeCommasFromValue(values.amount),
                ...(state.selectedOptionName === "Cross Currency Transfer" && state.currentStep === 2 && {
                    targetAccountName: values.targetAccountName,
                    targetAccountNumber: values.targetAccountNumber,
                }),
                ...(state.selectedOptionName === "Same Currency Transfer" && {
                    currency: "NGN",
                    bank_code: values.bank,
                    account_number: values.accountNumber,
                    account_name: values.accountName,
                    ref_id: values.ref_id,
                }),
                ...(state.selectedOptionName === "Ramp Balance Transfer" && {
                    walletId: values.walletId,
                    accountName: values.accountName,
                }),
            };

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

    const closeModalAndReset = () => {
        reset({
            amount: "",
            currency: "NGN",
            bank: "",
            accountNumber: "",
            accountName: "",
            walletId: "",
            targetAccountName: "",
            targetAccountNumber: "",
            otp: "",
        });

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
        setState((prev) => ({
            ...prev,
            selectedOptionName: option.name,
            currentStep: 1,
            isSubmitting: false,
            isLoading: false,
        }));

        reset({
            amount: "",
            bank: "",
            accountNumber: "",
            accountName: "",
            walletId: "",
            targetAccountName: "",
            targetAccountNumber: "",
        });
    };

    const renderTransferOptions = () => (
        <ul className="space-y-2">
            {TRANSFER_OPTIONS.map((option) => (
                <li key={option.id}>
                    <button
                        type="button"
                        className={`w-full flex items-center justify-between font-semibold text-sm text-black py-5 ${option.id !== TRANSFER_OPTIONS.length ? "border-b border-[#C4C4C452]" : ""
                            }`}
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

    const renderSameCurrencyForm = () => (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                    <>
                        <FormSelect
                            id="currency"
                            htmlFor="currency"
                            label="Select Currency"
                            placeholder="Select Currency"
                            options={walletCurrencies}
                            // error={errors.currency?.message}
                            // touched={!!errors.currency}
                            value={field.value || "NGN"}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            disabled
                        />
                    </>
                )}
            />

            <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                    <FormSelectSearch
                        id="bank"
                        htmlFor="bank"
                        label="Select Bank"
                        isLoading={banksLoading}
                        loadingText="Loading banks..."
                        placeholder={banksLoading ? "Loading banks..." : "Search banks..."}
                        options={bankOptions}
                        error={errors.bank?.message}
                        touched={!!errors.bank}
                        disabled={banksLoading}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
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
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
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
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
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
                    text={state.isSubmitting ? <Loader /> : "Initiate Payout"}
                    ariaLabel="Initiate Payout"
                    disabled={state.isSubmitting || state.isLoading}
                    primary
                    type="submit"
                />
            </div>
        </form>
    );

    const renderRampBalanceForm = () => (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <Controller
                name="walletId"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label="Ramp Wallet ID"
                        id="walletId"
                        type="text"
                        htmlFor="walletId"
                        maxLength={10}
                        error={errors.walletId?.message}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
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
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
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
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                    />
                )}
            />

            <Button
                className="openSansLight text-white mt-5 text-xs p-2 rounded w-full"
                text={state.isSubmitting ? <Loader /> : "Initiate Payout"}
                ariaLabel="Initiate Payout"
                disabled={!isValid || state.isSubmitting || state.isLoading}
                primary
                type="submit"
            />
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

                    <Button
                        className="openSansLight text-white mt-5 text-xs p-2 rounded w-full"
                        text={state.isSubmitting ? <Loader /> : "Initiate Payout"}
                        ariaLabel="Initiate Payout"
                        disabled={!isValid || state.isSubmitting || state.isLoading}
                        primary
                        type="submit"
                    />
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
                    Please enter the 6-digit code sent to you
                </p>

                <Controller
                    name="otp"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2 flex items-center justify-center">
                            <PinInput
                                length={6}
                                initialValue=""
                                onChange={(value) => field.onChange(value)}
                                type="numeric"
                                inputMode="number"
                                style={{ padding: '10px' }}
                                inputStyle={{
                                    borderColor: errors.otp?.message ? 'red' : '#e2e8f0',
                                    borderRadius: '8px',
                                    margin: '0 4px',
                                }}
                                inputFocusStyle={{ borderColor: '#2563eb' }}
                                onComplete={(value) => field.onChange(value)}
                                autoSelect={true}
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
                case "Ramp Balance Transfer":
                    return renderRampBalanceForm();
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

        <Modal
            isOpen={isModalOpen}
            onClose={closeModalAndReset}
            title={getModalTitle()}
            className={state.currentStep === 1 && state.selectedOptionName === "Cross Currency Transfer" ? "max-w-lg" : ""}
        >
            <div className="mt-5">{renderStepContent()}</div>
        </Modal>
    );
};

export default InitiateTransfer;
