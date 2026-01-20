import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Field, Label, ComboboxButton } from '@headlessui/react'
import { forwardRef, SelectHTMLAttributes, useState } from 'react'

type FormSelectSearchProps = {
    label: string;
    isLoading?: boolean;
    loadingText?: string;
    options: { value: string; label: string }[];
    id: string;
    htmlFor: string;
    error?: string;
    touched?: boolean;
    className?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    name?: string;
    disabled?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'>;

const FormSelectSearch = forwardRef<HTMLInputElement, FormSelectSearchProps>(
    ({ 
        label,
        id,
        isLoading,
        loadingText,
        options,
        error,
        htmlFor,
        touched,
        placeholder,
        value = "",
        onChange,
        onBlur,
        name,
        disabled,
        ...props
    }, ref) => {
        const [query, setQuery] = useState('');
        const hasError = touched && error;

        // Find selected option based on value
        const selectedOption = options.find(option => option.value === value) || null;

        // Filter options based on search query
        const filteredOptions = query === ''
            ? options
            : options.filter((option) => {
                return option.label.toLowerCase().includes(query.toLowerCase()) ||
                       option.value.toLowerCase().includes(query.toLowerCase());
            });

        const handleSelectionChange = (option: { value: string; label: string } | null) => {
            if (onChange && option) {
                onChange(option.value);
                setQuery(''); // Clear query after selection
            }
        };

        const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setQuery(event.target.value);
        };

        return (
            <div className="flex flex-col gap-0.5">
                {/* {label && (
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor={htmlFor || name || id}
                            className="text-sm font-semibold text-black"
                        >
                            {label}
                        </Label>

                        {isLoading && (
                            <span className="text-xs font-medium">{loadingText || 'Loading...'}</span>
                        )}
                    </div>
                )} */}

                {label && (
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor={htmlFor || name || id}
                            className="text-sm font-semibold text-black">
                            {label}
                        </label>

                        {isLoading && (
                            <span className="text-xs font-medium">{loadingText || 'Loading...'}</span>
                        )}
                    </div>
                )}

                <Field>
                    <Combobox
                        value={selectedOption}
                        onChange={handleSelectionChange}
                        onClose={() => setQuery('')}
                        disabled={disabled}
                    >
                        {({ open }) => (
                            <>
                                <div className="relative">
                                    <ComboboxInput
                                        ref={ref}
                                        id={id}
                                        name={name}
                                        className={`h-[60px] w-full rounded px-3 border pr-10 ${
                                            hasError ? "border-danger" : "border-[#C4C4C43D]"
                                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        displayValue={(option: { value: string; label: string } | null) => 
                                            option ? option.label : query || ''
                                        }
                                        onChange={handleInputChange}
                                        onFocus={() => {
                                            // Clear query on focus to show all options
                                            if (!query) {
                                                setQuery('');
                                            }
                                        }}
                                        onClick={() => {
                                            // Ensure dropdown opens on click even without typing
                                            if (ref && typeof ref !== 'function' && ref.current) {
                                                ref.current.focus();
                                            }
                                        }}
                                        onBlur={onBlur}
                                        placeholder={placeholder || "Type to search..."}
                                        disabled={disabled}
                                        autoComplete="off"
                                    />
                                    
                                    {/* Clickable button to open dropdown */}
                                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </ComboboxButton>

                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                        </div>
                                    )}
                                </div>

                                {open && (
                                    <ComboboxOptions 
                                        anchor="bottom" 
                                        className="w-[var(--input-width)] bg-white border border-[#C4C4C43D] mt-2 rounded shadow-lg max-h-60 overflow-auto z-50"
                                    >
                                        {filteredOptions.length === 0 && query !== '' ? (
                                            <div className="px-3 py-2 text-sm text-gray-500">
                                                No {name} found matching `{query}`
                                            </div>
                                        ) : (
                                            filteredOptions.map((option, index) => (
                                                <ComboboxOption
                                                    key={index}
                                                    value={option}
                                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 data-[focus]:bg-blue-100 data-[selected]:bg-blue-500"
                                                >
                                                    {option.label}
                                                </ComboboxOption>
                                            ))
                                        )}
                                    </ComboboxOptions>
                                )}
                            </>
                        )}
                    </Combobox>
                </Field>

                {hasError && (
                    <span className="text-danger inline-block text-xs font-medium pt-0.5">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

FormSelectSearch.displayName = 'FormSelectSearch';

export default FormSelectSearch;