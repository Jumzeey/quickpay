"use client";

import React, { useEffect, Fragment, useState } from "react";
import Layout from "@/components/layout";
import PageGuard from "@/components/PageGuard";
import Table from "@/components/table";
import Image from "next/image";
import Button from "@/components/button";
import Card from "@/components/Card";
import { useRouter } from "next/router";
import EmptyState from "@/components/EmptyState";
import useClickEvent from "@/stores/useClickEvent";
import TableSkeleton from "@/components/TableSkeleton";
import WebPageTitle from "@/components/WebPageTitle";
import { getSettlementBreakdown } from "@/services/transaction";
import { notifyError } from "@/util/utils";
import { useModuleAccess } from "@/hooks/useModuleAccess";

const SettlementBreakdownContent = () => {
  const router = useRouter();

  const [state, setState] = useState({
    isLoading: true,
    settlementRefs: [],
  });

  const { id } = router.query;

  const { handleClick } = useClickEvent();

  const fetchSettlementBreakdown = async (
    id: string | string[] | undefined
  ) => {
    try {
      const settlementRefs = await getSettlementBreakdown(id);
      setState(prevState => ({
        ...prevState,
        settlementRefs,
      }));
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState(prevState => ({
        ...prevState,
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    if (id) {
      fetchSettlementBreakdown(id);
    }
  }, [id]);

  const columns = [
    "s/n",
    "total amount",
    "account number",
    "bank code",
    "settlement reference",
    "sub account",
    "status",
    "date created",
    "date updated",
    "action",
  ];

  return (
    <Layout pageTitle="Settlement Breakdown" icon="history">
      <WebPageTitle title="Settlement Breakdown | Cray Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer pb-5"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />
      {state.isLoading ? (
        <Fragment>
          <h2 className="text-xl pt-5 font-semibold">
            Manage Settlement Breakdown
          </h2>
          <p className="text-sm pt-3 pb-5">
            Manage settlement breakdown within your company
          </p>
          <TableSkeleton />
        </Fragment>
      ) : state.settlementRefs?.length !== 0 ? (
        <Fragment>
          <Card>
            <div className="flex justify-end pb-5">
              {/* <div className="relative">
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
              </div> */}

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
            <Table columns={columns} className="mt-7">
              {state.settlementRefs?.map((item: any, index: number) => (
                <tr
                  key={index}
                  className="border-b last:border-none border-grey-200"
                >
                  <td className="text-sm px-5 py-6">{index + 1}</td>
                  <td className="text-sm px-5 py-6">{item.amount}</td>
                  <td className="text-sm px-5 py-6">{item.account_number}</td>
                  <td className="text-sm px-5 py-6">{item.bank_name}</td>
                  <td className="text-sm px-5 py-6">
                    {item.settlement_reference}
                  </td>
                  <td className="text-sm px-5 py-6">{item.subaccount}</td>
                  <td className="text-sm px-5 py-6">{item.status}</td>
                  <td className="text-sm px-5 py-6">{item.created_at}</td>
                  <td className="text-sm px-5 py-6">{item.completed_at}</td>
                  <td
                    className="text-sm px-5 py-6"
                    onClick={() => {
                      router.push(
                        `/settlements/transaction/${item.id}`
                      );
                      handleClick(item);
                    }}
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
    </Layout>
  );
};

const SettlementBreakdown = () => {
  const hasAccess = useModuleAccess("settlements");
  if (!hasAccess) {
    return (
      <Layout pageTitle="Settlement Breakdown" icon="history">
        <WebPageTitle title="Settlement Breakdown | Cray Merchant Portal" />
        <h2 className="text-xl pt-5 font-semibold">Manage Settlement Breakdown</h2>
        <p className="text-sm pt-3 pb-5">Manage settlement breakdown within your company</p>
        <PageGuard moduleSlug="settlements">
          <div />
        </PageGuard>
      </Layout>
    );
  }
  return <SettlementBreakdownContent />;
};

export default SettlementBreakdown;
