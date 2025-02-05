  export const PopupAnimation = {
    hidden: {
      opacity: 0,
      y: -50,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };
  
  export const MultiStepAnimation = {
    hidden: {
      opacity: 0,
      x: 100,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        ease: "easeInOut",
        duration: 0.5,
      },
    },
    goBack: {
      x: -100,
      opacity: 0,
    },
  };
  
  export const dropDownAnimation = {
    hidden: {
      y: -60,
    },
    visible: {
      y: 0,
      transition: {
        duration: 0.2,
        type: "spring",
        damping: 15,
        stiffness: 300,
      },
    },
  };
  