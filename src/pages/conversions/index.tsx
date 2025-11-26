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
import { downloadFile, formatAmount, formatDate, notifyError, currencySymbols } from "@/util/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

  // Transform API response to match table format
  const transformedConversions = useMemo(() => {
    if (!conversions || conversions.length === 0) return [];

    return conversions.map((conversion: any) => {
      // Parse meta field if it's a string
      let meta: { currency?: string;[key: string]: any } = {};
      try {
        meta = typeof conversion.meta === 'string' ? JSON.parse(conversion.meta) : (conversion.meta || {});
      } catch {
        meta = {};
      }

      const metaTyped = meta as { currency?: string;[key: string]: any };

      // Calculate destination amount if not provided
      const sourceAmount = parseFloat(conversion.source_amount || conversion.amount || '0');
      const conversionRate = parseFloat(conversion.conversion_rate || '0');
      let destinationAmount = conversion.destination_amount || conversion.converted_amount;

      if (!destinationAmount && conversionRate > 0 && sourceAmount > 0) {
        // Calculate: destination = source / rate
        destinationAmount = (sourceAmount / conversionRate).toFixed(2);
      }

      return {
        ...conversion,
        // Map API fields to table fields
        reference: conversion.transaction_reference || conversion.reference || 'N/A',
        timestamp: conversion.createdAt || conversion.created_at || conversion.timestamp,
        source_currency: conversion.source_currency || metaTyped.currency || 'N/A',
        destination_currency: conversion.destination_currency || 'N/A',
        source_amount: conversion.source_amount || conversion.amount || '0',
        destination_amount: destinationAmount || 'N/A',
        rate: conversion.conversion_rate || conversion.rate || conversion.exchange_rate || 'N/A',
        sla_time: conversion.sla_minutes || conversion.sla_time || conversion.sla || 'N/A',
        status: conversion.status || 'N/A',
        channel: conversion.channel || 'N/A',
        settlement_type: conversion.settlement_type || 'N/A',
        customer_reference: conversion.customer_reference || 'N/A',
        processorReference: conversion.processorReference || 'N/A',
        charge: conversion.charge || '0.00',
        netAmount: conversion.netAmount || '0.00',
        expectedAmount: conversion.expectedAmount || conversion.amount || '0.00',
        // Keep meta for currency symbol lookup
        meta: conversion.meta,
      };
    });
  }, [conversions]);

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

  // Helper function to get currency display name
  const getCurrencyDisplayName = (currencyCode: string): string => {
    // Return just the currency code
    return currencyCode || 'N/A';
  };

  // Helper function to format amount with conversion arrow
  const formatConversionAmount = (row: any) => {
    if (!row) return 'N/A';

    // Get source currency from meta if available
    let sourceCurrency = row.source_currency || '';
    let destinationCurrency = row.destination_currency || '';

    // Parse meta to get currency if source_currency is not available
    if (!sourceCurrency && row.meta) {
      try {
        const meta = typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta;
        sourceCurrency = meta.currency || '';
      } catch {
        // If parsing fails, try to get from row.meta directly
        sourceCurrency = row.meta?.currency || '';
      }
    }

    const sourceAmount = row.source_amount || row.amount || '0';
    const destinationAmount = row.destination_amount || row.converted_amount || '0';

    // Extract currency codes (handle both "NGN" and "Nigerian NGN" formats)
    const sourceCode = sourceCurrency.split(' ').pop() || sourceCurrency;
    const destCode = destinationCurrency.split(' ').pop() || destinationCurrency;

    // Get currency symbols from currencySymbols object
    const sourceSymbol = currencySymbols[sourceCode] || sourceCode;

    // If destination currency is missing, use a placeholder instead of currency code
    let destSymbol = '—';
    let formattedDest = destinationAmount;

    if (destCode && destCode !== 'N/A' && destinationCurrency !== 'N/A') {
      destSymbol = currencySymbols[destCode] || destCode;
      formattedDest = formatAmount(`${destSymbol}${destinationAmount}`);
    } else {
      // Use placeholder when destination currency is missing
      formattedDest = formatAmount(destinationAmount);
    }

    // Format source amount with proper currency symbol
    const formattedSource = formatAmount(`${sourceSymbol}${sourceAmount}`);

    return (
      <div className="flex items-center gap-2">
        <span>{formattedSource}</span>
        <Image
          src="/images/conversion_arrow.svg"
          alt="conversion arrow"
          width={20}
          height={20}
          className="flex-shrink-0"
        />
        <span>{formattedDest}</span>
      </div>
    );
  };

  // Helper function to format transaction rate with conversion arrow
  const formatConversionRate = (row: any) => {
    if (!row) return 'N/A';

    // Get source currency from meta if available
    let sourceCurrency = row.source_currency || '';
    let destinationCurrency = row.destination_currency || '';

    // Parse meta to get currency if source_currency is not available
    if (!sourceCurrency && row.meta) {
      try {
        const meta = typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta;
        sourceCurrency = meta.currency || '';
      } catch {
        sourceCurrency = row.meta?.currency || '';
      }
    }

    const rate = row.rate || row.exchange_rate || row.conversion_rate || '0';

    // Extract currency codes
    const sourceCode = sourceCurrency.split(' ').pop() || sourceCurrency;
    const destCode = destinationCurrency.split(' ').pop() || destinationCurrency;

    // Get currency symbols
    const sourceSymbol = currencySymbols[sourceCode] || sourceCode;
    const destSymbol = currencySymbols[destCode] || destCode;

    // Left side: destination currency (1.00), Right side: source currency (rate)
    // If destination currency is missing, show without symbol
    let leftSide = '1.00';
    if (destCode && destCode !== 'N/A' && destinationCurrency !== 'N/A') {
      leftSide = `${destSymbol}1.00`;
    }

    // Right side: rate with source currency symbol
    // If source currency is missing, show rate without currency symbol
    let rightSide;
    if (sourceCode && sourceCode !== 'N/A' && sourceCurrency !== 'N/A') {
      rightSide = formatAmount(`${sourceSymbol}${rate}`);
    } else {
      rightSide = formatAmount(rate);
    }

    return (
      <div className="flex items-center gap-2">
        <span>{leftSide}</span>
        <Image
          src="/images/conversion_arrow.svg"
          alt="conversion arrow"
          width={20}
          height={20}
          className="flex-shrink-0"
        />
        <span>{rightSide}</span>
      </div>
    );
  };

  // Helper function to format timestamp with time
  const formatTimestamp = (timestamp: string | Date | null | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      // Format as date and time
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return String(timestamp);
    }
  };

  const columns = [{
    key: 'source_currency',
    title: 'Source Currency',
    render: (value: any, row: any) => {
      const currencyCode = value?.split(' ').pop() || value || '';
      return getCurrencyDisplayName(currencyCode);
    },
  }, {
    key: 'destination_currency',
    title: 'Destination Currency',
    render: (value: any, row: any) => {
      const currencyCode = value?.split(' ').pop() || value || '';
      return getCurrencyDisplayName(currencyCode);
    },
  }, {
    key: 'amount',
    title: 'Amount',
    render: (value: any, row: any) => formatConversionAmount(row),
  }, {
    key: 'rate',
    title: 'Rate',
    render: (value: any, row: any) => formatConversionRate(row),
  }, {
    key: 'reference',
    title: 'Reference',
  }, {
    key: 'timestamp',
    title: 'Initiated At',
    render: (value: any, row: any) => {
      const timestamp = row.createdAt || row.created_at || value || row.initiated_at || row.timestamp;
      return formatTimestamp(timestamp);
    },
  }, {
    key: 'converted_at',
    title: 'Converted At',
    render: (value: any, row: any) => {
      const timestamp = row.updatedAt || row.updated_at || value || row.converted_at;
      return formatTimestamp(timestamp);
    },
  }, {
    key: 'sla_time',
    title: 'SLA Time',
    render: (value: any, row: any) => {
      const slaTime = value || row.sla_minutes || row.sla_time || row.sla || 'N/A';
      if (slaTime === 'N/A' || slaTime === null) return 'N/A';
      // If it's a number (minutes), convert to time format
      if (typeof slaTime === 'number') {
        const hours = Math.floor(slaTime / 60);
        const minutes = slaTime % 60;
        return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:00`;
      }
      // If it's already a string with colon, return as is
      if (typeof slaTime === 'string' && slaTime.includes(':')) {
        return slaTime;
      }
      // Otherwise format as minutes:00
      return `${slaTime}:00`;
    },
  }, {
    key: 'channel',
    title: 'Channel',
  }, {
    key: 'settlement_type',
    title: 'Settlement Type',
  }, {
    key: 'customer_reference',
    title: 'Customer Reference',
  }, {
    key: 'processorReference',
    title: 'Processor Reference',
  }, {
    key: 'charge',
    title: 'Charge',
    render: (value: any) => {
      return value && value !== '0.00' ? formatAmount(value) : value || 'N/A';
    },
  }, {
    key: 'netAmount',
    title: 'Net Amount',
    render: (value: any) => {
      return value && value !== '0.00' ? formatAmount(value) : value || 'N/A';
    },
  }];

  const debouncedHandleParamsChange = useMemo(
    () => debounce((value: string) => {
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

  useEffect(() => {
    fetchConversionHistory({
      page: currentPage,
      ...(searchInput ? { search: searchInput } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(filter.startDate && filter.endDate
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
    fetchConversionHistory,
  ]);

  const toggleModal = (name: string) => {
    setState(prevState => ({
      ...prevState,
      [name]: !prevState[name],
    }));
  };

  return (
    <Layout pageTitle="Conversions" icon="collection-history">
      <WebPageTitle title="Conversions | Cray Merchant Portal" />

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
          maxColumns={5}
          data={transformedConversions}
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
