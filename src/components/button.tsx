import React, { FC, MouseEvent, ReactElement } from "react";

interface ButtonProps {
  text: string | ReactElement;
  type?: "button" | "submit" | "reset" | undefined;
  className?: string;
  ariaLabel: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: any;
  primary?: boolean;
  plain?: boolean;
  small?: boolean;
  medium?: boolean;
}

const Button: FC<ButtonProps> = ({
  text,
  type,
  className,
  ariaLabel,
  onClick,
  disabled,
  primary,
  plain,
  small,
  medium,
}) => {
  return (
    <button
      type={type ? type : "submit"}
      className={`flex justify-center items-center text-sm rounded-md cursor-pointer disabled:cursor-no-drop disabled:bg-opacity-50 ${
        (!medium && !small) && "w-full h-[60px]"
      } ${medium && "w-[200px] h-10"} ${small && "w-[100px] h-10"} ${primary && "text-white bg-primary"} ${
        plain && "text-primary border border-primary hover:bg-primary hover:text-white"
      } ${className}`}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
