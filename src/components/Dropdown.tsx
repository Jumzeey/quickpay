import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { dropDownAnimation } from "@/animations";

interface DropdownProps {
  className?: string;
  children: ReactNode;
  onOpen: boolean;
  forFilter?: boolean;
  onClose?: () => void;
}

const Dropdown = ({
  className,
  children,
  onOpen,
  onClose,
  forFilter,
  ...restProps
}: DropdownProps) => {
  //Handle click outside modal
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose && onClose();
      }
    };

    if (onOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onOpen, onClose]);

  return (
    <AnimatePresence>
      {onOpen && (
        <motion.div
          className={`rounded-xl mb-4 absolute z-9 bg-[#fff] py-5 shadow-xl ${className}`}
          variants={dropDownAnimation}
          initial="hidden"
          animate="visible"
          ref={dropdownRef}
        >
          <div
            className={`w-[150px] ${className}`}
            {...restProps}
          ></div>
          <div
            className={`px-2 md:px-5 pt-4 ${
              forFilter ? "pb-4" : "pb-1"
            }`}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Dropdown;
