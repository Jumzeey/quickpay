import { ChangeEvent, FocusEvent, useState } from "react";
import { FormikProps } from "formik";
import Image from "next/image";
import Icon from "./icon";

type FloatingLabelInputProps = {
  name: string;
  label: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement, Element>) => void;
  id: string;
  className?: string;
  divClassname?: string;
  type: string;
  htmlFor: string;
  value?: string;
  readOnly?: boolean;
  formik?: FormikProps<any>;
  maxLength?: number | undefined;
  tooltip?: string | undefined;
  numberOnly?: boolean;
  hasLink?: boolean;
  showError?: boolean;
  onFocus?: (e: FocusEvent<HTMLInputElement, Element>) => void;
};

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  name,
  label,
  id,
  type,
  htmlFor,
  value,
  onChange,
  onBlur,
  onFocus,
  readOnly,
  formik,
  maxLength,
  tooltip,
  numberOnly,
  hasLink,
  divClassname,
  showError = true,
}) => {
  const errorMessage = formik && name && formik.errors[name];
  const hasError = errorMessage && formik.touched[name];

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = (e: any) => {
    e.preventDefault();
    setShowPassword((prevState) => !prevState);
  };

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key: string | number = e.key;
    const isCmdOrCtrlV = (e.metaKey || e.ctrlKey) && key === "v";

    if (numberOnly && !isCmdOrCtrlV) {
      // Allow only numeric characters (0-9) and backspace
      if (!/^[0-9]$/.test(key) && key !== "Backspace") {
        e.preventDefault();
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    formik?.handleChange(e);

    if (name === "amount") {
      const value = e.target.value.replace(/,/g, "");

      if (value !== "") {
        const formattedAmount = Number(value).toLocaleString();
        formik?.setFieldValue("amount", formattedAmount);
      } else {
        formik?.setFieldValue("amount", "");
      }
    }
  };

  return (
    <div className={`relative w-full mr-2 pb-6 ${divClassname}`}>
      <input
        name={name}
        type={showPassword && type === "password" ? "text" : type}
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={handleNumberInput}
        className={`tracking-body-large w-full h-[60px] text-sm text-gray-900 bg-transparent rounded-md border-[1px] focus:outline-none focus:border-black peer ${
          hasError ? "border-danger" : "border-[#dcdcdc]"
        } ${name === "amount" ? "pl-10" : hasLink ? "pl-[66px]" : "px-3"}`}
        readOnly={readOnly}
        maxLength={maxLength}
      />

      {type === "password" && (
        <Image
          src={
            showPassword
              ? "/images/eye-close-dark.svg"
              : "/images/eye-on-dark.svg"
          }
          alt={showPassword ? "Hide password" : "Show password"}
          className="absolute left-[90%] top-[20%] cursor-pointer"
          width={28}
          height={28}
          onClick={togglePasswordVisibility}
          priority
        />
      )}
      {name === "amount" && (
        <Icon name="naira" className="absolute top-6 left-5" />
      )}
      <label
        htmlFor={htmlFor}
        className={`absolute text-base text-[#49454F] peer-focus:text-black duration-300 z-9 origin-[0] bg-white start-1 hover:cursor-text ${
          value
            ? "top-[-0.25rem] scale-50 -translate-y-2"
            : "scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-[-0.25rem] peer-focus:scale-50 peer-focus:-translate-y-2 top-[18px]"
        } ${name === "amount" ? "ml-10" : hasLink ? "ml-[66px]" : "px-3"}`}
      >
        {label}
      </label>

      {tooltip && (
        <span className="text-xs text-[#797979] inline-block pt-2">
          {tooltip}
        </span>
      )}
      <div>
        {showError && hasError && (
          <span className="text-danger inline-block text-sm font-medium pt-1">
            {typeof errorMessage === "string" && errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default FloatingLabelInput;
