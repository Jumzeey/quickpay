import { forwardRef, SelectHTMLAttributes } from "react";

type FormSelectProps = {
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
} & SelectHTMLAttributes<HTMLSelectElement>;

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
        ...props
    }, ref) => {
        const hasError = touched && error;
        const { name } = props

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

                <select
                    ref={ref}
                    id={id}
                    name={name}
                    className={`h-[60px] w-full rounded px-3 border ${hasError ? "border-danger" : "border-[#C4C4C43D]"} `}
                    {...props}
                >
                    <option value="" disabled>
                        {placeholder || ""}
                    </option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

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
