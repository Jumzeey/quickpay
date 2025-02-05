import { useState } from "react";
import humanize from "@/util/utils";
import { ErrorMessage, useField } from "formik";
import clsx from 'clsx';
import Image from "next/image";

const Input = (props:any) => {
  const { type, name,label,placeholder, showpasswordtoggle = false} = props;
  const [field, meta] = useField(props);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = (e: any) => {
    e.preventDefault()
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="appInput w-full">
      {label ? <label>{label}</label> : ''}
      <input
        {...field}
        {...props}
        type={showPassword && props.type === "password" ? "text" : props.type}
        className={clsx(props.className, {
          'input-error': meta.touched && meta.error,
        })}
      />
      {props.showpasswordtoggle && props.type === "password" && (
        <button onClick={togglePasswordVisibility}>
          <Image
            src={showPassword ? "/images/eye-close.svg" : "/images/eye-on.png"}
            alt={showPassword ? "Hide password" : "Show password"}
            className="eye-icon"
            width={24}
            height={24}
            priority
          />
        </button>
      )}
      <ErrorMessage name={name}>
        {(message) => <div className="error-message">{humanize(message)}</div>}
      </ErrorMessage>
    </div>
  );
};
export default Input;
