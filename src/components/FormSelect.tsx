import { forwardRef } from "react";
import Select, { SelectOption } from "@/components/shared/Select";

type FormSelectProps = {
    label: string;
    isLoading?: boolean;
    loadingText?: string;
    options: SelectOption[];
    id: string;
    htmlFor: string;
    error?: string;
    touched?: boolean;
    className?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: { target: { name?: string; value: string } }) => void;
    name?: string;
    disabled?: boolean;
};

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label,
        id,
        isLoading,
        loadingText,
        options,
        error,
        htmlFor,
        touched,
        placeholder,
        value,
        onChange,
        name,
        disabled,
        ...props
    }, ref) => {
        const hasError = touched && error;

        const handleChange = (selectedValue: string) => {
            if (onChange) {
                onChange({
                    target: {
                        name: name,
                        value: selectedValue
                    }
                });
            }
        };

        return (
            <div className="flex flex-col gap-0.5">
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

                <Select
                    options={options}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    isLoading={isLoading}
                    loadingText={loadingText}
                    buttonClassName={hasError ? "border border-danger" : ""}
                />

                {hasError && (
                    <span className="text-danger inline-block text-xs font-medium pt-0.5">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);


FormSelect.displayName = 'FormSelect';

export default FormSelect;
