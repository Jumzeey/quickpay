import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CurrencyOption = "NGN" | "USD" | "GHS" | "TZX" | "KES" | "ZMW" | "EUR" | "GBP";

interface AccountInfo {
    main_account_id: string;
    rolling_reserve_account_id?: string; // Only for USD
}

interface CurrencyAccounts {
    [key: string]: AccountInfo; // NGN, USD, etc.
}

interface CurrencyState {
    selectedCurrency: CurrencyOption;
    accounts: CurrencyAccounts;
    setCurrency: (currency: CurrencyOption) => void;
    setAccounts: (currency: CurrencyOption, accounts: AccountInfo) => void;
    getAccountId: (currency: CurrencyOption, accountType?: 'main' | 'reserve') => string | null;
    getCurrencySymbol: () => string;
    getCurrencyFlag: () => string;
}

const useCurrency = create<CurrencyState>()(
    persist(
        (set, get) => ({
            selectedCurrency: null as unknown as CurrencyOption,
            accounts: {},

            setCurrency: (currency: CurrencyOption) => {
                set({ selectedCurrency: currency });
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

            getCurrencyFlag: () => {
                const { selectedCurrency } = get();
                switch (selectedCurrency) {
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
            }
        }),
        {
            name: 'currency-storage',
        }
    )
);

export default useCurrency;