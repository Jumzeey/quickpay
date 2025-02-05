import { ChangeEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  forCharts?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  forCharts,
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`py-2 border-grey-100 rounded-[5px] text-xs focus:border-black outline-none ${
        forCharts ? "cursor-pointer" : "px-4 border"
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
