import { useState, useEffect, useRef, ReactNode } from "react";
import Icon from "@/components/icon";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    searchable?: boolean;
    searchThreshold?: number; // Show search when options exceed this number
    className?: string;
    buttonClassName?: string;
    dropdownClassName?: string;
    emptyMessage?: string;
    renderOption?: (option: SelectOption, isSelected: boolean) => ReactNode;
    renderValue?: (selectedOption: SelectOption | undefined) => ReactNode;
}

const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select",
    disabled = false,
    isLoading = false,
    loadingText = "Loading...",
    searchable = true,
    searchThreshold = 5,
    className = "",
    buttonClassName = "",
    dropdownClassName = "",
    emptyMessage = "No options found",
    renderOption,
    renderValue,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (onChange) {
            onChange(optionValue);
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    const shouldShowSearch = searchable && options.length > searchThreshold;
    const displayValue = renderValue
        ? renderValue(selectedOption)
        : (selectedOption ? selectedOption.label : placeholder);

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            <button
                type="button"
                className={`flex justify-between items-center w-full h-[60px] rounded px-4 bg-[#005BB01A] text-[#005BB0] font-bold text-sm ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
                onClick={() => !disabled && !isLoading && setIsOpen(prev => !prev)}
                disabled={disabled || isLoading}
            >
                <span className="text-sm">
                    {isLoading ? loadingText : displayValue}
                </span>
                <Icon name="caretDown" />
            </button>

            {isOpen && (
                <div className={`absolute z-50 mt-2 w-full bg-white text-black rounded-lg border border-grey-200 shadow-lg ${dropdownClassName}`}>
                    {/* Search Input */}
                    {shouldShowSearch && (
                        <div className="p-2 border-b border-grey-100">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {/* Scrollable Options List */}
                    <ul className="max-h-48 overflow-y-auto">
                        {isLoading ? (
                            <li className="px-4 py-3 text-sm text-grey-500">
                                {loadingText}
                            </li>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = value === option.value;
                                return (
                                    <li
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`px-4 py-2 text-sm font-medium cursor-pointer hover:bg-[#005BB01A] ${isSelected ? 'bg-[#005BB00D]' : ''}`}
                                    >
                                        {renderOption ? renderOption(option, isSelected) : option.label}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-3 text-sm text-grey-500">
                                {emptyMessage}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Select;

