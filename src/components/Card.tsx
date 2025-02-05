import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  extraPadding?: boolean;
}

const Card = ({ children, className, extraPadding }: CardProps) => {
  return (
    <div
      className={`bg-white border border-solid border-[#F1F1F1] rounded-2xl shadow-sm cursor-pointer 
        ${extraPadding ? "md:w-[648px] md:py-12 md:px-16" : "p-4"} 
        ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
