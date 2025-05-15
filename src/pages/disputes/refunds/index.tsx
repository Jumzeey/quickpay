import Button from '@/components/button';
import Card from '@/components/Card';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import Filter from '@/components/Filter';
import IconWrapper from '@/components/IconWrapper';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import Image from 'next/image';
import Table from '@/components/table';
import TableSkeleton from '@/components/TableSkeleton';
import TransactionDetails from '@/components/transactionDetails';
import WebPageTitle from '@/components/WebPageTitle';
import useClickEvent from '@/stores/useClickEvent';
import useCollectionHistory from '@/stores/useCollectionHistory';
import {
  dateFormat,
  downloadFile,
  formatCurrency,
  formatDate,
  notifyError,
} from '@/util/utils';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useFilter from '@/stores/useFilter';
import { debounce } from 'chart.js/helpers';
import { getRefunds } from '@/services/collections';

const Refunds = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const [showRefundDetails, setShowRefundDetails] = useState(false);
  const { selectedItem: selectedRefund, handleClick } = useClickEvent();
  const { fetchRefunds, refund, getRefundLoading, pagination } =
    useCollectionHistory();

  const columns = ['s/n', 'ref', 'amount', 'date', 'status', 'action'];
  const { showFilter, toggleFilter } = useFilter();
  const [state, setState] = useState({
    showFilterStatus: false,
  });

  const closeDropdown = () => {
    setState({
      ...state,
      showFilterStatus: false,
    });
  };

  const handleActionClick = (refund: any) => {
    handleClick(refund);
    setShowRefundDetails(true);
  };

  const debouncedHandleParamsChange = useCallback(
    debounce((value: string) => {
      setSearchInput(value);
    }, 300),
    []
  );

  const handleParamsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedHandleParamsChange(event.target.value);
  };

  const handleExport = async () => {
    try {
      const response = await getRefunds({ export: true });
      downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchRefunds({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filter.startDate
        ? {
            start_date: formatDate(filter.startDate),
            end_date: formatDate(filter.endDate),
          }
        : {}),
    });
  }, [
    searchInput,
    currentPage,
    filter.endDate,
    filter.startDate,
    statusFilter,
    fetchRefunds,
  ]);

  useEffect(() => {
    fetchRefunds({ page: currentPage });
  }, [currentPage]);

  return (
    <Layout pageTitle='Refunds' icon='payment-mandate'>
      <WebPageTitle title='Refunds | Ramp Merchant Portal' />
      {showRefundDetails ? (
        <TransactionDetails
          selectedItem={selectedRefund}
          setState={setShowRefundDetails}
          state={showRefundDetails}
          selectedModule='refunds'
        />
      ) : (
        <div>
          {getRefundLoading ? (
            <Fragment>
              <TableSkeleton />
            </Fragment>
          ) : refund?.length !== 0 ? (
            <Fragment>
              <Card className='mt-10'>
                {/* <div className='flex flex-col md:flex-row justify-between pb-5'>
                  <div className='relative'>
                    <input
                      type='text'
                      id='searchInput'
                      name='searchInput'
                      placeholder='Search by reference'
                      onChange={handleParamsChange}
                      className='border-0 h-[40px] w-full md:w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md'
                    />
                    <Image
                      src='/images/search.svg'
                      width={20}
                      height={20}
                      alt='Search Icon'
                      className='absolute top-[10px] left-3'
                    />
                  </div>

                  <div className='flex flex-col md:flex-row gap-3 mt-5 md:mt-0'>
                    <Button
                      ariaLabel='Filter by status button'
                      text='Filter By Status'
                      onClick={() =>
                        setState({
                          ...state,
                          showFilterStatus: !state.showFilterStatus,
                        })
                      }
                      className='!w-full md:!w-32 !h-10'
                      plain
                    />
                    <Button
                      ariaLabel='Filter by date button'
                      text='Filter By Date'
                      onClick={() => toggleFilter()}
                      className='!w-full md:!w-32 !h-10'
                      plain
                    />
                    <Button
                      ariaLabel='Export button'
                      text='Export'
                      className='md:!w-24 !h-10'
                      onClick={handleExport}
                      plain
                    />
                  </div>
                </div> */}
                {/* <div className='relative flex justify-end md:mt-0'>
                  <Dropdown
                    onOpen={state.showFilterStatus}
                    onClose={closeDropdown}
                  >
                    <p onClick={() => setStatusFilter('Initiated')}>Initiated</p>
                    <p onClick={() => setStatusFilter('Failed')}>Failed</p>
                    <p onClick={() => setStatusFilter('Successful')}>
                      Successful
                    </p>
                  </Dropdown>
                </div> */}
                {/* <div className='relative flex justify-end -mt-4'>
                  <Dropdown onOpen={showFilter} onClose={toggleFilter}>
                    <Filter filterCallback={setFilter} />
                  </Dropdown>
                </div> */}
                <Table columns={columns} className='mt-7'>
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
                <Pagination
                  lastPage={pagination?.last_page}
                  currentPage={currentPage}
                  totalPages={pagination?.last_page}
                  onPageChange={handlePageChange}
                />
              </Card>
            </Fragment>
          ) : (
            <EmptyState
              title='No Refunds Found'
              subTitle="We couldn't find any refunds for this account"
              image='/images/dashboard/disbursement/disbursement-empty-state.svg'
            />
          )}
        </div>
      )}
    </Layout>
  );
};

export default Refunds;
