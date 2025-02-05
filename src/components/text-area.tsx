import { ChangeEvent, FocusEvent } from "react";
import { FormikProps } from "formik";

type TextAreaProps = {
  name: string;
  label: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement, Element>) => void;
  id: string;
  className?: string;
  value?: string;
  rows: number;
  cols: number;
  formik?: FormikProps<any>;
};

const TextArea: React.FC<TextAreaProps> = ({
  name,
  label,
  id,
  value,
  rows,
  cols,
  onChange,
  onBlur,
  formik,
}) => {
  const errorMessage = formik && name && formik.errors[name];
  const hasError = errorMessage && formik.touched[name];

  return (
    <div className="relative w-full mr-2 pb-6">
      <textarea
        name={name}
        id={id}
        value={value}
        rows={rows}
        cols={cols}
        onChange={onChange}
        onBlur={onBlur}
        className={`tracking-body-large w-full text-sm text-gray-900 bg-transparent rounded-md border-[1px] focus:outline-none focus:border-black peer px-3 ${
          hasError ? "border-danger" : "border-[#dcdcdc]"
        }`}
      ></textarea>

      <label
        htmlFor={id}
        className={`absolute text-base text-[#49454F] peer-focus:text-black duration-300 z-9 origin-[0] bg-white start-1 hover:cursor-text px-3 ${
          value
            ? "top-[-0.25rem] scale-50 -translate-y-2"
            : "scale-75 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-[-0.25rem] peer-focus:scale-50 peer-focus:-translate-y-2 top-[18px]"
        }`}
      >
        {label}
      </label>

      <div>
        {hasError && (
          <span className="text-danger inline-block text-sm font-medium">
            {typeof errorMessage === "string" && errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
