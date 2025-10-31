import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupportedCountries } from '@/services/authentication';

export type CurrencyOption = "NGN" | "USD" | "GHS" | "TZX" | "KES" | "ZMW" | "EUR" | "GBP";

interface AccountInfo {
    main_account_id: string;
    rolling_reserve_account_id?: string; // Only for USD
}

interface CurrencyAccounts {
    [key: string]: AccountInfo; // NGN, USD, etc.
}

interface CurrencyState {
    defaultCurrency: CurrencyOption;
    selectedCurrency: CurrencyOption;
    accounts: CurrencyAccounts;
    activeCurrencies: string[];
    isLoadingCurrencies: boolean;
    setCurrency: (currency: CurrencyOption) => void;
    setDefaultCurrency: (currency: CurrencyOption) => void;
    setAccounts: (currency: CurrencyOption, accounts: AccountInfo) => void;
    getAccountId: (currency: CurrencyOption, accountType?: 'main' | 'reserve') => string | null;
    getCurrencySymbol: () => string;
    getCurrencyFlag: (type?: "selected" | "default") => string;
    fetchActiveCurrencies: () => Promise<void>;
}

const useCurrency = create<CurrencyState>()(
    persist(
        (set, get) => ({
            selectedCurrency: 'NGN' as CurrencyOption,
            defaultCurrency: 'NGN' as CurrencyOption,

            accounts: {},
            activeCurrencies: [],
            isLoadingCurrencies: false,

            setCurrency: (currency: CurrencyOption) => {
                set({ selectedCurrency: currency });
            },

            setDefaultCurrency: (currency: CurrencyOption) => {
                set({ defaultCurrency: currency });
            },

            setAccounts: (currency: CurrencyOption, accounts: AccountInfo) => {
                set((state) => ({
                    accounts: {
                        ...state.accounts,
                        [currency]: accounts
                    }
                }));
            },

            getAccountId: (currency: CurrencyOption, accountType: 'main' | 'reserve' = 'main') => {
                const { accounts } = get();
                const currencyAccounts = accounts[currency];

                if (!currencyAccounts) return null;

                if (accountType === 'reserve') {
                    return currencyAccounts.rolling_reserve_account_id || null;
                }

                return currencyAccounts.main_account_id || null;
            },

            getCurrencySymbol: () => {
                const { selectedCurrency } = get();
                switch (selectedCurrency) {
                    case "NGN": return "₦";
                    case "USD": return "$";
                    case "GHS": return "₵";
                    case "GBP": return "£";
                    case "EUR": return "€";
                    case "TZX": return "TSh";
                    case "KES": return "KSh";
                    case "ZMW": return "ZK";
                    default: return "₦";
                }
            },

            getCurrencyFlag: (type: "selected" | "default" = "selected") => {
                const { selectedCurrency, defaultCurrency } = get();
                const currency = type === "selected" ? selectedCurrency : defaultCurrency;
                switch (currency) {
                    case "NGN": return "🇳🇬";
                    case "USD": return "🇺🇸";
                    case "EUR": return "🇪🇺";
                    case "GBP": return "🇬🇧";
                    case "GHS": return "🇬🇭";
                    case "TZX": return "🇹🇿";
                    case "KES": return "🇰🇪";
                    case "ZMW": return "🇿🇲";
                    default: return "🇳🇬";
                }
            },

            fetchActiveCurrencies: async () => {
                const { activeCurrencies } = get();
                // Only fetch if not already loaded
                if (activeCurrencies.length > 0) return;

                set({ isLoadingCurrencies: true });
                try {
                    const response = await getSupportedCountries();
                    const active = response.data
                        .filter((item) => item.is_active && item.product_type === 'wallet')
                        .map((item) => item.currency);
                    const uniqueActive: string[] = Array.from(new Set(active));
                    set({ activeCurrencies: uniqueActive, isLoadingCurrencies: false });
                } catch (error) {
                    console.error('Failed to fetch active currencies:', error);
                    // Fallback to default currencies
                    set({ 
                        activeCurrencies: ['NGN', 'USD', 'GHS', 'KES', 'TZS', 'XOF'],
                        isLoadingCurrencies: false 
                    });
                }
            }
        }),
        {
            name: 'currency-storage',
        }
    )
);

export default useCurrency;