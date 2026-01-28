import { useState, useEffect, useRef } from 'react';
import useAuthentication from '@/stores/useAuthentication';
import useCurrency, { CurrencyOption } from '@/stores/useCurrency';
import { getAllCurrencies } from '@/util/utils';
import Icon from '@/components/icon';

type CurrencySwitcherProps = {
  currencies?: string[];
  className?: string;
  contentClassName?: string;
};

export const walletCurrencies = [
  { value: 'NGN' as CurrencyOption, label: '₦ NGN' },
  { value: 'USD' as CurrencyOption, label: '$ USD' },
  { value: 'GHS' as CurrencyOption, label: '₵ GHS' },
  // { value: "GBP" as CurrencyOption, label: "£ GBP" }, 
  // { value: "EUR" as CurrencyOption, label: "€ EUR" },
];

// const CurrencySwitcher = ({ currencies, contentClassName = "", className = "" }: CurrencySwitcherProps) => {
//   const { selectedCurrency, setCurrency } = useCurrency();
//   const { modules } = useAuthentication();

//   const allCurrencies = getAllCurrencies(modules);

//   const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     const newCurrency = event.target.value as CurrencyOption;
//     setCurrency(newCurrency);
//   };

  const CurrencySwitcher = ({
    currencies,
    contentClassName = '',
    className = '',
  }: CurrencySwitcherProps) => {
    const {
      selectedCurrency,
      setCurrency,
      activeCurrencies,
      isLoadingCurrencies,
      fetchActiveCurrencies
    } = useCurrency();
    const { modules } = useAuthentication();

    const allCurrencies = getAllCurrencies(modules);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Extended currency names
    const currencyNames: Record<string, string> = {
      NGN: 'Nigerian Naira (NGN)',
      USD: 'United States Dollar (USD)',
      GHS: 'Ghanaian Cedi (GHS)',
      KES: 'Kenyan Shilling (KES)',
      TZS: 'Tanzanian Shilling (TZS)',
      ZAR: 'South African Rand (ZAR)',
      ZMW: 'Zambian Kwacha (ZMW)',
      GBP: 'British Pound Sterling (GBP)',
      EUR: 'Euro (EUR)',
      CAD: 'Canadian Dollar (CAD)',
      AUD: 'Australian Dollar (AUD)',
      INR: 'Indian Rupee (INR)',
      CNY: 'Chinese Yuan (CNY)',
      JPY: 'Japanese Yen (JPY)',
      AED: 'UAE Dirham (AED)',
      UGX: 'Ugandan Shilling (UGX)',
      XOF: 'West African CFA Franc (XOF)',
      XAF: 'Central African CFA Franc (XAF)',
    };

    const selectedLabel = currencyNames[selectedCurrency] || selectedCurrency;

    // Fetch active currencies from store on mount
    useEffect(() => {
      fetchActiveCurrencies();
    }, [fetchActiveCurrencies]);

    // Enhanced filtering: match code, label, or full name AND only show active currencies
    const filteredCurrencies = Object.entries(currencyNames)
      .filter(
        ([code, fullName]) =>
          activeCurrencies.includes(code) &&
          (fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(([value, label]) => ({ value, label }));

    const handleChange = (value: CurrencyOption) => {
      setCurrency(value);
      setIsOpen(false);
    };

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className={`relative w-full md:w-60 ${className}`} ref={dropdownRef}>
        {/* Selected Button */}
        <button
          type='button'
          className={`flex justify-between items-center w-full h-12 rounded px-4 bg-[#005BB01A] text-[#005BB0] font-bold text-sm ${contentClassName} ${isLoadingCurrencies ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isLoadingCurrencies && setIsOpen(prev => !prev)}
          disabled={isLoadingCurrencies}
        >
          <span>{isLoadingCurrencies ? 'Loading...' : (selectedLabel || 'Select Currency')}</span>
          <Icon name='caretDown' />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute z-50 mt-2 w-full bg-white text-black rounded-lg border border-grey-200 shadow-lg'>
            {/* Search Input */}
            <div className='p-2 border-b border-grey-100'>
              <input
                type='text'
                placeholder='Search currency...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
              />
            </div>

            {/* Scrollable Currency List */}
            <ul className='max-h-48 overflow-y-auto'>
              {isLoadingCurrencies ? (
                <li className='px-4 py-3 text-sm text-grey-500'>
                  Loading currencies...
                </li>
              ) : filteredCurrencies.length > 0 ? (
                filteredCurrencies.map(option => (
                  <li
                    key={option.value}
                    onClick={() => handleChange(option.value as CurrencyOption)}
                    className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] ${selectedCurrency === option.value ? 'bg-[#005BB00D]' : ''
                      }`}
                  >
                    {option.label}
                  </li>
                ))
              ) : (
                <li className='px-4 py-3 text-sm text-grey-500'>
                  No active currencies found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  export default CurrencySwitcher;