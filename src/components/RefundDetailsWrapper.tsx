import React, { SetStateAction, Dispatch, useState, useEffect } from 'react';
import Image from 'next/image';
import Card from '@/components/Card';
import Button from './button';
import Modal from './modal';
import Loader from './loader';
import CollectionDetails from './collections/CollectionDetails';
import { dateFormat, formatCurrency } from '@/util/utils';

interface RefundProps {
  selectedItem: any;
  state: any;
  setState: Dispatch<SetStateAction<any>>;
  fromCollections?: boolean;
}

const RefundDetailsWrapper: React.FC<RefundProps> = ({
  selectedItem,
  state,
  setState,
  fromCollections = false,
}) => {
  const { currency, amount, reference, status, transaction, date, metadata } =
    selectedItem || {};

  console.log(selectedItem);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsedMetadata, setParsedMetadata] = useState<any>({});
  // const [isLoading, setIsLoading] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(metadata);
      setParsedMetadata(parsed);
    } catch (e) {
      console.error('Invalid JSON:', e);
      setParsedMetadata({ error: 'Failed to parse refund data.' });
    }
  }, [metadata]);

  return (
    <div className='pt-5'>
      <Image
        src='/images/arrow-back.svg'
        className='cursor-pointer pb-6 md:pb-10'
        width={36}
        height={36}
        onClick={() => {
          if (fromCollections) {
            window.location.href = '/collections';
          } else {
            setState(false);
          }
        }}
        alt='back icon'
      />
      <Card className='!px-5 md:!px-7 !pb-10 md:!pb-20'>
        <h2 className='text-xl md:text-2xl'>Refund Info</h2>

        <div className='border border-grey-200 rounded-xl mt-5 p-4 md:p-9'>
          <>
            <div className='flex flex-col md:flex-row justify-around gap-5 md:gap-20'>
              <CollectionDetails
                key1='Amount'
                value1={formatCurrency(amount, currency)}
                key2='Currency'
                value2={currency}
                key3='Reference'
                value3={reference || 'N/A'}
              />

              <CollectionDetails
                key1='Pan Number'
                value1={transaction?.['pan number'] || 'N/A'}
                key2='Provider Reference'
                value2={transaction?.provider_reference || 'N/A'}
                key3='Transaction Reference'
                value3={transaction?.reference || 'N/A'}
              />

              <CollectionDetails
                key1='Refund Status'
                value1={status}
                key2='Transaction Type'
                value2={transaction?.transaction_type || 'N/A'}
                key3='Date'
                value3={dateFormat(date)}
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
            </div>
          </>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div>
          <pre className='text-wrap'>
            {JSON.stringify(parsedMetadata, null, 2)}
          </pre>
        </div>
      </Modal>
    </div>
  );
};
export default RefundDetailsWrapper;
