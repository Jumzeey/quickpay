import Icon from "@/components/icon";
import { motion } from "framer-motion";
import { Fragment } from "react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  onClose?: () => void;
  children: any;
  width?: boolean;
  className?: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, width, title, className }) => {
  if (!isOpen) return null;
  return (
    <Fragment>
      <div className="overlay fixed top-0 left-0 z-50 w-full h-full"></div>
      <div className="fixed inset-0 z-50 overflow-auto flex">
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative bg-white dark:bg-gray-800 w-[549px] m-auto flex-col flex rounded-xl mx-4 md:mx-auto ${width ? "modal-special-class" : ""} ${className}`}
        >
     <div className={`flex items-center justify-between shrink-0 ${title ? "px-4 pt-3 pb-3 md:px-6 md:pt-4 md:pb-3" : "pt-2 md:pt-6 pr-2 md:pr-6"}`}>
            {title ? <h2 className="text-lg font-extrabold text-black dark:text-white">{title}</h2> : <div />}

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <Icon name="cancel" className="size-6" />
              </button>
            ) : null}
          </div>

          {title && <div className="border-b border-[#C4C4C452] dark:border-gray-600" />}

          <div className="px-4 md:px-6 pt-2 pb-4 md:pb-6 text-gray-900 dark:text-gray-100">{children}</div>
        </motion.div>
      </div>
    </Fragment>
  );
};

export default Modal;
