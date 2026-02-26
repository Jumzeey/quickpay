import Image from "next/image";
import { ChangeEvent, forwardRef, InputHTMLAttributes, useState } from "react";

type FormInputProps = {
    label: string;
    labelLeftElement?: React.ReactNode;
    id: string;
    isLoading?: boolean;
    loadingText?: string;
    htmlFor: string;
    error?: string;
    touched?: boolean;
    className?: string;
    numberOnly?: boolean;
} & InputHTMLAttributes<HTMLInputElement>

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({
        label,
        labelLeftElement,
        id,
        isLoading,
        loadingText,
        htmlFor,
        error,
        touched,
        className = "",
        numberOnly,
        onChange,
        type,
        ...props
    }, ref) => {
        const { name } = props;
        const hasError = touched && error;
        const [showPassword, setShowPassword] = useState(false);
        const isPasswordField = type === "password";

        const togglePasswordVisibility = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPassword((prevState) => !prevState);
        };

        const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
            const key: string | number = e.key;
            const isCmdOrCtrlV = (e.metaKey || e.ctrlKey) && key === "v";

            if (numberOnly && !isCmdOrCtrlV) {
                const allowedKeys = [
                    "Backspace", "Delete", "Tab", "Escape", "Enter",
                    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"
                ];

                if (!allowedKeys.includes(key) && !/^[0-9.]$/.test(key)) {
                    e.preventDefault();
                }
            }
        };

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            let value = e.target.value;

            if (name === "amount" || name?.includes("amount")) {
                const numericValue = value.replace(/,/g, "");

                if (numericValue !== "" && !isNaN(Number(numericValue))) {
                    const formattedValue = Number(numericValue).toLocaleString();

                    const syntheticEvent = {
                        ...e,
                        target: {
                            ...e.target,
                            value: formattedValue
                        }
                    } as ChangeEvent<HTMLInputElement>;

                    onChange?.(syntheticEvent);
                    return;
                }
            }

            onChange?.(e);
        };

        const inputType = isPasswordField && showPassword ? "text" : type;

        return (
            <div className="flex flex-col gap-0.5">
                {label && (
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor={htmlFor || name || id}
                            className="text-sm font-semibold text-black dark:text-white">
                            {label}
                        </label>

                        {isLoading && (
                            <span className="text-xs font-medium">{loadingText || 'Loading...'}</span>
                        )}

                        {labelLeftElement && labelLeftElement}
                    </div>
                )}

                <div className="w-full h-[60px] relative">
                    <input
                        ref={ref}
                        type={inputType}
                        id={id}
                        name={name}
                        onChange={handleChange}
                        onKeyDown={handleNumberInput}
                        className={`h-[60px] w-full rounded px-3 border transition-colors ${
                            hasError 
                                ? "border-danger" 
                                : props.disabled 
                                    ? "border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed" 
                                    : "border-[#C4C4C43D] hover:border-[#005BB0]/30 focus:border-[#005BB0] focus:outline-none focus:ring-2 focus:ring-[#005BB0]/20"
                        }`}
                        {...props}
                    />

                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer hover:opacity-70 focus:outline-none"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            <Image
                                src={
                                    showPassword
                                        ? "/images/eye-close-dark.svg"
                                        : "/images/eye-on-dark.svg"
                                }
                                alt={showPassword ? "Hide password" : "Show password"}
                                width={24}
                                height={24}
                                priority
                            />
                        </button>
                    )}
                </div>

                {hasError && (
                    <span className="text-danger block text-xs font-medium pt-0.5 whitespace-pre-line">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

export default FormInput;