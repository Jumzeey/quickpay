import React, { SetStateAction, Dispatch, ReactElement, Fragment } from "react";
import CollectionDetailsWrapper from "./CoillectionDetailsWrapper";
import SettlementDetailsWrapper from "./SettlementDetailsWrapper";
import PaymentMandateWrapper from "./PaymentMandateWrapper";

interface SettlementCollectionsProps {
  selectedItem: any;
  state: any;
  setState: Dispatch<SetStateAction<any>>;
  selectedModule: string;
}

interface DetailsMapperProps {
  [key: string]: ReactElement;
}

const TransactionDetails: React.FC<SettlementCollectionsProps> = ({
  selectedItem,
  state,
  setState,
  selectedModule,
}) => {
  const detailsMapper: DetailsMapperProps = {
    collections: (
      <CollectionDetailsWrapper
        state={state}
        selectedItem={selectedItem}
        setState={setState}
      />
    ),
    settlements: (
      <SettlementDetailsWrapper
        state={state}
        selectedItem={selectedItem}
        setState={setState}
      />
    ),
    paymentMandate: (
      <PaymentMandateWrapper
        selectedItem={selectedItem}
        setState={setState}
      />
    ),
  };

  const selectedDetailWrapper = detailsMapper[selectedModule];

  return (
    <div className="pt-5">
      <Fragment>{selectedDetailWrapper}</Fragment>
    </div>
  );
};

export default TransactionDetails;
