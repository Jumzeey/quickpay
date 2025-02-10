import React, { SetStateAction, Dispatch, useState } from "react";
import Image from "next/image";
import Card from "@/components/Card";
import CollectionDetails from "./collections/CollectionDetails";
import Button from "./button";
import Modal from "./modal";
import { repushNotification } from "@/services/collections";
import { notifyError, notifySuccess } from "@/util/utils";
import Loader from "./loader";

interface CollectionsProps {
  selectedItem: any;
  state: any;
  setState: Dispatch<SetStateAction<any>>;
}

const CollectionDetailsWrapper: React.FC<CollectionsProps> = ({
  selectedItem,
  state,
  setState,
}) => {
  const {
    status,
    amount,
    balance_before,
    created_at,
    reference,
    customer_reference,
    session_id,
    current_balance,
    value_date,
    processing_fee,
    sender_name,
    failure_reason,
  } = selectedItem || {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleRepushNotification = async () => {
    setIsLoading(true);
    try {
      const response = await repushNotification(selectedItem.id);
      // @ts-ignore
      notifySuccess(response.message);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-5">
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer pb-6 md:pb-10"
        width={36}
        height={36}
        onClick={() => setState({ ...state, showCollections: false })}
        alt="back icon"
      />
      <Card className="!px-5 md:!px-7 !pb-10 md:!pb-20">
        <h2 className="text-xl md:text-2xl">Collection Info</h2>

        <div className="border border-grey-200 rounded-xl mt-5 p-4 md:p-9">
          <>
            <div className="flex flex-col md:flex-row justify-around gap-5 md:gap-20">
              <CollectionDetails
                key1="Amount Sent"
                value1={amount}
                key2="Balance Before"
                value2={balance_before}
                key3="Transaction Reference"
                value3={reference || "N/A"}
                key4="Customer Reference"
                value4={customer_reference || "N/A"}
              />

              <CollectionDetails
                key1="Sender Name"
                value1={sender_name || "N/A"}
                key2="Balance After"
                value2={current_balance}
                key3="Fees Charged"
                value3={processing_fee}
              />

              <CollectionDetails
                key1="Transaction Status"
                value1={status}
                key2="Session ID"
                value2={session_id || "N/A"}
                key3="Transaction Time"
                value3={created_at}
                key4="Reason for Failure"
                value4={failure_reason}
              />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 mt-5 md:mt-7">
              <Button
                text="View transaction meta"
                ariaLabel="View trx button"
                onClick={openModal}
                plain
                medium
              />
              <Button
                text={isLoading ? <Loader /> : "Re-push notification"}
                ariaLabel="Repush notification button"
                onClick={handleRepushNotification}
                disabled={isLoading}
                primary
                medium
              />
            </div>
          </>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div>
          <pre>{JSON.stringify(selectedItem.metadata, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};

export default CollectionDetailsWrapper;
