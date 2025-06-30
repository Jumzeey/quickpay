import React, { useState, useEffect, Fragment } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import { getSettlementTransactions } from "@/services/transaction";
import { useRouter } from "next/router";
import EmptyState from "@/components/EmptyState";
import TransactionDetails from "@/components/transactionDetails";
import useClickEvent from "@/stores/useClickEvent";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";

interface SettlementTransactionProps {
  transactions: any[];
  isLoading: boolean;
  selectedItem: any | null;
  showCollections: boolean;
}

const SettlementTransaction = () => {
  const router = useRouter();
  const { selectedItem, rehydrated } = useClickEvent();

  const [state, setState] = useState<SettlementTransactionProps>({
    transactions: [],
    isLoading: true,
    selectedItem: null,
    showCollections: false,
  });

  useEffect(() => {
    fetchSettlementTransactions();
  }, [rehydrated, selectedItem]);

  const fetchSettlementTransactions = async () => {
    if (rehydrated) {
      const transactions = await getSettlementTransactions(
        selectedItem?.settlement_id,
        selectedItem?.id
      );
      setState({ ...state, transactions, isLoading: false });
    }
  };

  const handleClick = (item: any) => {
    setState({ ...state, selectedItem: item, showCollections: true });
  };

  const columns = [
    "s/n",
    "trx id",
    "settlement reference",
    "balance before",
    "amount",
    "net amount",
    "charge",
    "balance",
    "payment method",
    "session id",
    "status",
    "date",
    "action",
  ];

  return (
    <Layout pageTitle="Settlement Transaction" icon="history">
      <WebPageTitle title="Settlement Transactions | Ramp Merchant Portal" />
      {state.showCollections ? (
        <TransactionDetails
          selectedItem={state.selectedItem}
          setState={setState}
          state={state}
          selectedModule="settlements"
        />
      ) : (
        <div className="pt-5">
          {state.isLoading ? (
            <TableSkeleton />
          ) : state.transactions.length !== 0 ? (
            <Fragment>
              <Image
                src="/images/arrow-back.svg"
                className="cursor-pointer"
                width={36}
                height={36}
                onClick={() => router.back()}
                alt="back icon"
              />
              <h2 className="text-xl pt-5 font-semibold">
                Manage Settlement Transaction
              </h2>
              <p className="text-sm pt-3 pb-5">
                Manage settlement transaction within your company
              </p>
              <Card>
                <div className="flex justify-between pb-5">
                  <div className="relative">
                    <input
                      type="text"
                      id="searchInput"
                      name="searchInput"
                      placeholder="Search by reference"
                      className="border-0 h-[40px] w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                    />

                    <Image
                      src="/images/search.svg"
                      width={20}
                      height={20}
                      alt="Search Icon"
                      className="absolute top-[10px] left-3"
                    />
                  </div>

                  {/* <div className="flex gap-3">
                    <Button
                      ariaLabel="Filter button"
                      text="Filter"
                      className="!w-24 !h-10"
                      plain
                    />
                    <Button
                      ariaLabel="Export button"
                      text="Export"
                      className="!w-24 !h-10"
                      plain
                    />
                  </div> */}
                </div>
                <Table columns={columns} className="mt-7">
                  {state.transactions.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b last:border-none border-grey-200"
                    >
                      <td className="text-sm px-5 py-6">{index + 1}</td>
                      <td className="text-sm px-5 py-6">{item.trx_id}</td>
                      <td className="text-sm px-5 py-6">
                        {item.settlement_reference}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.balance_before}
                      </td>
                      <td className="text-sm px-5 py-6">{item.amount}</td>
                      <td className="text-sm px-5 py-6">{item.net_amount}</td>
                      <td className="text-sm px-5 py-6">{item.charge}</td>
                      <td className="text-sm px-5 py-6">
                        {item.current_balance}
                      </td>
                      <td className="text-sm px-5 py-6">
                        {item.payment_method}
                      </td>
                      <td className="text-sm px-5 py-6">{item.session_id}</td>
                      <td className="text-sm px-5 py-6">{item.status}</td>
                      <td className="text-sm px-5 py-6">{item.created_at}</td>
                      <td
                        className="text-sm px-5 py-6"
                        onClick={() => handleClick(item)}
                      >
                        <Image
                          src="/images/eye-on-dark.svg"
                          className="cursor-pointer"
                          alt="Eye Icon"
                          width={24}
                          height={24}
                          priority
                        />
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            </Fragment>
          ) : (
            <EmptyState
              title="No Settlement History Breakdown"
              subTitle="We couldn't find any settlement breakdown to this account"
              image="/images/history.svg"
            />
          )}
        </div>
      )}
    </Layout>
  );
};

export default SettlementTransaction;
