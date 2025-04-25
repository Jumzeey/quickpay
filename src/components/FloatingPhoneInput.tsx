import { useState, useEffect, FocusEvent } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FormikProps } from 'formik';

const FloatingLabelPhoneInput = ({
  formik,
  label,
  name = 'phone',
  id = 'phone',
  isLoading = false,
}: {
  formik: FormikProps<any>;
  label: string;
  name?: string;
  id?: string;
  isLoading?: boolean;
}) => {
  const [focused, setFocused] = useState(false);

  const value = formik?.values[name];
  const errorMessage = formik?.errors[name];
  const touched = formik?.touched[name];
  const hasError = errorMessage && touched;

  const handleFocus = () => setFocused(true);
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    formik?.handleBlur(e);
  };

  const focusInput = () => {
    const input = document.querySelector<HTMLInputElement>(
      '.react-tel-input input'
    );
    input?.focus();
  };

  return (
    <div className='w-full pb-6 text-black'>
      <div className='relative w-full'>
        <PhoneInput
          country={'ng'}
          value={value}
          onChange={(value: string) => formik?.setFieldValue(name, value)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          inputClass='!w-full !p-2 !pl-14 !border !rounded-md !bg-transparent !text-black focus:!border-black !ring-0 !h-[60px]'
          containerClass='!w-full'
          buttonClass='!bg-transparent'
          enableSearch={true}
          countryCodeEditable={true}
          disabled={isLoading}
        />

        <label
          htmlFor={id}
          onClick={focusInput}
          className={`absolute left-12 text-base text-[#49454F] bg-white px-1 transition-all duration-300 z-10 origin-[0] hover:cursor-text
            ${
              value || focused
                ? 'top-[-0.25rem] scale-50 -translate-y-2'
                : 'top-[18px] scale-75'
            }`}
        >
          {label}
        </label>
      </div>

      {hasError && (
        <span className='text-danger inline-block text-sm font-medium pt-1'>
          {errorMessage as string}
        </span>
      )}
    </div>
  );
};

export default FloatingLabelPhoneInput;
