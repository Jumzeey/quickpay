import { createContext, ReactNode, useState } from "react";

interface SharedState {
  selectedItem: any;
  showModal: boolean;
  settlementId: any;
  setSelectedItem: (item: any) => void;
  setShowModal: (visibility: boolean) => void;
}

interface SharedStateContextProps {
  sharedState: SharedState;
  handleModalClick: (item: any, visibility: boolean) => void;
}

export const SharedStateContext = createContext<SharedStateContextProps | null>(
  null
);

const SharedState: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState = {
    selectedItem: null,
    settlementId: "",
    showModal: false,
    setShowModal: (visibility: boolean) =>
      setSharedState((prevState) => ({
        ...prevState,
        showModal: visibility,
      })),
    setSelectedItem: (item: any) =>
      setSharedState((prevState) => ({
        ...prevState,
        selectedItem: item,
      })),
  };

  const [sharedState, setSharedState] = useState<SharedState>(initialState);

  const handleModalClick = (item: any, visibility: boolean) => {
    setSharedState({ ...sharedState, selectedItem: item, showModal: visibility });
  };

  return (
    <SharedStateContext.Provider
      value={{
        sharedState,
        handleModalClick,
      }}
    >
      {children}
    </SharedStateContext.Provider>
  );
};

export default SharedState;
