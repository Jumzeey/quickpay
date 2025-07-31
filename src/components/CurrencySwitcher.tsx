import useCurrency, { CurrencyOption } from "@/stores/useCurrency";

type CurrencySwitcherProps = {
    currencies?: { value: CurrencyOption; label: string }[];
    className?: string;
    contentClassName?: string;
}

export const walletCurrencies = [
    { value: "NGN" as CurrencyOption, label: "₦ NGN" },
    { value: "USD" as CurrencyOption, label: "$ USD" },
    // { value: "GBP" as CurrencyOption, label: "£ GBP" },
    // { value: "EUR" as CurrencyOption, label: "€ EUR" },
];

const CurrencySwitcher = ({ currencies, contentClassName = "", className = "" }: CurrencySwitcherProps) => {
    const { selectedCurrency, setCurrency } = useCurrency();

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = event.target.value as CurrencyOption;
        setCurrency(newCurrency);
    };

    return (
        <div className={`grid grid-cols-1 text-[#005BB0] w-full md:w-28 ${className}`}>
            <select
                className={`col-start-1 row-start-1 w-full h-12 appearance-none rounded bg-[#005BB01A] py-2 px-4 tracking-wider text-xs text-[#005BB0] font-bold outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 ${contentClassName}`}
                aria-label="Select currency"
                onChange={handleChange}
                value={selectedCurrency}
            >
                {(currencies || walletCurrencies).map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <svg className="pointer-events-none col-start-1 row-start-1 mr-5 size-5 self-center justify-self-end text-gray-500 sm:size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-slot="icon" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.99984 11.6667L6.6665 8.33337H13.3332L9.99984 11.6667Z" fill="#005BB0" />
            </svg>
        </div>
    );
};

export default CurrencySwitcher;