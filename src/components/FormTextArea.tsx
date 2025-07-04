import { ChangeEvent, forwardRef, TextareaHTMLAttributes } from "react";

type FormTextAreaProps = {
    label: string;
    id: string;
    isLoading?: boolean;
    loadingText?: string;
    htmlFor: string;
    error?: string;
    touched?: boolean;
    className?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>

const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
    ({
        label,
        id,
        isLoading,
        loadingText,
        htmlFor,
        error,
        touched,
        className = "",
        onChange,
        ...props
    }, ref) => {
        const { name } = props;
        const hasError = touched && error;

        const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
            onChange?.(e);
        };

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
                            <span className="text-xs font-medium">
                                {loadingText || 'Loading...'}
                            </span>
                        )}
                    </div>
                )}

                <div className="w-full relative">
                    <textarea
                        ref={ref}
                        id={id}
                        name={name}
                        onChange={handleChange}
                        className={`w-full min-h-[120px] rounded px-3 py-2 border resize-y
                            ${hasError ? "border-danger" : "border-[#C4C4C43D]"}
                            ${className}
                        `}
                        {...props}
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

FormTextArea.displayName = 'FormTextArea';

export default FormTextArea;