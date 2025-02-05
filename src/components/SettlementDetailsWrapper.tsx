import React, { SetStateAction, Dispatch } from "react";
import Image from "next/image";
import Card from "@/components/Card";
import CollectionDetails from "./collections/CollectionDetails";

interface SettlementCollectionsProps {
  selectedItem: any;
  state: any;
  setState: Dispatch<SetStateAction<any>>;
  forCollections?: boolean;
}

const SettlementDetailsWrapper: React.FC<SettlementCollectionsProps> = ({
  selectedItem,
  state,
  setState,
}) => {
  const {
    status,
    amount,
    balance_before,
    created_at,
    session_id,
    rrn,
    charge,
    current_balance,
    net_amount,
    settlement_reference,
    ip_address,
    initiated_by,
    stan,
    tag,
  } = selectedItem || {};

  return (
    <div className="pt-5">
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer pb-10"
        width={36}
        height={36}
        onClick={() => setState({ ...state, showCollections: false })}
        alt="back icon"
      />
      <Card className="!px-7 !pb-20">
        <h2 className="text-2xl">Settlement Info</h2>

        <div className="border border-grey-200 rounded-xl mt-5 p-9">
          <div className="flex justify-around gap-20">
            <CollectionDetails
              key1="Amount"
              value1={amount}
              key2="Balance Before"
              value2={balance_before}
              key3="Value Date"
              value3={created_at}
              key4="Session ID"
              value4={session_id || "N/A"}
              key5="RRN"
              value5={rrn || "N/A"}
            />

            <CollectionDetails
              key1="Fees Charged"
              value1={charge}
              key2="Balance After"
              value2={current_balance}
              key3="Amount Spent"
              value3={net_amount}
              key4="IP Address"
              value4={ip_address || "N/A"}
              key5="STAN"
              value5={stan || "N/A"}
            />

            <CollectionDetails
              key1="Transaction Date"
              value1={created_at}
              key2="Transaction Ref"
              value2={settlement_reference}
              key3="Amount Received"
              value3={amount}
              key4="Initiated By"
              value4={initiated_by || "N/A"}
            />

            <CollectionDetails
              key1="Transaction Status"
              value1={status}
              key2="Tag"
              value2={tag || "N/A"}
              key3="Transaction Time"
              value3={created_at}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettlementDetailsWrapper;
