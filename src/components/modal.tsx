import { Fragment } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type ModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: any;
  width?: boolean;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, width }) => {
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
          className={`relative p-2 md:p-8 bg-white w-[549px] m-auto flex-col flex rounded-xl mx-4 md:mx-auto ${
            width ? "modal-special-class" : ""
          }`}
        >
          {onClose ? (
            <button
              className="absolute top-0 right-0 m-4 text-gray-600 hover:text-gray-800"
              onClick={onClose}
            >
              <Image
                src="/images/cancel-blue.svg"
                alt="Cancel Image"
                width="20"
                height="20"
                priority
              />
            </button>
          ) : null}
          <div className="p-4">{children}</div>
        </motion.div>
      </div>
    </Fragment>
  );
};

export default Modal;
