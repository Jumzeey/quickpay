import React, { useState } from "react";
import Layout from "@/components/layout";
import { useRouter } from "next/router";
import Image from "next/image";
import FloatingLabelInput from "@/components/floating-input";
import useDisbursement from "@/stores/useDisbursement";
import { notifyError, notifySuccess } from "@/util/utils";
import Button from "@/components/button";
import Loader from "@/components/loader";
import Card from "@/components/Card";
import { useFormik } from "formik";
import * as Yup from "yup";

const InterBankOtp = () => {
  const router = useRouter();
  const { verifyDisbursementOtp, disburse, disburse_payload } = useDisbursement();
  const [isLoading, setIsLoading] = useState(false);
  const userBank = typeof window !== "undefined" ? localStorage?.getItem("user-bank") : "";

  const formik = useFormik({
    initialValues: {
      otp: "",
    },
    validationSchema: Yup.object().shape({
      otp: Yup.string().required("OTP is required!"),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    const payload = {
      otp: values.otp,
    };
    try {
      const response = await verifyDisbursementOtp(payload);
      notifySuccess(response.message);
      router.push({
        pathname: "/disbursements",
      });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Layout pageTitle="Disbursement Details" icon="/images/dashboard/logout.svg">
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
        <Card>
          <div className="flex items-center gap-10 py-5">
            <div>
              <h6 className="text-2xl font-semibold">Confirm Interbank Details</h6>
              <p className="my-5">An OTP has been sent to your mail. Please check and confirm</p>
              <form onSubmit={formik.handleSubmit} className="mt-10">
                <FloatingLabelInput
                  label="OTP"
                  id="otp"
                  type="text"
                  htmlFor="otp"
                  formik={formik}
                  {...formik.getFieldProps("otp")}
                  numberOnly
                />
                <div className="flex justify-center mt-12">
                  <Button
                    text={isLoading ? <Loader /> : "Continue"}
                    ariaLabel="Continue Button"
                    disabled={isLoading}
                    primary
                  />
                </div>
              </form>
            </div>
            <div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4">
                <div className="p-4">
                  <p className="text-[#8C8C8C] text-sm">Beneficiary Bank</p>
                  <h6 className="">{userBank}</h6>
                </div>
                <div className="p-4">
                  <p className="text-[#8C8C8C] text-sm">Account Number</p>
                  <h6 className="">{disburse_payload?.account_number}</h6>
                </div>
                <div className="p-4">
                  <p className="text-[#8C8C8C] text-sm">Beneficiary Name</p>
                  <h6 className="">{disburse_payload?.account_name}</h6>
                </div>
                <div className="p-4">
                  <p className="text-[#8C8C8C] text-sm">Amount to be sent </p>
                  <h6 className="">{disburse_payload?.amount}</h6>
                </div>
                <div className="p-4">
                  <p className="text-[#8C8C8C] text-sm">Fee</p>
                  <h6 className="">{disburse?.total_charge}</h6>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default InterBankOtp;
