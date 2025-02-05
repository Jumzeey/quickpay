import React, { FC, useState, ChangeEvent } from 'react';
import PropTypes from 'prop-types';

interface CheckboxProps {
  label: string;
  span?: string;
  checked?: boolean;
  className?: string;
  spanClassName?: string;
  onChange?: (checked: boolean) => void;
}

const Checkbox: FC<CheckboxProps> = ({ label, span,  spanClassName,checked = false, onChange,className }) => {
  const [isChecked, setChecked] = useState<boolean>(checked);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    setChecked(newChecked);
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <label className={className}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className='mr-2'
      />
      {label}<span className={`checkbox-${spanClassName}`}>{span}</span> 
    </label>
  );
};

export default Checkbox;
