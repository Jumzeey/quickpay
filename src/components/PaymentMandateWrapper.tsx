import React, { SetStateAction, Dispatch } from "react";
import Image from "next/image";
import Card from "@/components/Card";
import CollectionDetails from "./collections/CollectionDetails";

interface SettlementCollectionsProps {
  selectedItem: any;
  setState: Dispatch<SetStateAction<any>>;
  forCollections?: boolean;
}

const PaymentMandateWrapper: React.FC<SettlementCollectionsProps> = ({
  selectedItem,
  setState,
}) => {
  const {
    amount,
    start_date,
    end_date,
    account_number,
    payer_address,
    narration,
    frequency_type,
    account_name,
    email,
    bank_name,
    payer_name,
    phone_number,
    frequency,
  } = selectedItem || {};

  return (
    <div className="pt-5">
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer pb-10"
        width={36}
        height={36}
        onClick={() => setState(false)}
        alt="back icon"
      />
      <Card className="!px-7 !pb-20">
        <h2 className="text-2xl">Payment Mandate</h2>

        <div className="border border-grey-200 rounded-xl mt-5 p-9">
          <div className="flex justify-around gap-20">
            <CollectionDetails
              key1="Start Date"
              value1={start_date}
              key2="Frequency"
              value2={frequency}
              key3="Account Number"
              value3={account_number}
              key4="Payer Address"
              value4={payer_address}
              key5="Narration"
              value5={narration || "N/A"}
            />

            <CollectionDetails
              key1="End Date"
              value1={end_date}
              key2="Frequency Type"
              value2={frequency_type}
              key3="Account Name"
              value3={account_name}
              key4="Email Address"
              value4={email}
            />

            <CollectionDetails
              key1="Amount"
              value1={amount}
              key2="Bank"
              value2={bank_name}
              key3="Payer Name"
              value3={payer_name}
              key4="Phone number"
              value4={phone_number}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentMandateWrapper;
