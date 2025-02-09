import React, { useState, useEffect, Fragment, useCallback } from "react";
import Layout from "@/components/layout";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import { getPaymentLinks } from "@/services/collections";
import EmptyState from "@/components/EmptyState";
import TableRow from "@/components/TableRow";
import Link from "next/link";
import { useRouter } from "next/router";
import useClickEvent from "@/stores/useClickEvent";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";

interface AccountProps {
  transactions: any[];
  isLoading: boolean;
}

const PaymentLinkTransactions = () => {
  const { selectedItem } = useClickEvent();
  const router = useRouter();

  const [state, setState] = useState<AccountProps>({
    transactions: [],
    isLoading: true,
  });

  const fetchPaymentLinkTransactions = async () => {
    if (selectedItem?.id) {
      const transactions = await getPaymentLinks(true, selectedItem?.id);
      setState({ ...state, transactions, isLoading: false });
    }
  };

  useEffect(() => {
    fetchPaymentLinkTransactions();
  }, [selectedItem?.id]);

  const formattedData = state.transactions.map((item: any) => ({
    reference: item.reference,
    sender: item.sender_name,
    sender_email: item.sender_email,
    amount: item.amount,
    charges: item.charges,
    date: item.created_at,
    status: item.status,
  }));

  const columns = [
    "s/n",
    "reference",
    "sender name",
    "sender email",
    "amount",
    "charges",
    "created at",
    "status",
  ];

  return (
    <Layout pageTitle="Payment Link Transactions" icon="link">
      <WebPageTitle title="Payment Link Transactions | Ramp Merchant Portal" />
      <div className="mt-5">
        <Image
          src="/images/arrow-back.svg"
          className="cursor-pointer"
          width={36}
          height={36}
          onClick={() => router.back()}
          alt="back icon"
        />
        <div className="mt-5">
          <h2 className="text-xl font-semibold">
            Manage Payment Link Transactions
          </h2>
          <p className="text-sm pt-3 pb-5">
            Manage payment link transactions within your company
          </p>
        </div>
        {state.isLoading ? (
          <TableSkeleton />
        ) : formattedData.length === 0 ? (
          <Fragment>
            <EmptyState
              title="No Transactions found"
              subTitle="We couldn't find any transactions for this payment link"
              image="/images/dashboard/collections/payment-links-empty.svg"
            >
              <Link href="/collections/payment-links/create">
                <Button
                  ariaLabel="Create Link"
                  text="Create Payment Link"
                  primary
                  medium
                />
              </Link>
            </EmptyState>
          </Fragment>
        ) : (
          <Fragment>
            <Card>
              <div className="flex flex-col md:flex-row justify-between pb-5">
                <div className="relative mb-5 md:mb-0">
                  <input
                    type="text"
                    id="searchInput"
                    name="searchInput"
                    placeholder="Search users by name, email or date"
                    className="border-0 h-[40px] w-full md:w-[392px] outline-none bg-[#F5F8FA] text-sm px-12 rounded-md"
                  />

                  <Image
                    src="/images/search.svg"
                    width={20}
                    height={20}
                    alt="Search Icon"
                    className="absolute top-[10px] left-3"
                  />
                </div>

                <Link href="/collections/payment-links/create">
                  <Button
                    ariaLabel="Create Link"
                    text="Create Payment Link"
                    primary
                    medium
                  />
                </Link>
              </div>
              <Table columns={columns} className="mt-7">
                {formattedData.map((item: any, index: number) => (
                  <TableRow key={index} item={item} numbering={index} />
                ))}
              </Table>
            </Card>
          </Fragment>
        )}
      </div>
    </Layout>
  );
};

export default PaymentLinkTransactions;
