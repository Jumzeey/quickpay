import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import useDisbursement from "@/stores/useDisbursement";
import { useRouter } from "next/router";
import Image from "next/image";
import { truncateText, notifyError, copyToClipboard } from "@/util/utils";
import WebPageTitle from "@/components/WebPageTitle";
import CardSkeleton from "@/components/card-skeleton";

const DisbursementDetails = () => {
  const { viewDisbursement, disbursements_details } = useDisbursement();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const getDisbursementDetails = async () => {
    setIsLoading(true);
    try {
      const response = await viewDisbursement(id);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      notifyError(error.message);
    }
  };

  useEffect(() => {
    getDisbursementDetails();
  }, []);

  return (
    <Layout pageTitle="Disbursement Details" icon="disbursement">
      <WebPageTitle title="Disbursement Breakdown | Ramp Merchant Portal" />
      <div>
        <div>
          <Image
            src="/images/arrow-back.svg"
            className="cursor-pointer pb-10"
            width={36}
            height={36}
            onClick={() => router.back()}
            alt="back icon"
          />
        </div>
        <div className="lg:mx-20 lg:my-10 bg-white rounded p-10">
          <h6 className="text-2xl font-bold mb-5">Transaction Information</h6>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="rounded-md border-[#8C8C8C1A] border-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4">
              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Transaction Date</p>
                <h6 className="font-bold">
                  {disbursements_details?.created_at || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Transaction Status</p>
                <h6 className="font-bold">
                  {disbursements_details?.status || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Amount Sent</p>
                <h6 className="font-bold">
                  {disbursements_details?.amount || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Fee Charged - Source</p>
                <h6 className="font-bold">
                  {disbursements_details?.processing_fee || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Customer reference</p>
                <h6 className="font-bold">
                  {disbursements_details?.customer_reference || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Beneficiary Bank</p>
                <h6 className="font-bold">
                  {disbursements_details?.recipient_bank || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">
                  Beneficiary Account Name
                </p>
                <h6 className="font-bold">
                  {disbursements_details?.recipient_account_name || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">
                  Beneficiary Account Number
                </p>
                <h6 className="font-bold">
                  {disbursements_details?.recipient_account_number || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Balance After</p>
                <h6 className="font-bold">
                  {disbursements_details?.current_balance || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Balance Before</p>
                <h6 className="font-bold">
                  {disbursements_details?.balance_before || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Value Date</p>
                <h6 className="font-bold">
                  {disbursements_details?.value_date || "N/A"}
                </h6>
              </div>

              <div className="p-4">
                <p className="text-[#8C8C8C] text-sm">Transaction Reference</p>
                <div className="flex">
                  <h6 className="flex font-bold truncate mr-2">
                    {truncateText(disbursements_details?.reference, 24) ||
                      "N/A"}
                  </h6>
                  <Image
                    src="/images/dashboard/copy.svg"
                    className="cursor-pointer"
                    onClick={() =>
                      copyToClipboard(disbursements_details?.reference)
                    }
                    alt="Copy Icon"
                    width={15}
                    height={15}
                  />
                </div>
              </div>

              <div className="p-4">
                {" "}
                <p className="text-[#8C8C8C] text-sm">Reason for failure</p>
                <h6 className="font-bold">
                  {disbursements_details?.failure_reason || "N/A"}
                </h6>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DisbursementDetails;
