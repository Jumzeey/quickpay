import React, { useState, useEffect, Fragment } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import { getVirtualAccountTransactions } from "@/services/collections";
import { useRouter } from "next/router";
import EmptyState from "@/components/EmptyState";
import useClickEvent from "@/stores/useClickEvent";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";

interface VirtualAccountTransactionProps {
  transactions: any[];
  isLoading: boolean;
}

const VirtualAccountTransaction = () => {
  const router = useRouter();
  const { selectedItem, rehydrated } = useClickEvent();

  const [state, setState] = useState<VirtualAccountTransactionProps>({
    transactions: [],
    isLoading: true,
  });

  useEffect(() => {
    fetchVirtualAccountTransactions();
  }, [rehydrated, selectedItem]);

  const fetchVirtualAccountTransactions = async () => {
    if (rehydrated) {
      const transactions = await getVirtualAccountTransactions(
        selectedItem.account_number
      );
      setState({ ...state, transactions, isLoading: false });
    }
  };

  const columns = ["s/n", "amount", "net amount", "charge", "sender"];

  return (
    <Layout pageTitle="Virtual Account Transactions" icon="virtual-accounts">
      <WebPageTitle title="Virtual Account Transactions | Cray Merchant Portal" />
      <div className="pt-5">
        {state.isLoading ? (
          <TableSkeleton />
        ) : state.transactions.length > 0 ? (
          <>
            <Image
              src="/images/arrow-back.svg"
              className="cursor-pointer"
              width={36}
              height={36}
              onClick={() => router.back()}
              alt="back icon"
            />
            <h2 className="text-xl pt-5 font-semibold">
              Manage Virtual Accounts Transactions
            </h2>
            <p className="text-sm pt-3 pb-5">
              Manage virtual accounts transaction within your company
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

                <div className="flex gap-3">
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
                </div>
              </div>
            </Card>
            <Table columns={columns} className="mt-7">
              {state.transactions.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-b last:border-none border-grey-200"
                >
                  <td className="text-sm px-5 py-6">{index + 1}</td>
                  <td className="text-sm px-5 py-6">{item.amount}</td>
                  <td className="text-sm px-5 py-6">{item.net_amount}</td>
                  <td className="text-sm px-5 py-6">{item.charge}</td>
                  <td className="text-sm px-5 py-6">
                    {item.sender.sender_name}
                  </td>
                </tr>
              ))}
            </Table>
          </>
        ) : (
          <>
            <Image
              src="/images/arrow-back.svg"
              className="cursor-pointer"
              width={36}
              height={36}
              onClick={() => router.back()}
              alt="back icon"
            />
            <EmptyState
              title="No Virtual Account Transactions"
              subTitle="We couldn't find any transactions to this virtual account"
              image="/images/history.svg"
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default VirtualAccountTransaction;
