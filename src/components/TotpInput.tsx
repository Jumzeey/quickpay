import FormInput from "@/components/FormInput";
import { InputHTMLAttributes } from "react";

/**
 * Input for TOTP (6-digit) or recovery code (10-char). Shown when user has totp_enabled
 * for sensitive actions. Backend accepts either in the same `otp` field.
 */
type TotpInputProps = {
  label?: string;
  id?: string;
  error?: string;
  touched?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const TotpInput = ({
  label = "Authenticator code",
  id = "otp",
  error,
  touched,
  ...props
}: TotpInputProps) => (
  <FormInput
    label={label}
    id={id}
    htmlFor={id}
    type="text"
    inputMode="numeric"
    autoComplete="one-time-code"
    placeholder="6-digit code or recovery code"
    maxLength={10}
    error={error}
    touched={touched}
    {...props}
  />
);

export default TotpInput;
