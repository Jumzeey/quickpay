import React, { SetStateAction, Dispatch, useState, useEffect } from 'react';
import Image from 'next/image';
import Card from '@/components/Card';
import CollectionDetails from './collections/CollectionDetails';
import Button from './button';
import Modal from './modal';
import { repushNotification, requestRefund } from '@/services/collections';
import {
  dateFormat,
  formatCurrency,
  notifyError,
  notifySuccess,
} from '@/util/utils';
import Loader from './loader';
import useCollectionHistory from '@/stores/useCollectionHistory';
import Table from './table';
import IconWrapper from './IconWrapper';
import useClickEvent from '@/stores/useClickEvent';
import TransactionDetails from './transactionDetails';
import RefundSkeleton from './RefundSkeleton';

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
    id,
    balance_before,
    created_at,
    reference,
    customer_reference,
    session_id,
    current_balance,
    value_date,
    processing_fee,
    sender_name,
    sender,
    failure_reason,
    metadata,
  } = selectedItem || {};

  const { fetchRefund, refund, getRefundLoading } = useCollectionHistory();

  useEffect(() => {
    if (status === 'Successful') {
      fetchRefund(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefundLoading, setIsRefundLoading] = useState(false);
  const [showRefundDetails, setShowRefundDetails] = useState(false);
  const { selectedItem: selectedRefund, handleClick } = useClickEvent();
  const [parsedMetadata, setParsedMetadata] = useState<any>({});

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openRefundModal = () => setRefundModal(true);
  const closeRefundModal = () => setRefundModal(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(failure_reason);
      setParsedMetadata(parsed);
    } catch (e) {
      console.error('Invalid JSON:', e);
      setParsedMetadata(null);
    }
  }, [failure_reason]);

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

  const handleRequestRefund = async (reference: string) => {
    setIsRefundLoading(true);
    try {
      const response = await requestRefund({ reference: reference });
      // @ts-ignore
      notifySuccess(response.message);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsRefundLoading(false);
      fetchRefund(id);
      closeRefundModal();
    }
  };

  const handleActionClick = (refund: any) => {
    handleClick(refund);
    setShowRefundDetails(true);
  };

  const columns = ['s/n', 'ref', 'amount', 'date', 'status', 'action'];
  return (
    <>
      {showRefundDetails ? (
        <TransactionDetails
          selectedItem={selectedRefund}
          setState={setShowRefundDetails}
          state={showRefundDetails}
          selectedModule='refunds'
          fromCollections
        />
      ) : (
        <div className='pt-5'>
          <Image
            src='/images/arrow-back.svg'
            className='cursor-pointer pb-6 md:pb-10'
            width={36}
            height={36}
            onClick={() => setState({ ...state, showCollections: false })}
            alt='back icon'
          />
          <Card className='!px-5 md:!px-7 !pb-10 md:!pb-20'>
            <h2 className='text-xl md:text-2xl'>Pay In Info</h2>

            <div className='border border-grey-200 rounded-xl mt-5 p-4 md:p-9'>
              <>
                <div className='flex flex-col md:flex-row justify-around gap-5 md:gap-20'>
                  <CollectionDetails
                    key1='Amount Sent'
                    value1={amount}
                    key2='Balance Before'
                    value2={balance_before}
                    key3='Transaction Reference'
                    value3={reference || 'N/A'}
                    key4='Customer Reference'
                    value4={customer_reference || 'N/A'}
                  />

                  <CollectionDetails
                    key1='Sender Name'
                    value1={sender_name || 'N/A'}
                    key2='Balance After'
                    value2={current_balance}
                    key3='Fees Charged'
                    value3={processing_fee}
                  />

                  <CollectionDetails
                    key1='Transaction Status'
                    value1={status}
                    key2='Session ID'
                    value2={session_id || 'N/A'}
                    key3='Transaction Time'
                    value3={created_at}
                    key4='Reason for Failure'
                    // value4={failure_reason}
                  />
                </div>

                <div className='flex flex-col md:flex-row items-center gap-4 mt-5 md:mt-7'>
                  <Button
                    text='View transaction meta'
                    ariaLabel='View trx button'
                    onClick={openModal}
                    plain
                    medium
                  />
                  <Button
                    text={isLoading ? <Loader /> : 'Re-push notification'}
                    ariaLabel='Repush notification button'
                    onClick={handleRepushNotification}
                    disabled={isLoading}
                    primary
                    medium
                  />
                  {status === 'Successful' && (
                    <Button
                      text={
                        isRefundLoading || getRefundLoading ? (
                          <Loader />
                        ) : (
                          'Request Refund'
                        )
                      }
                      ariaLabel='Request Refund button'
                      onClick={openRefundModal}
                      disabled={
                        !refund ||
                        refund.length !== 0 ||
                        isRefundLoading ||
                        getRefundLoading
                      }
                      primary
                      medium
                    />
                  )}
                </div>
              </>
            </div>

            {status === 'Successful' ? (
              <>
                {getRefundLoading ? (
                  <div className='border border-grey-200 rounded-xl mt-5 p-4 md:p-9'>
                    <RefundSkeleton singleRow />
                  </div>
                ) : (
                  refund?.length !== 0 && (
                    <div className='border border-grey-200 rounded-xl mt-5 p-4 md:p-9'>
                      <h2 className='text-xl md:text-2xl'>Refund Details</h2>
                      <Table columns={columns} className='mt-7' height>
                        {refund?.map((refund: any, index: number) => (
                          <tr
                            key={index}
                            className='border-b last:border-none border-grey-200'
                          >
                            <td className='text-sm px-5 py-6'>{index + 1}</td>
                            <td className='text-sm px-5 py-6'>
                              {refund.reference || 'N/A'}
                            </td>
                            <td className='text-sm px-5 py-6'>
                              {formatCurrency(refund.amount, refund.currency)}
                            </td>
                            <td className='text-sm px-5 py-6'>
                              {dateFormat(refund.date)}
                            </td>
                            <td className='text-xs px-5 py-6'>
                              <div
                                className={`text-center rounded-lg py-1 px-3 ${
                                  refund.status === 'Successful'
                                    ? 'text-success bg-[#E9F7EF]'
                                    : refund.status === 'Initiated'
                                    ? 'text-warning bg-[#fff3cd]'
                                    : 'text-danger bg-[#e0440326]'
                                }`}
                              >
                                {refund.status}
                              </div>
                            </td>

                            <td
                              className='text-sm px-5 py-6'
                              onClick={() => handleActionClick(refund)}
                            >
                              <IconWrapper
                                src='/images/eye-on-dark.svg'
                                className='cursor-pointer'
                                alt='Eye Icon'
                                width={24}
                                height={24}
                              />
                            </td>
                          </tr>
                        ))}
                      </Table>
                    </div>
                  )
                )}
              </>
            ) : (
              <></>
            )}
          </Card>

          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <div>
              <pre>{JSON.stringify(parsedMetadata, null, 2)}</pre>
            </div>
          </Modal>

          <Modal isOpen={refundModal} onClose={closeRefundModal}>
            <div className='p-6 sm:p-8 rounded-md'>
              <div className='flex justify-center text-center'>
                <div className='flex flex-col items-center max-w-md w-full'>
                  <h2 className='mt-2 text-2xl sm:text-3xl font-bold text-primary'>
                    Request Refund
                  </h2>
                  <p className='text-sm sm:text-base text-gray-600 mt-3'>
                    Are you sure you want to request a refund for this
                    transaction?
                  </p>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-left w-full mt-6'>
                    <div className='flex flex-col gap-y-2 pb-4'>
                      <span className='text-xs text-grey-300 font-semibold'>
                        Transaction Reference
                      </span>
                      <span className='text-sm font-medium text-gray-800'>
                        {reference || 'N/A'}
                      </span>
                    </div>
                    <div className='flex flex-col gap-y-2 pb-4'>
                      <span className='text-xs text-grey-300 font-semibold'>
                        Currency
                      </span>
                      <span className='text-sm font-medium text-gray-800'>
                        USD
                      </span>
                    </div>
                    <div className='flex flex-col gap-y-2 pb-4'>
                      <span className='text-xs text-grey-300 font-semibold'>
                        Amount
                      </span>
                      <span className='text-sm font-medium text-gray-800'>
                        {amount}
                      </span>
                    </div>
                    <div className='flex flex-col gap-y-2 pb-4'>
                      <span className='text-xs text-grey-300 font-semibold'>
                        Pan Number
                      </span>
                      <span className='text-sm font-medium text-gray-800'>
                        {sender && sender?.sender_name}
                      </span>
                    </div>
                    <div className='flex flex-col gap-y-2 pb-4 sm:col-span-2'>
                      <span className='text-xs text-grey-300 font-semibold'>
                        Transaction Date
                      </span>
                      <span className='text-sm font-medium text-gray-800'>
                        {created_at}
                      </span>
                    </div>
                  </div>

                  <div className='flex justify-center items-center gap-4 mt-8'>
                    <button
                      onClick={() => handleRequestRefund(customer_reference)}
                      className='flex justify-center items-center w-[120px] h-10 bg-primary text-white text-sm font-semibold rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed'
                      aria-label='Confirm refund request'
                      disabled={isRefundLoading}
                    >
                      {isRefundLoading ? <Loader /> : 'Confirm'}
                    </button>
                    <button
                      onClick={closeRefundModal}
                      className='w-[120px] h-10 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 transition'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </>
  );
};

export default CollectionDetailsWrapper;
