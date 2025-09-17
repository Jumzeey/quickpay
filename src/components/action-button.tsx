import Icon from "@/components/icon";
import { FC, MouseEvent, ReactElement } from "react";

interface ActionButtonProps {
    text: string | ReactElement;
    iconName?: string;
    className?: string;
    ariaLabel: string;
    type?: "button" | "submit" | "reset";
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    disabled?: any;
}

const ActionButton: FC<ActionButtonProps> = ({
    text,
    iconName,
    className,
    ariaLabel,
    onClick,
    type = "button",
    disabled,
}) => {
    return (
        <button
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={onClick}
            type={type}
            className={"cursor-pointer flex items-center h-14 gap-2 bg-[#EFF7FE] text-primary text-[13px] font-semibold px-5 rounded-md hover:bg-primary-dark transition-colors duration-200" + (className ? ` ${className}` : "")}>
            {iconName && <Icon name={iconName} size="16" className="text-primary" />}

            <span>{text}</span>
        </button>
    );
};

export default ActionButton;
