import Button from "@/components/button";
import DynamicTable from "@/components/DynamicTable";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/icon";
import Loader from "@/components/loader";
import Pagination from "@/components/pagination";
import TableSkeleton from "@/components/TableSkeleton";
import { useApiResponse } from "@/hooks/useApiResponse";
import {
  initiateCryptoPayment,
  getCryptoAddresses,
  getCryptoAddressTransactions,
  CryptoPaymentResponse,
} from "@/services/crypto";
import { copyToClipboard } from "@/util/utils";
import React, { useCallback, useEffect, useState } from "react";

type SubTab = "addresses" | "initiate";

const StableCoin = () => {
  const { handleError, handleSuccess } = useApiResponse();
  const [subTab, setSubTab] = useState<SubTab>("addresses");

  // Addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressPage, setAddressPage] = useState(1);
  const [addressPagination, setAddressPagination] = useState<any>(null);

  // Address transactions state
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txPagination, setTxPagination] = useState<any>(null);

  // Initiate payment state (customer_reference is generated on submit)
  const [initiateForm, setInitiateForm] = useState({ amount: "" });
  const [isInitiating, setIsInitiating] = useState(false);
  const [paymentResult, setPaymentResult] = useState<CryptoPaymentResponse["data"] | null>(null);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const response = await getCryptoAddresses({
        page: addressPage,
        per_page: 10,
      });
      setAddresses(response?.data?.addresses || []);
      setAddressPagination(response?.data?.pagination || null);
    } catch (error: any) {
      handleError(error, "Failed to fetch crypto addresses");
    } finally {
      setAddressesLoading(false);
    }
  }, [addressPage, handleError]);

  // Fetch address transactions
  const fetchTransactions = useCallback(async () => {
    if (!selectedAddress) return;
    setTransactionsLoading(true);
    try {
      const response = await getCryptoAddressTransactions(selectedAddress, {
        page: txPage,
        per_page: 10,
      });
      setTransactions(response?.data || []);
      setTxPagination(response?.meta || null);
    } catch (error: any) {
      handleError(error, "Failed to fetch address transactions");
    } finally {
      setTransactionsLoading(false);
    }
  }, [selectedAddress, txPage, handleError]);

  useEffect(() => {
    if (subTab === "addresses" && !selectedAddress) {
      fetchAddresses();
    }
  }, [subTab, addressPage, selectedAddress, fetchAddresses]);

  useEffect(() => {
    if (selectedAddress) {
      fetchTransactions();
    }
  }, [selectedAddress, txPage, fetchTransactions]);

  // Countdown timer for payment result
  useEffect(() => {
    if (!paymentResult || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentResult, timeLeft]);

  const formatCountdown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const generateReference = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiateForm.amount) {
      handleError({ message: "Please enter the amount" });
      return;
    }
    setIsInitiating(true);
    try {
      const response = await initiateCryptoPayment({
        customer_reference: generateReference(),
        amount: Number(initiateForm.amount),
      });
      if (response?.data) {
        setPaymentResult(response.data);
        setTimeLeft(response.data.expires_in || 7200);
        handleSuccess(response, "Crypto payment initiated successfully");
      }
    } catch (error: any) {
      handleError(error, "Failed to initiate crypto payment");
    } finally {
      setIsInitiating(false);
    }
  };

  const handleViewTransactions = (address: string) => {
    setSelectedAddress(address);
    setTxPage(1);
  };

  const handleBackToAddresses = () => {
    setSelectedAddress(null);
    setTransactions([]);
    setTxPagination(null);
  };

  const resetInitiateForm = () => {
    setPaymentResult(null);
    setInitiateForm({ amount: "" });
    setTimeLeft(0);
  };

  const formatTimestamp = (timestamp: string | Date | null | undefined): string => {
    if (!timestamp) return "N/A";
    try {
      const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return String(timestamp);
    }
  };

  // Address columns for DynamicTable
  const addressColumns = [
    {
      key: "address",
      title: "Wallet Address",
      render: (value: any) => {
        if (!value) return "N/A";
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">
              {value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-10)}` : value}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(value);
              }}
              className="text-[#7F7F7F] hover:text-primary transition-colors"
            >
              <Icon name="copy3" size="14" />
            </button>
          </div>
        );
      },
    },
    {
      key: "chain_type",
      title: "Network",
      render: (value: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0B90B14] text-[#F0B90B] text-xs font-semibold">
          <span className="size-1.5 rounded-full bg-[#F0B90B]" />
          {value || "TRON"}
        </span>
      ),
    },
    {
      key: "currency",
      title: "Currency",
      render: (value: any) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <span className="flex items-center justify-center size-5 rounded-full bg-[#26A17B] text-white text-[8px] font-bold">
            ₮
          </span>
          {value || "USDT"}
        </span>
      ),
    },
    {
      key: "customer_reference",
      title: "Customer Reference",
      render: (_value: any, row: any) => row?.transaction?.customer_reference ?? row?.customer_reference ?? "N/A",
    },
    {
      key: "status",
      title: "Status",
      render: (_value: any, row: any) => {
        const expiresAt = row?.expires_at ? new Date(row.expires_at).getTime() : 0;
        const isExpired = expiresAt > 0 && expiresAt < Date.now();
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isExpired
              ? "bg-[#7F7F7F20] text-[#7F7F7F]"
              : "bg-[#26A17B14] text-[#26A17B]"
              }`}
          >
            <span
              className={`size-1.5 rounded-full ${isExpired ? "bg-[#7F7F7F]" : "bg-[#26A17B]"}`}
            />
            {isExpired ? "Expired" : "Active"}
          </span>
        );
      },
    },
    {
      key: "expires_at",
      title: "Expiry Date",
      render: (_value: any, row: any) => {
        const expiresAt = row?.expires_at;
        if (!expiresAt) return "N/A";
        const expiryTime = new Date(expiresAt).getTime();
        const isExpired = expiryTime < Date.now();
        return (
          <span className={isExpired ? "text-[#7F7F7F]" : "text-[#26A17B]"}>
            {formatTimestamp(expiresAt)}
          </span>
        );
      },
    },
    {
      key: "options",
      title: "",
      render: (_value: any, row: any) => (
        <Button
          text="View Transactions"
          ariaLabel="View address transactions"
          className="px-4 !h-9 !w-[160px] p-0 !text-xs"
          onClick={() => handleViewTransactions(row.address)}
          primary
        />
      ),
    },
  ];

  // Transaction columns for DynamicTable
  const transactionColumns = [
    {
      key: "reference",
      title: "Reference",
      render: (value: any) => {
        if (!value) return "N/A";
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">
              {value.length > 16 ? `${value.slice(0, 16)}...` : value}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(value);
              }}
              className="text-[#7F7F7F] hover:text-primary transition-colors"
            >
              <Icon name="copy3" size="14" />
            </button>
          </div>
        );
      },
    },
    {
      key: "amount",
      title: "Amount",
      render: (value: any) => {
        if (!value) return "N/A";
        return (
          <span className="font-semibold">
            {parseFloat(value).toFixed(2)} <span className="text-[#7F7F7F] text-xs">USDT</span>
          </span>
        );
      },
    },
    {
      key: "currency",
      title: "Currency",
      render: (value: any) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <span className="flex items-center justify-center size-5 rounded-full bg-[#26A17B] text-white text-[8px] font-bold">
            ₮
          </span>
          {value || "USDT"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (value: any) => value || "N/A",
    },
    {
      key: "chain_type",
      title: "Network",
      render: (value: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0B90B14] text-[#F0B90B] text-xs font-semibold">
          <span className="size-1.5 rounded-full bg-[#F0B90B]" />
          {value || "TRON"}
        </span>
      ),
    },
    {
      key: "date",
      title: "Date",
      render: (value: any) => value || "N/A",
    },
  ];

  // --- Initiate Pay-In Tab Content ---
  const renderInitiateTab = () => {
    if (paymentResult) {
      return (
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-lg">
            {/* Payment Result Card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#C4C4C429] bg-white dark:bg-dark shadow-sm">
              {/* Header gradient */}
              <div className="bg-gradient-to-r from-[#005BB0] to-[#0088FF] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-8 rounded-full bg-white/20 text-sm font-bold">
                      ₮
                    </span>
                    <span className="text-lg font-bold">USDT Payment</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentResult.status === "Pending"
                    ? "bg-[#F0B90B33] text-[#F0B90B]"
                    : paymentResult.status === "Successful"
                      ? "bg-[#26A17B33] text-[#26A17B]"
                      : "bg-white/20 text-white"
                    }`}>
                    {paymentResult.status}
                  </span>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm text-white/70 mb-1">Amount to Send</p>
                  <p className="text-4xl font-bold tracking-tight">
                    {parseFloat(paymentResult.amount).toFixed(2)}
                    <span className="text-lg ml-2 text-white/80">USDT</span>
                  </p>
                </div>

                {timeLeft > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Icon name="clock" size="14" className="text-white/70" />
                    <span className="text-sm text-white/70">Expires in</span>
                    <span className="font-mono font-bold text-[#F0B90B]">
                      {formatCountdown(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Wallet Address */}
                <div>
                  <label className="text-xs font-semibold text-[#7F7F7F] uppercase tracking-wider mb-2 block">
                    Send USDT (TRC-20) to this address
                  </label>
                  <div className="flex items-center gap-2 bg-[#F7F8FA] dark:bg-[#1A1A2E] border border-[#C4C4C43D] rounded-xl p-4">
                    <span className="font-mono text-sm flex-1 break-all text-dark-blue dark:text-light-blue">
                      {paymentResult.address}
                    </span>
                    <button
                      onClick={() => copyToClipboard(paymentResult.address)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Icon name="copy3" size="12" className="text-white" />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Network Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#C4C4C43D]" />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0B90B14] text-[#F0B90B] text-xs font-semibold border border-[#F0B90B33]">
                    <span className="size-1.5 rounded-full bg-[#F0B90B]" />
                    {paymentResult.chain_type} Network
                  </span>
                  <div className="flex-1 h-px bg-[#C4C4C43D]" />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F7F8FA] dark:bg-[#1A1A2E] rounded-xl p-3.5">
                    <p className="text-[10px] font-semibold text-[#7F7F7F] uppercase tracking-wider mb-1">
                      Reference
                    </p>
                    <p className="font-mono text-xs font-medium text-dark-blue dark:text-light-blue break-all">
                      {paymentResult.reference}
                    </p>
                  </div>
                  <div className="bg-[#F7F8FA] dark:bg-[#1A1A2E] rounded-xl p-3.5">
                    <p className="text-[10px] font-semibold text-[#7F7F7F] uppercase tracking-wider mb-1">
                      Customer Ref.
                    </p>
                    <p className="font-mono text-xs font-medium text-dark-blue dark:text-light-blue break-all">
                      {paymentResult.customer_reference}
                    </p>
                  </div>
                  <div className="bg-[#F7F8FA] dark:bg-[#1A1A2E] rounded-xl p-3.5">
                    <p className="text-[10px] font-semibold text-[#7F7F7F] uppercase tracking-wider mb-1">
                      Currency
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center size-4 rounded-full bg-[#26A17B] text-white text-[7px] font-bold">
                        ₮
                      </span>
                      <span className="text-xs font-semibold text-dark-blue dark:text-light-blue">
                        {paymentResult.currency}
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#F7F8FA] dark:bg-[#1A1A2E] rounded-xl p-3.5">
                    <p className="text-[10px] font-semibold text-[#7F7F7F] uppercase tracking-wider mb-1">
                      Date
                    </p>
                    <p className="text-xs font-medium text-dark-blue dark:text-light-blue">
                      {new Date(paymentResult.date).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF8E1] dark:bg-[#F0B90B14] border border-[#F0B90B33]">
                  <span className="shrink-0 flex items-center justify-center size-6 rounded-full bg-[#F0B90B] text-white text-xs font-bold mt-0.5">
                    !
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#B78A00] dark:text-[#F0B90B] mb-1">
                      Important
                    </p>
                    <p className="text-xs text-[#8B6914] dark:text-[#F0B90B99] leading-relaxed">
                      Only send <strong>USDT</strong> on the <strong>{paymentResult.chain_type}</strong> network
                      to this address. Sending any other token or using a different network may result in permanent loss of funds.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    text="New Payment"
                    ariaLabel="Create new payment"
                    onClick={resetInitiateForm}
                    className="!h-12"
                    plain
                  />
                  <Button
                    text="View Addresses"
                    ariaLabel="View all addresses"
                    onClick={() => {
                      resetInitiateForm();
                      setSubTab("addresses");
                      fetchAddresses();
                    }}
                    className="!h-12"
                    primary
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8 flex justify-center">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-[#C4C4C429] bg-white dark:bg-dark shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#005BB0] to-[#0088FF] p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center size-10 rounded-full bg-white/20 text-lg font-bold">
                  ₮
                </span>
                <div>
                  <h3 className="text-lg font-bold">Receive USDT</h3>
                  <p className="text-sm text-white/70">Generate a wallet address to receive USDT via TRON network</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleInitiatePayment} className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-semibold text-dark-blue dark:text-light-blue mb-2"
                >
                  Amount (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    placeholder="0.00"
                    min="0"
                    step="any"
                    value={initiateForm.amount}
                    onChange={(e) =>
                      setInitiateForm({ ...initiateForm, amount: e.target.value })
                    }
                    className="h-[52px] w-full outline-none bg-[#F7F8FA] dark:bg-[#1A1A2E] font-medium border border-[#C4C4C43D] text-dark-blue dark:text-light-blue text-sm pl-4 pr-20 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#26A17B14] border border-[#26A17B33]">
                    <span className="flex items-center justify-center size-4 rounded-full bg-[#26A17B] text-white text-[7px] font-bold">
                      ₮
                    </span>
                    <span className="text-xs font-semibold text-[#26A17B]">USDT</span>
                  </div>
                </div>
              </div>

              {/* Network Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#1A1A2E] border border-[#C4C4C43D]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0B90B14] text-[#F0B90B] text-xs font-semibold border border-[#F0B90B33]">
                  <span className="size-1.5 rounded-full bg-[#F0B90B]" />
                  TRON
                </span>
                <div>
                  <p className="text-xs font-medium text-dark-blue dark:text-light-blue">TRC-20 Network</p>
                  <p className="text-[10px] text-[#7F7F7F]">Default network for USDT transactions</p>
                </div>
              </div>

              <Button
                text={
                  isInitiating ? (
                    <span className="flex items-center gap-2">
                      <Loader /> Generating Address...
                    </span>
                  ) : (
                    "Generate Payment Address"
                  )
                }
                ariaLabel="Generate payment address"
                type="submit"
                disabled={isInitiating || !initiateForm.amount}
                className="!h-14 !rounded-xl !text-base !font-semibold"
                primary
              />
            </form>
          </div>
        </div>
      </div>
    );
  };

  // --- Addresses Tab Content ---
  const renderAddressesTab = () => {
    // If viewing transactions for a specific address
    if (selectedAddress) {
      return (
        <div className="mt-6">
          <button
            onClick={handleBackToAddresses}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mb-6"
          >
            <Icon name="arrowLeft" size="16" className="text-primary" />
            Back to Addresses
          </button>

          {/* Address Header Card */}
          <div className="flex items-center gap-4 p-5 rounded-xl border border-[#C4C4C429] bg-white dark:bg-dark mb-6">
            <div className="flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-[#005BB0] to-[#0088FF]">
              <span className="text-white text-lg font-bold">₮</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#7F7F7F] mb-1">Address Transactions</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium text-dark-blue dark:text-light-blue truncate">
                  {selectedAddress}
                </p>
                <button
                  onClick={() => copyToClipboard(selectedAddress)}
                  className="shrink-0 text-[#7F7F7F] hover:text-primary transition-colors"
                >
                  <Icon name="copy3" size="14" />
                </button>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0B90B14] text-[#F0B90B] text-xs font-semibold border border-[#F0B90B33]">
              <span className="size-1.5 rounded-full bg-[#F0B90B]" />
              TRON
            </span>
          </div>

          {transactionsLoading ? (
            <TableSkeleton />
          ) : transactions.length > 0 ? (
            <>
              <DynamicTable columns={transactionColumns} data={transactions} />
              {txPagination && txPagination.last_page > 1 && (
                <Pagination
                  currentPage={txPage}
                  totalPages={txPagination.last_page}
                  lastPage={txPagination.last_page}
                  onPageChange={setTxPage}
                />
              )}
            </>
          ) : (
            <EmptyState
              title="No Transactions Found"
              subTitle="This address has no transactions yet."
              image="/images/collections.svg"
            />
          )}
        </div>
      );
    }

    // Main addresses list
    return (
      <div className="mt-6">
        {addressesLoading ? (
          <TableSkeleton />
        ) : addresses.length > 0 ? (
          <>
            <DynamicTable
              columns={addressColumns}
              data={addresses}
              maxColumns={7}
            />
            {addressPagination && addressPagination.last_page > 1 && (
              <Pagination
                currentPage={addressPage}
                totalPages={addressPagination.last_page}
                lastPage={addressPagination.last_page}
                onPageChange={setAddressPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            title="No Addresses Found"
            subTitle="You haven't generated any USDT addresses yet. Initiate a payment to get started."
            image="/images/collections.svg"
          >
            <Button
              text="Initiate USDT Pay In"
              ariaLabel="Initiate USDT pay-in"
              onClick={() => setSubTab("initiate")}
              className="!w-[220px] !h-12 mt-2"
              primary
            />
          </EmptyState>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Crypto Header Stats Banner */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-[#C4C4C429] bg-white dark:bg-dark p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#7F7F7F] uppercase tracking-wider">Network</p>
              <p className="text-xl font-bold text-dark-blue dark:text-light-blue mt-1">TRON</p>
              <p className="text-xs text-[#7F7F7F] mt-0.5">TRC-20</p>
            </div>
            <div className="flex items-center justify-center size-12 rounded-full bg-[#F0B90B14]">
              <span className="text-[#F0B90B] text-xl font-bold">T</span>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-[#F0B90B08]" />
        </div>

        <div className="relative overflow-hidden rounded-xl border border-[#C4C4C429] bg-white dark:bg-dark p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#7F7F7F] uppercase tracking-wider">Currency</p>
              <p className="text-xl font-bold text-dark-blue dark:text-light-blue mt-1">USDT</p>
              <p className="text-xs text-[#7F7F7F] mt-0.5">Tether USD</p>
            </div>
            <div className="flex items-center justify-center size-12 rounded-full bg-[#26A17B14]">
              <span className="flex items-center justify-center size-10 rounded-full bg-[#26A17B] text-white text-lg font-bold">
                ₮
              </span>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-[#26A17B08]" />
        </div>

        <div className="relative overflow-hidden rounded-xl border border-[#C4C4C429] bg-white dark:bg-dark p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#7F7F7F] uppercase tracking-wider">Addresses</p>
              <p className="text-xl font-bold text-dark-blue dark:text-light-blue mt-1">
                {addressPagination?.total || addresses.length || 0}
              </p>
              <p className="text-xs text-[#7F7F7F] mt-0.5">Total generated</p>
            </div>
            <div className="flex items-center justify-center size-12 rounded-full bg-[#005BB014]">
              <Icon name="wallet" size="22" className="text-primary" />
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-[#005BB008]" />
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mt-8 flex items-center gap-1 p-1 bg-[#F7F8FA] dark:bg-[#1A1A2E] rounded-xl w-fit border border-[#C4C4C43D]">
        <button
          onClick={() => {
            setSubTab("addresses");
            setSelectedAddress(null);
          }}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${subTab === "addresses"
            ? "bg-white dark:bg-dark text-dark-blue dark:text-light-blue shadow-sm border border-[#C4C4C429]"
            : "text-[#7F7F7F] hover:text-dark-blue dark:hover:text-light-blue"
            }`}
        >
          Wallet Addresses
        </button>
        <button
          onClick={() => setSubTab("initiate")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${subTab === "initiate"
            ? "bg-white dark:bg-dark text-dark-blue dark:text-light-blue shadow-sm border border-[#C4C4C429]"
            : "text-[#7F7F7F] hover:text-dark-blue dark:hover:text-light-blue"
            }`}
        >
          Initiate Pay In
        </button>
      </div>

      {/* Content */}
      {subTab === "addresses" && renderAddressesTab()}
      {subTab === "initiate" && renderInitiateTab()}
    </div>
  );
};

export default StableCoin;
