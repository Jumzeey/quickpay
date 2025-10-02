import Button from "@/components/button";
import { walletCurrencies } from "@/components/CurrencySwitcher";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import { addShippingFee } from "@/services/e-commerce";
import { notifyError, notifySuccess, removeCommasFromValue } from "@/util/utils";
import React, { useState } from "react";
import { ConversionFormValues, ConversionState, ConversionType } from "./types";
import { useConversionForm } from "./useConversionForm";

interface InitiateConversionProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchConversionHistory: () => void;
}

const InitiateConversion: React.FC<InitiateConversionProps> = ({
    isModalOpen,
    closeModal,
    fetchConversionHistory,
}) => {
    const [state, setState] = useState<ConversionState>({
        selectedOptionName: "",
        isLoading: false,
        isSubmitting: false,
        currentStep: 0,
    });

    const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const key: string | number = e.key;
        const isCmdOrCtrlV = (e.metaKey || e.ctrlKey) && key === "v";

        if (!isCmdOrCtrlV) {
            // Allow only numeric characters (0-9) and backspace
            if (!/^[0-9]$/.test(key) && key !== "Backspace") {
                e.preventDefault();
            }
        }
    };

    const handleFormSubmit = async (values: ConversionFormValues) => {
        setState((prev) => ({ ...prev, isSubmitting: true }));

        if (state.selectedOptionName === "Cross Currency Conversion" && state.currentStep === 1) {
            setState((prev) => ({ ...prev, currentStep: 2, isSubmitting: false }));
            formik.setTouched({ targetAccountName: false, targetAccountNumber: false }, false);
            return;
        }

        try {
            const payload = {
                amount: removeCommasFromValue(values.amount),
                transferType: state.selectedOptionName,
                ...(state.selectedOptionName === "Cross Currency Conversion" && state.currentStep === 2 && {
                    targetAccountName: values.targetAccountName,
                    targetAccountNumber: values.targetAccountNumber,
                }),
                ...(state.selectedOptionName === "Cray Balance Conversion" && {
                    walletId: values.walletId,
                }),
            };

            // @ts-ignore
            const response = await addShippingFee(payload);
            // @ts-ignore
            notifySuccess(response?.message);
            closeModalAndReset();
            fetchConversionHistory();
        } catch (error: any) {
            notifyError(error.message);
            setState((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    const formik = useConversionForm({
        currentStep: state.currentStep,
        selectedOptionName: state.selectedOptionName as ConversionType,
        onSubmit: handleFormSubmit,
    });

    const closeModalAndReset = () => {
        if (state.currentStep === 0) {
            return closeModal();
        }

        setState((prev) => ({
            ...prev,
            currentStep: prev.currentStep - 1,
            selectedOptionName: prev.currentStep === 1 ? "" : prev.selectedOptionName,
            isLoading: false,
            isSubmitting: false,
        }));
        formik.resetForm();
    };

    const renderStepContent = () => {
        return (
            <form onSubmit={formik.handleSubmit}>
                <div>
                    <label className="text-sm text-black mb-1 font-medium">Source Wallet</label>

                    <div className="flex items-center gap-1 w-full border border-[#C4C4C43D] rounded p-2">
                        <div className="grid grid-cols-1 text-primary w-[114px] border-r border-[#C4C4C43D]">
                            <select
                                className="col-start-1 row-start-1 w-28 h-12 appearance-none rounded bg-transparent py-2 px-4 tracking-wider text-xs text-[#005BB0] font-bold outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                                aria-label="Select currency"
                            >
                                {walletCurrencies.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <svg className="pointer-events-none col-start-1 row-start-1 mr-5 size-5 self-center justify-self-end text-gray-500 sm:size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-slot="icon" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.99984 11.6667L6.6665 8.33337H13.3332L9.99984 11.6667Z" fill="#005BB0" />
                            </svg>
                        </div>

                        <input
                            type="text"
                            onKeyDown={handleNumberInput}
                            className="w-[inherit] h-12 active:border-none focus-visible:outline-none"
                        />
                    </div>

                    <p className="mb-5 mt-2 text-xs text-[#7F7F7F] font-semibold text-right">
                        Available balance:

                        <span className="text-xs text-black ml-1">
                            ₦21,450.00
                        </span>
                    </p>
                </div>

                <div>
                    <label className="text-sm text-black mb-1 font-medium">Destination Wallet</label>
                    <div className="flex items-center gap-1 w-full border border-[#C4C4C43D] rounded p-2">
                        <div className="grid grid-cols-1 text-[#005BB0] w-[114px] border-r border-[#C4C4C43D]">
                            <select
                                className="col-start-1 row-start-1 w-28 h-12 appearance-none rounded bg-transparent py-2 px-4 tracking-wider text-xs text-[#005BB0] font-bold outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                                aria-label="Select currency"
                            >
                                {walletCurrencies.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <svg className="pointer-events-none col-start-1 row-start-1 mr-5 size-5 self-center justify-self-end text-gray-500 sm:size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-slot="icon" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.99984 11.6667L6.6665 8.33337H13.3332L9.99984 11.6667Z" fill="#005BB0" />
                            </svg>
                        </div>

                        <input
                            type="text"
                            onKeyDown={handleNumberInput}
                            className="w-[inherit] h-12 active:border-none focus-visible:outline-none"
                        />
                    </div>
                </div>

                <div className="text-[#7F7F7F] my-6">
                    <p className="text-xs font-bold mb-0.5">
                        ₦1.00 is equal to
                    </p>
                    <p className="text-lg font-extrabold">
                        £ 0.00054 GBP
                    </p>
                </div>

                <div className="w-[113px]">
                    <Button
                        className="openSansLight font-medium text-white mt-5 text-xs p-2 rounded w-full"
                        text={state.isSubmitting ? <Loader /> : "Submit"}
                        ariaLabel="Submit"
                        disabled={!formik.isValid || state.isSubmitting || state.isLoading}
                        primary
                        type="submit"
                    />
                </div>
            </form>
        )
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeModalAndReset}
            title={state.currentStep === 0 ? "Initiate Conversion" : state.selectedOptionName || "Conversion Details"}
            width={state.currentStep === 1 && state.selectedOptionName === "Cross Currency Conversion"}
        >
            <div className="mt-5">{renderStepContent()}</div>
        </Modal>
    );
};

export default InitiateConversion;
