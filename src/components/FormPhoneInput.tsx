import { forwardRef, useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

type FormPhoneInputProps = {
    label: string;
    id: string;
    isLoading?: boolean;
    loadingText?: string;
    htmlFor: string;
    error?: string;
    touched?: boolean;
    className?: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    country?: string;
    disabled?: boolean;
}

const FormPhoneInput = forwardRef<HTMLInputElement, FormPhoneInputProps>(
    ({
        label,
        id,
        isLoading,
        loadingText,
        htmlFor,
        error,
        touched,
        className = "",
        value,
        onChange,
        onBlur,
        country = 'ng',
        disabled = false,
    }, ref) => {
        const [focused, setFocused] = useState(false);
        const hasError = touched && error;

        const handleFocus = () => setFocused(true);
        const handleBlur = () => {
            setFocused(false);
            onBlur?.();
        };

        return (
            <div className="flex flex-col gap-0.5">
                {label && (
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor={htmlFor || id}
                            className="text-sm font-semibold text-black dark:text-white">
                            {label}
                        </label>

                        {isLoading && (
                            <span className="text-xs font-medium">
                                {loadingText || 'Loading...'}
                            </span>
                        )}
                    </div>
                )}

                <div className="w-full h-[60px] relative">
                    <PhoneInput
                        country={country}
                        value={value}
                        onChange={onChange}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        containerClass={`h-[60px] w-full rounded px-3 border ${hasError ? "border-danger" : "border-[#C4C4C43D]"}`}
                        buttonClass="!bg-transparent"
                        enableSearch={true}
                        countryCodeEditable={true}
                        disabled={disabled || isLoading}
                        inputProps={{
                            id,
                            ref,
                            className
                        }}
                    />
                </div>

                {hasError && (
                    <span className="text-danger inline-block text-xs font-medium pt-0.5">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

FormPhoneInput.displayName = 'FormPhoneInput';

export default FormPhoneInput;