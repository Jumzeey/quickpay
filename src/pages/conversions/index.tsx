import Button from "@/components/button";
import InitiateConversion from "@/components/conversions/InitiateConversion";
import DynamicTable from "@/components/DynamicTable";
import Layout from "@/components/layout";
import WebPageTitle from "@/components/WebPageTitle";
import { getConversionHistory } from "@/services/conversions";
import useClickEvent from "@/stores/useClickEvent";
import useConversion from "@/stores/useConversion";
import useFilter from "@/stores/useFilter";
import debounce from "@/util/debounce";
import { downloadFile, formatAmount, formatDate, notifyError } from "@/util/utils";
import React, { useCallback, useEffect, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

interface ConversionsProps {
  isLoading: boolean;
  showFilterStatus: boolean;
  isInitiateConversionModalOpen: boolean;
  isRefundRequestModalOpen: boolean;
  isRaiseDisputeModalOpen: boolean;
  isMoreActionsOpen: boolean;
  [key: string]: boolean;
}

const ConversionHistory = () => {
  const { selectedItem, handleClick } = useClickEvent();
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });
  const {
    fetchConversionHistory,
    conversions,
    pagination,
    getConversionHistoryLoading,
  } = useConversion();

  const { showFilter, toggleFilter } = useFilter();

  const [state, setState] = useState<ConversionsProps>({
    isLoading: true,
    showFilterStatus: false,
    isInitiateConversionModalOpen: false,
    isRefundRequestModalOpen: false,
    isRaiseDisputeModalOpen: false,
    isMoreActionsOpen: false,
  });

  const closeDropdown = () => {
    setState({
      ...state,
      showFilterStatus: false,
    });
  };

  const handleActionClick = (item: any) => {
    handleClick(item);
    setState({ ...state, showConversions: true });
  };

  const columns = [{
    key: 'source_wallet',
    title: 'Source Wallet',
  }, {
    key: 'destination_wallet',
    title: 'Destination Wallet',
  }, {
    key: 'amount',
    title: 'Amount',
      render: (value: any, row: any) => formatAmount(row?.amount) || 'N/A',

  }, {
    key: 'reference',
    title: 'Transaction Reference',
  }, {
    key: 'timestamp',
    title: 'Timestamp',
  }, {
    key: 'rate',
    title: 'Transaction Rate',
  }];

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
      const response = await getConversionHistory({ export: true });
      downloadFile(response.export_link);
    } catch (error: any) {
      notifyError(error.message);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = pagination?.last_page;
  const lastPage = pagination?.last_page;

  // useEffect(() => {
  //   fetchConversionHistory({
  //     page: currentPage,
  //     ...(searchInput ? { search: searchInput } : {}),
  //     ...(statusFilter ? { status: statusFilter } : {}),
  //     ...(filter.startDate
  //       ? {
  //         start_date: formatDate(filter.startDate),
  //         end_date: formatDate(filter.endDate),
  //       }
  //       : {}),
  //   });
  // }, [
  //   searchInput,
  //   currentPage,
  //   filter.endDate,
  //   filter.startDate,
  //   statusFilter,
  //   fetchConversionHistory,
  // ]);

  const toggleModal = (name: string) => {
    setState(prevState => ({
      ...prevState,
      [name]: !prevState[name],
    }));
  };

  console.log({conversions})

  return (
    <Layout pageTitle="Conversions" icon="collection-history">
      <WebPageTitle title="Conversions | Ramp Merchant Portal" />

      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h2 className="text-xl font-semibold">Conversions</h2>
          <p className="text-sm pt-3 pb-5">
            Easily transfer funds between your accounts with seamless and secure conversions.
          </p>
        </div>
        <div className="relative flex justify-end mt-4 md:mt-0">
          <Button
            text="Initiate Conversion"
            ariaLabel="Initiate Conversion button"
            className="!w-[151px] !h-10 bg-[#EFF7FE] text-[#005BB0] font-medium"
            onClick={() => toggleModal('isInitiateConversionModalOpen')}
          />
        </div>
      </div>

      <div>
        {/* {state.isLoading ? (
          <Fragment>
            <TableSkeleton />
          </Fragment>
        ) : conversions?.length !== 0 ? ( */}
        <DynamicTable
          columns={columns}
          // data={[]}
          maxColumns={4}
          data={conversions}
        // copyId
        // copyField='Transaction Reference'
        // primaryBtnContent={
        //   <Button
        //     text={
        //       <>
        //         <span>Download receipt</span>
        //         <Image
        //           src='/images/download.svg'
        //           alt='download receipt'
        //           width={16}
        //           height={16}
        //           className='ml-2'
        //         />
        //       </>
        //     }
        //     ariaLabel="Download receipt button"
        //     className="!w-[191px] !h-[48px] p-0"
        //     onClick={handleDownload}
        //     primary
        //   />
        // }
        // secondaryBtnContent={
        //   <div className="relative block border border-[#EFF7FE] rounded-lg">
        //     <button
        //       onClick={() => toggleModal('isMoreActionsOpen')}
        //       className="text-sm text-[#005BB0] font-medium w-[150px] h-12 bg-[#EFF7FE] flex items-center justify-center"
        //     >
        //       More actions

        //       <Image
        //         src='/images/arrow-left-down.svg'
        //         alt='more actions'
        //         width={16}
        //         height={16}
        //         className='ml-3'
        //       />
        //     </button>
        //     <div
        //       ref={menuRef}
        //       className={`absolute left-0 top-full mt-1.5 w-60 bg-white border border-[#ececec] rounded-lg shadow-lg z-10 overflow-hidden animate-fadeIn ${state.isMoreActionsOpen ? 'block' : 'hidden'}`}
        //     >
        //       <div className="py-1">
        //         <button
        //           onClick={() => handleAction('requery')}
        //           className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
        //         >
        //           <Image
        //             src='/images/refresh-alt.svg'
        //             alt='requery transaction'
        //             width={16}
        //             height={16}
        //             className='ml-2'
        //           />
        //           <span className="text-[#090727]">Requery transaction</span>
        //         </button>

        //         <button
        //           onClick={() => toggleModal('isRefundRequestModalOpen')}
        //           className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
        //         >
        //           <Image
        //             src='/images/request.svg'
        //             alt='request refund'
        //             width={16}
        //             height={16}
        //             className='ml-2'
        //           />
        //           <span className="text-[#090727]">Request refund</span>
        //         </button>

        //         <button
        //           onClick={() => toggleModal('isRaiseDisputeModalOpen')}
        //           className="font-semibold text-sm w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
        //         >
        //           <Image
        //             src='/images/alert.svg'
        //             alt='raise dispute'
        //             width={16}
        //             height={16}
        //             className='ml-2'
        //           />
        //           <span className="text-[#FD2727]">Raise dispute</span>
        //         </button>
        //       </div>
        //     </div>
        //   </div>
        // }
        />
        {/* ) : (
          <EmptyState
            title="No Conversion Found"
            subTitle="We couldn't find any Conversion for this account"
            image="/images/dashboard/disbursement/disbursement-empty-state.svg"
          >
            <Button
              text="Initiate Conversion"
              ariaLabel="Initiate Conversion button"
              className="!w-[191px] !h-[48px]"
              onClick={() => toggleModal('isInitiateConversionModalOpen')}
              primary
            />
          </EmptyState>
        )} */}

        <InitiateConversion
          isModalOpen={state.isInitiateConversionModalOpen}
          closeModal={() => toggleModal('isInitiateConversionModalOpen')}
          fetchConversionHistory={fetchConversionHistory}
        />
      </div>
    </Layout>
  );
};

export default ConversionHistory;
