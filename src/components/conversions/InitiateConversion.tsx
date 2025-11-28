import Button from "@/components/button";
import Loader from "@/components/loader";
import Modal from "@/components/modal";
import Icon from "@/components/icon";
import { getWalletBalances } from "@/services/transaction";
import { useConversionRate } from "@/services/conversionRates";
import { initiateConversion, getQuote } from "@/services/conversions";
import { notifyError, notifySuccess, removeCommasFromValue, formatBalance, currencySymbols } from "@/util/utils";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ConversionFormValues, ConversionState, ConversionType } from "./types";
import { useConversionForm } from "./useConversionForm";

interface InitiateConversionProps {
    isModalOpen: boolean;
    closeModal: () => void;
    fetchConversionHistory: (params?: object) => void;
}

interface CurrencyOption {
    value: string;
    label: string;
    balance?: string;
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

    const [sourceCurrency, setSourceCurrency] = useState<string>("");
    const [destinationCurrency, setDestinationCurrency] = useState<string>("");
    const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>([]);
    const [sourceCurrencies, setSourceCurrencies] = useState<CurrencyOption[]>([]);
    const [destinationCurrencies, setDestinationCurrencies] = useState<CurrencyOption[]>([]);
    const [sourceBalance, setSourceBalance] = useState<string>("");
    const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
    const [calculatedDestinationAmount, setCalculatedDestinationAmount] = useState<string>("");
    const [quoteData, setQuoteData] = useState<{
        quote_id: string;
        expires_in_minutes: number;
        conversion_rate: number;
    } | null>(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
    const [conversionResponse, setConversionResponse] = useState<{
        quote_id?: string;
        debit_transaction_id?: number;
        credit_transaction_id?: number;
        settlement?: string;
        sla_minutes?: number;
        initiated_at?: string;
        converted_at?: string;
    } | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
    const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
    const [sourceSearchTerm, setSourceSearchTerm] = useState('');
    const [destinationSearchTerm, setDestinationSearchTerm] = useState('');
    const sourceDropdownRef = useRef<HTMLDivElement>(null);
    const destinationDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch all available currencies with main account type
    useEffect(() => {
        if (!isModalOpen) return;

        const fetchCurrencies = async () => {
            setIsLoadingCurrencies(true);
            try {
                const response = await getWalletBalances();
                const balances = response?.data?.balances || [];

                // Filter for main accounts only and get unique currencies
                const mainAccounts = balances.filter((acc: any) => acc.account_type === 'main');

                // Create a map to ensure unique currencies (in case there are multiple main accounts per currency)
                const currencyMap = new Map<string, CurrencyOption>();

                mainAccounts.forEach((account: any) => {
                    const currency = account.currency;
                    if (currency && !currencyMap.has(currency)) {
                        const symbol = currencySymbols[currency] || '';
                        const label = symbol ? `${symbol} ${currency}` : currency;
                        currencyMap.set(currency, {
                            value: currency,
                            label: label,
                            balance: formatBalance(parseFloat(account.available_balance), currency),
                        });
                    }
                });

                const validCurrencies = Array.from(currencyMap.values());

                setAvailableCurrencies(validCurrencies);
                setSourceCurrencies(validCurrencies);
                setDestinationCurrencies(validCurrencies);

                // Set default currencies: NGN for source, USD for destination
                const hasNGN = validCurrencies.some(c => c.value === 'NGN');
                const hasUSD = validCurrencies.some(c => c.value === 'USD');

                if (hasNGN) {
                    setSourceCurrency('NGN');
                    const ngnCurrency = validCurrencies.find(c => c.value === 'NGN');
                    setSourceBalance(ngnCurrency?.balance || '');

                    // Filter destination currencies to exclude NGN
                    const filteredDestinations = validCurrencies.filter(c => c.value !== 'NGN');
                    setDestinationCurrencies(filteredDestinations);

                    // Set default destination currency
                    if (hasUSD) {
                        setDestinationCurrency('USD');
                    } else if (filteredDestinations.length > 0) {
                        // If USD is not available, set destination to first available currency that's not NGN
                        setDestinationCurrency(filteredDestinations[0].value);
                    }
                } else {
                    // If NGN is not available, set source to first available currency
                    if (validCurrencies.length > 0) {
                        setSourceCurrency(validCurrencies[0].value);
                        setSourceBalance(validCurrencies[0].balance || '');

                        // Filter destination currencies
                        const filteredDestinations = validCurrencies.filter(c => c.value !== validCurrencies[0].value);
                        setDestinationCurrencies(filteredDestinations);

                        // Set destination to USD if available, otherwise first available
                        if (hasUSD) {
                            setDestinationCurrency('USD');
                        } else if (filteredDestinations.length > 0) {
                            setDestinationCurrency(filteredDestinations[0].value);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching currencies:', error);
                notifyError('Failed to load currencies');
            } finally {
                setIsLoadingCurrencies(false);
            }
        };

        fetchCurrencies();
    }, [isModalOpen]);

    // Update destination currencies when source currency changes
    useEffect(() => {
        if (sourceCurrency) {
            const filtered = availableCurrencies.filter(c => c.value !== sourceCurrency);
            setDestinationCurrencies(filtered);

            // Reset destination if it's the same as source
            if (destinationCurrency === sourceCurrency) {
                setDestinationCurrency("");
            }

            // Update source balance
            const selected = availableCurrencies.find(c => c.value === sourceCurrency);
            setSourceBalance(selected?.balance || "");
        } else {
            setDestinationCurrencies(availableCurrencies);
            setSourceBalance("");
        }
    }, [sourceCurrency, availableCurrencies, destinationCurrency]);

    // Fetch conversion rate when both currencies are selected
    const { data: rateData, isLoading: isLoadingRate, isError: isRateError, error: rateError } = useConversionRate(
        sourceCurrency,
        destinationCurrency
    );


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

    // Fetch quote when user clicks submit
    const handleGetQuote = async () => {
        if (!sourceCurrency || !destinationCurrency || !formik.values.amount) {
            notifyError('Please fill in all required fields');
            return;
        }

        setIsLoadingQuote(true);
        try {
            const response = await getQuote({
                source_currency: sourceCurrency,
                destination_currency: destinationCurrency,
                source_amount: parseFloat(removeCommasFromValue(formik.values.amount)),
            });

            if (response.success && response.data) {
                setQuoteData(response.data);
                // Convert minutes to seconds for countdown
                setTimeRemainingSeconds(response.data.expires_in_minutes * 60);
                notifySuccess(response.message || 'Quote generated successfully');
                // Automatically navigate to summary modal
                setState((prev) => ({ ...prev, currentStep: 3 }));
            } else {
                notifyError('Failed to generate quote');
            }
        } catch (error: any) {
            // Error is already handled in the service
        } finally {
            setIsLoadingQuote(false);
        }
    };

    // Countdown timer for quote validity (counts down in seconds)
    React.useEffect(() => {
        // Clear any existing timer
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        if (timeRemainingSeconds !== null && timeRemainingSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimeRemainingSeconds((prev) => {
                    if (prev === null || prev <= 0) {
                        if (timerIntervalRef.current) {
                            clearInterval(timerIntervalRef.current);
                            timerIntervalRef.current = null;
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000); // Update every second
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [quoteData, timeRemainingSeconds]); // Re-run when quote is generated or time changes

    const handleFormSubmit = async (values: ConversionFormValues) => {
        // If quote is not yet generated, generate it first
        if (!quoteData) {
            await handleGetQuote();
            return;
        }

        // Show conversion summary instead of calling API immediately
        setState((prev) => ({ ...prev, currentStep: 3, isSubmitting: false }));
    };

    // Handle actual conversion initiation from summary modal
    const handleInitiateConversion = async () => {
        if (!quoteData?.quote_id) {
            notifyError('Quote ID is missing');
            return;
        }

        setState((prev) => ({ ...prev, isSubmitting: true }));

        try {
            const response = await initiateConversion({
                quote_id: quoteData.quote_id,
            });

            if (response.success) {
                // Store conversion response data
                setConversionResponse(response.data || null);
                // Show success modal (step 4)
                setState((prev) => ({ ...prev, currentStep: 4, isSubmitting: false }));
                // Refetch conversions list
                fetchConversionHistory({});
            } else {
                notifyError('Failed to initiate conversion');
                setState((prev) => ({ ...prev, isSubmitting: false }));
            }
        } catch (error: any) {
            // Error is already handled in the service
            setState((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    const formik = useConversionForm({
        currentStep: state.currentStep,
        selectedOptionName: state.selectedOptionName as ConversionType,
        onSubmit: handleFormSubmit,
    });

    // Calculate destination amount based on source amount and rate
    React.useEffect(() => {
        const sourceAmount = formik.values.amount;
        const rateDataTyped = rateData as any;

        if (sourceAmount && rateDataTyped?.success === true && rateDataTyped?.data?.rate) {
            try {
                // Remove commas and parse the source amount
                const sourceAmountNum = parseFloat(sourceAmount.replace(/,/g, ''));
                const rate = parseFloat(rateDataTyped.data.rate);

                if (!isNaN(sourceAmountNum) && !isNaN(rate) && sourceAmountNum > 0 && rate > 0) {
                    // Rate represents how many source currency units = 1 destination currency unit
                    // So we divide: destinationAmount = sourceAmount / rate
                    const destinationAmount = sourceAmountNum / rate;
                    // Format the destination amount with commas
                    const formattedAmount = destinationAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    setCalculatedDestinationAmount(formattedAmount);
                } else {
                    setCalculatedDestinationAmount("");
                }
            } catch (error) {
                setCalculatedDestinationAmount("");
            }
        } else {
            setCalculatedDestinationAmount("");
        }
    }, [formik.values.amount, rateData]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sourceDropdownRef.current &&
                !sourceDropdownRef.current.contains(event.target as Node)
            ) {
                setIsSourceDropdownOpen(false);
            }
            if (
                destinationDropdownRef.current &&
                !destinationDropdownRef.current.contains(event.target as Node)
            ) {
                setIsDestinationDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter currencies based on search term
    const filteredSourceCurrencies = sourceCurrencies.filter((currency) =>
        currency.label.toLowerCase().includes(sourceSearchTerm.toLowerCase()) ||
        currency.value.toLowerCase().includes(sourceSearchTerm.toLowerCase())
    );

    const filteredDestinationCurrencies = destinationCurrencies.filter((currency) =>
        currency.label.toLowerCase().includes(destinationSearchTerm.toLowerCase()) ||
        currency.value.toLowerCase().includes(destinationSearchTerm.toLowerCase())
    );

    const closeModalAndReset = () => {
        if (state.currentStep === 0 || state.currentStep === 4) {
            setSourceCurrency("");
            setDestinationCurrency("");
            setSourceBalance("");
            setCalculatedDestinationAmount("");
            setQuoteData(null);
            setTimeRemainingSeconds(null);
            setConversionResponse(null);
            setIsSourceDropdownOpen(false);
            setIsDestinationDropdownOpen(false);
            setSourceSearchTerm('');
            setDestinationSearchTerm('');
            return closeModal();
        }

        // If on summary step (step 3), go back to step 0
        if (state.currentStep === 3) {
            setState((prev) => ({ ...prev, currentStep: 0 }));
            return;
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
        // Show success modal
        if (state.currentStep === 4 && quoteData) {
            const sourceAmount = parseFloat(removeCommasFromValue(formik.values.amount));
            const rateDataTyped = rateData as any;
            const rate = rateDataTyped?.data?.rate ? parseFloat(rateDataTyped.data.rate) : quoteData.conversion_rate;
            const destinationAmount = sourceAmount / rate;

            return (
                <div className="text-center space-y-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <Image
                            src="/images/circle-check-full.svg"
                            alt="Success"
                            width={40}
                            height={40}
                        />
                    </div>
                    <h3 className="text-xl font-bold text-green-600">Success</h3>

                    <div className="space-y-4 text-left">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Source Currency Amount:</p>
                            <p className="text-base font-bold text-black">
                                {formatBalance(sourceAmount, sourceCurrency)} {sourceCurrency}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Destination Currency Amount:</p>
                            <p className="text-base font-bold text-black">
                                {formatBalance(destinationAmount, destinationCurrency)} {destinationCurrency}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Rate:</p>
                            <p className="text-xs font-bold mb-0.5">
                                {currencySymbols[sourceCurrency] || sourceCurrency}{rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is equal to
                            </p>
                            <p className="text-lg font-extrabold">
                                {formatBalance(1, destinationCurrency)} {destinationCurrency}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Reference:</p>
                            <p className="text-base font-bold text-black">
                                {conversionResponse?.quote_id || conversionResponse?.debit_transaction_id || 'n/a'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status:</p>
                            <p className="text-base font-bold text-black">
                                {conversionResponse?.settlement ? 'Initiated' : 'n/a'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Initiated At:</p>
                            <p className="text-base font-bold text-black">
                                {conversionResponse?.initiated_at || 'n/a'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 mb-1">Converted At:</p>
                            <p className="text-base font-bold text-black">
                                {conversionResponse?.converted_at || 'n/a'}
                            </p>
                        </div>
                    </div>

                    <div className="w-full pt-4">
                        <Button
                            className="openSansLight font-medium text-white text-xs p-2 rounded w-full"
                            text="Close"
                            ariaLabel="Close"
                            primary
                            onClick={closeModalAndReset}
                        />
                    </div>
                </div>
            );
        }

        // Show conversion summary modal
        if (state.currentStep === 3 && quoteData) {
            const sourceAmount = parseFloat(removeCommasFromValue(formik.values.amount));
            const rateDataTyped = rateData as any;
            const rate = rateDataTyped?.data?.rate ? parseFloat(rateDataTyped.data.rate) : quoteData.conversion_rate;
            const destinationAmount = sourceAmount / rate;

            return (
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Source currency:</p>
                        <p className="text-base font-bold text-black">
                            {currencySymbols[sourceCurrency] || sourceCurrency} {sourceCurrency}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-1">Destination currency:</p>
                        <p className="text-base font-bold text-black">
                            {currencySymbols[destinationCurrency] || destinationCurrency} {destinationCurrency}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 mb-1">Conversion rate:</p>
                        <p className="text-base font-bold text-black flex items-center gap-2">
                            {formatBalance(sourceAmount, sourceCurrency)} {sourceCurrency}{' '}
                            <Image
                                src="/images/conversion_arrow.svg"
                                alt="conversion arrow"
                                width={20}
                                height={20}
                            />
                            {' '}{formatBalance(destinationAmount, destinationCurrency)} {destinationCurrency}
                        </p>
                    </div>

                    {quoteData && timeRemainingSeconds !== null && timeRemainingSeconds > 0 && (
                        <div className="px-3 py-2 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-600">
                                This rate is valid for{' '}
                                <span className="font-bold">
                                    {Math.floor(timeRemainingSeconds / 60)}:{(timeRemainingSeconds % 60).toString().padStart(2, '0')}
                                </span>{' '}
                                mins
                            </p>
                        </div>
                    )}

                    <div className="w-full">
                        <Button
                            className="openSansLight font-medium text-white mt-5 text-xs p-2 rounded w-full"
                            text={state.isSubmitting ? <Loader /> : "Initiate conversion"}
                            ariaLabel="Initiate conversion"
                            disabled={state.isSubmitting}
                            primary
                            onClick={handleInitiateConversion}
                        />
                    </div>
                </div>
            );
        }

        return (
            <form onSubmit={formik.handleSubmit}>
                <div>
                    <label className="text-sm text-black mb-1 font-medium">Source Wallet</label>

                    <div className="flex items-center gap-1 w-full border border-[#C4C4C43D] rounded p-2">
                        <div className="relative w-[114px] border-r border-[#C4C4C43D]" ref={sourceDropdownRef}>
                            <button
                                type="button"
                                className="flex justify-between items-center w-full h-12 rounded px-4 bg-[#005BB01A] text-[#005BB0] font-bold text-sm"
                                onClick={() => !isLoadingCurrencies && setIsSourceDropdownOpen(prev => !prev)}
                                disabled={isLoadingCurrencies}
                            >
                                <span className="text-xs">
                                    {isLoadingCurrencies 
                                        ? 'Loading...' 
                                        : (sourceCurrencies.find(c => c.value === sourceCurrency)?.label || sourceCurrency || 'Select')
                                    }
                                </span>
                                <Icon name="caretDown" />
                            </button>

                            {isSourceDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-full bg-white text-black rounded-lg border border-grey-200 shadow-lg">
                                    <div className="p-2 border-b border-grey-100">
                                        <input
                                            type="text"
                                            placeholder="Search currency..."
                                            value={sourceSearchTerm}
                                            onChange={(e) => setSourceSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <ul className="max-h-48 overflow-y-auto">
                                        {isLoadingCurrencies ? (
                                            <li className="px-4 py-3 text-sm text-grey-500">
                                                Loading currencies...
                                            </li>
                                        ) : filteredSourceCurrencies.length > 0 ? (
                                            filteredSourceCurrencies.map((option) => (
                                                <li
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSourceCurrency(option.value);
                                                        setIsSourceDropdownOpen(false);
                                                        setSourceSearchTerm('');
                                                    }}
                                                    className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] ${
                                                        sourceCurrency === option.value ? 'bg-[#005BB00D]' : ''
                                                    }`}
                                                >
                                                    {option.label}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-3 text-sm text-grey-500">
                                                No currencies found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            name="amount"
                            value={formik.values.amount}
                            onChange={formik.handleChange}
                            onKeyDown={handleNumberInput}
                            className="w-[inherit] h-12 active:border-none focus-visible:outline-none"
                            placeholder="Enter amount"
                        />
                    </div>

                    {sourceBalance && (
                        <p className="mb-5 mt-2 text-xs text-[#7F7F7F] font-semibold text-right">
                            Available balance:
                            <span className="text-xs text-black ml-1">
                                {sourceBalance}
                            </span>
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm text-black mb-1 font-medium">Destination Wallet</label>
                    <div className="flex items-center gap-1 w-full border border-[#C4C4C43D] rounded p-2">
                        <div className="relative w-[114px] border-r border-[#C4C4C43D]" ref={destinationDropdownRef}>
                            <button
                                type="button"
                                className={`flex justify-between items-center w-full h-12 rounded px-4 bg-[#005BB01A] text-[#005BB0] font-bold text-sm ${
                                    isLoadingCurrencies || !sourceCurrency ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onClick={() => !isLoadingCurrencies && sourceCurrency && setIsDestinationDropdownOpen(prev => !prev)}
                                disabled={isLoadingCurrencies || !sourceCurrency}
                            >
                                <span className="text-xs">
                                    {isLoadingCurrencies 
                                        ? 'Loading...' 
                                        : (destinationCurrencies.find(c => c.value === destinationCurrency)?.label || destinationCurrency || 'Select')
                                    }
                                </span>
                                <Icon name="caretDown" />
                            </button>

                            {isDestinationDropdownOpen && (
                                <div className="absolute z-50 mt-2 w-full bg-white text-black rounded-lg border border-grey-200 shadow-lg">
                                    <div className="p-2 border-b border-grey-100">
                                        <input
                                            type="text"
                                            placeholder="Search currency..."
                                            value={destinationSearchTerm}
                                            onChange={(e) => setDestinationSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <ul className="max-h-48 overflow-y-auto">
                                        {isLoadingCurrencies ? (
                                            <li className="px-4 py-3 text-sm text-grey-500">
                                                Loading currencies...
                                            </li>
                                        ) : filteredDestinationCurrencies.length > 0 ? (
                                            filteredDestinationCurrencies.map((option) => (
                                                <li
                                                    key={option.value}
                                                    onClick={() => {
                                                        setDestinationCurrency(option.value);
                                                        setIsDestinationDropdownOpen(false);
                                                        setDestinationSearchTerm('');
                                                    }}
                                                    className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] ${
                                                        destinationCurrency === option.value ? 'bg-[#005BB00D]' : ''
                                                    }`}
                                                >
                                                    {option.label}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="px-4 py-3 text-sm text-grey-500">
                                                No currencies found
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            className="w-[inherit] h-12 active:border-none focus-visible:outline-none"
                            placeholder="Destination account"
                            value={calculatedDestinationAmount}
                            readOnly
                        />
                    </div>
                </div>

                {sourceCurrency && destinationCurrency && sourceCurrency !== destinationCurrency && (
                    <div className="text-[#7F7F7F] my-6">
                        {isLoadingRate ? (
                            <div className="flex items-center gap-2">
                                <Loader />
                                <span className="text-xs">Loading rate...</span>
                            </div>
                        ) : rateData && (rateData as any).success === true && (rateData as any).data?.rate ? (
                            <>
                                <p className="text-xs font-bold mb-0.5">
                                    {currencySymbols[sourceCurrency] || sourceCurrency}{parseFloat((rateData as any).data.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is equal to
                                </p>
                                <p className="text-lg font-extrabold">
                                    {formatBalance(1, destinationCurrency)} {destinationCurrency}
                                </p>
                            </>
                        ) : rateData && (rateData as any).success === false ? (
                            <p className="text-xs text-[#7F7F7F]">
                                {(rateData as any).message || 'Rate not available'}
                            </p>
                        ) : (
                            <p className="text-xs text-[#7F7F7F]">
                                Rate not available
                            </p>
                        )}
                    </div>
                )}

                <div className="w-[113px]">
                    <Button
                        className="openSansLight font-medium text-white mt-5 text-xs p-2 rounded w-full"
                        text={state.isSubmitting || isLoadingQuote ? <Loader /> : "Continue"}
                        ariaLabel="Continue"
                        disabled={
                            !formik.isValid ||
                            state.isSubmitting ||
                            state.isLoading ||
                            isLoadingQuote ||
                            (sourceCurrency && destinationCurrency && sourceCurrency !== destinationCurrency &&
                                (isLoadingRate || !rateData || (rateData as any).success !== true || !(rateData as any).data?.rate))
                        }
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
            title={state.currentStep === 4 ? "Success" : (state.currentStep === 3 ? "Conversion summary" : (state.currentStep === 0 ? "Initiate Conversion" : state.selectedOptionName || "Conversion Details"))}
            width={state.currentStep === 1 && state.selectedOptionName === "Cross Currency Conversion"}
        >
            <div className="mt-5">{renderStepContent()}</div>
        </Modal>
    );
};

export default InitiateConversion;
