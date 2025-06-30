import { useState, useEffect, ChangeEvent } from "react";
import Layout from "@/components/layout";
import Image from "next/image";
import { useRouter } from "next/router";
import WebPageTitle from "@/components/WebPageTitle";
import Card from "@/components/Card";
import { useFormik } from "formik";
import * as Yup from "yup";
import { nigerianPhoneNumberSchema, removeCommasFromValue } from "@/util/utils";
import { notifyError } from "@/util/utils";
import FloatingLabelInput from "@/components/floating-input";
import Button from "@/components/button";
import TextArea from "@/components/text-area";
import Loader from "@/components/loader";
import UploadComponent from "@/components/upload-component";
import { getBanks } from "@/services/bank";
import { createPaymentMandate } from "@/services/collections";
import { performNameCheck } from "@/services/bank";
import { Spinner } from "@/components/Spinner";

interface StateProps {
  banks: any[];
  selectedBank: string;
  frequency: string;
  isLoading: boolean;
}

interface FrequencyTypeProp {
  [key: string]: string;
}

// interface PaymentMandatePayload {
//   title: string;
//   amount: string;
//   description: string;
//   redirect_url?: string;
//   account_type: string;
//   subaccount_id?: string;
// }
const CreatePaymentMandate = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mandateFile, setMandateFile] = useState<File | null>(null);

  const [state, setState] = useState<StateProps>({
    banks: [],
    selectedBank: "",
    frequency: "",
    isLoading: false,
  });

  const frequencyType: FrequencyTypeProp = {
    "1": "day",
    "7": "week",
    "30": "month",
  };

  const selectedFrequencyType = frequencyType[state.frequency];

  const formik = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      amount: "",
      accountName: "",
      accountNumber: "",
      payerName: "",
      email: "",
      phoneNumber: "",
      payerAddress: "",
      narration: "",
      mustSubmit: false,
    },
    validationSchema: Yup.object().shape({
      startDate: Yup.string().required("Start date is required!"),
      endDate: Yup.string().required("End date is required!"),
      amount: Yup.string().required("Amount is required!"),
      accountNumber: Yup.string().required("Account number is required!"),
      accountName: Yup.string().required("Account name is required!"),
      payerName: Yup.string().required("Payer name is required!"),
      email: Yup.string()
        .email("Enter a valid email")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Email must have a valid provider"
        )
        .required("Email address is required!"),
      phoneNumber: nigerianPhoneNumberSchema,
      payerAddress: Yup.string().required("Payer address is required!"),
      narration: Yup.string().required("Narration is required!"),
      mustSubmit: Yup.boolean().isFalse(),
    }),

    validateOnMount: true,

    onSubmit: async values => {
      setIsLoading(true);

      const {
        startDate,
        endDate,
        amount,
        accountName,
        accountNumber,
        payerName,
        email,
        phoneNumber,
        payerAddress,
        narration,
        mustSubmit,
      } = values;
      const payload = {
        start_date: startDate,
        end_date: endDate,
        account_number: accountNumber,
        payer_address: payerAddress,
        frequency: state.frequency,
        frequency_type: selectedFrequencyType,
        account_name: accountName,
        narration,
        amount: removeCommasFromValue(amount),
        email,
        bank_code: state.selectedBank,
        payer_name: payerName,
        phone_number: phoneNumber,
        type: "physical",
        mandate_file: mandateFile,
        must_submit: mustSubmit,
      };

      try {
        const response = await createPaymentMandate(payload);
        // @ts-ignore
        notifySuccess(response.message);
        //   closeModal && closeModal();

        //   setTimeout(() => {
        //     createLink ? router.back() : fetchPaymentLinks && fetchPaymentLinks();
        //   }, 900);
      } catch (error: any) {
        //   closeModal && closeModal();
        notifyError(error.message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const nameCheck = async () => {
    const payload = {
      bank_code: state.selectedBank,
      account_number: accountNumber,
    };
    try {
      setState({ ...state, isLoading: true });
      const response = await performNameCheck(payload);
      const accountName = response.account_name;
      formik.setFieldValue("accountName", accountName);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setState({ ...state, isLoading: false });
    }
  };

  const { accountNumber } = formik.values;

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (accountNumber.length === 10) {
      nameCheck();
    }
  }, [accountNumber]);

  const fetchBanks = async () => {
    const banks = await getBanks();
    setState({ ...state, banks });
  };

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setState({ ...state, [e.target.name]: value });
  };

  // const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
  //   const { value } = e.target;
  //   setState({ ...state, selectedOption: value });
  // };

  return (
    <Layout pageTitle="Create Payment Mandate" icon="payment-mandate">
      <WebPageTitle title="Create Payment Mandate | Ramp Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />

      <div className="flex justify-center">
        <Card className="mt-5 md:w-[648px] border-[#e2dfdf] py-20 px-10">
          <form onSubmit={formik.handleSubmit}>
            <div className="grid md:grid-cols-2 md:gap-5">
              <FloatingLabelInput
                label="Start Date"
                id="startDate"
                type="date"
                htmlFor="startDate"
                formik={formik}
                {...formik.getFieldProps("startDate")}
              />

              <FloatingLabelInput
                label="End Date"
                id="endDate"
                type="date"
                htmlFor="endDate"
                formik={formik}
                {...formik.getFieldProps("endDate")}
              />
            </div>

            <div className="grid md:grid-cols-2 md:gap-5">
              <FloatingLabelInput
                label="Amount"
                id="amount"
                type="text"
                htmlFor="amount"
                formik={formik}
                {...formik.getFieldProps("amount")}
              />

              <select
                className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                onChange={handleChange}
                name="frequency"
                value={state?.frequency}
              >
                <option value="">--Select frequency--</option>

                <option value="1">Daily</option>
                <option value="7">Weekly</option>
                <option value="30">Monthly</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 md:gap-5">
              <select
                className="h-[60px] px-2 w-full rounded-md border-[1px] border-[#dcdcdc] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                name="selectedBank"
                onChange={handleChange}
                value={state?.selectedBank}
              >
                <option value="Select Type">--Select bank--</option>
                {state.banks.map((bank: any, index) => (
                  <option key={index} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>

              <FloatingLabelInput
                label="Account Number"
                id="accountNumber"
                type="text"
                htmlFor="accountNumber"
                maxLength={10}
                formik={formik}
                {...formik.getFieldProps("accountNumber")}
              />
            </div>

            <div className="relative grid md:grid-cols-2 md:gap-5">
              <FloatingLabelInput
                label="Account Name"
                id="accountName"
                type="text"
                htmlFor="accountName"
                formik={formik}
                {...formik.getFieldProps("accountName")}
                readOnly
              />

              <FloatingLabelInput
                label="Payer Name"
                id="payerName"
                type="text"
                htmlFor="payerName"
                formik={formik}
                {...formik.getFieldProps("payerName")}
              />

              {state.isLoading && (
                <div className="absolute left-56 top-5">
                  <span>
                    <Spinner />
                  </span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 md:gap-5">
              <FloatingLabelInput
                label="Email"
                id="email"
                type="email"
                htmlFor="email"
                formik={formik}
                {...formik.getFieldProps("email")}
              />

              <FloatingLabelInput
                label="Phone Number"
                id="phoneNumber"
                type="text"
                htmlFor="phoneNumber"
                maxLength={11}
                formik={formik}
                {...formik.getFieldProps("phoneNumber")}
              />
            </div>

            <FloatingLabelInput
              label="Payer Address"
              id="payerAddress"
              type="text"
              htmlFor="payerAddress"
              formik={formik}
              {...formik.getFieldProps("payerAddress")}
            />

            <UploadComponent
              buttonText="Select File"
              name="mandateFile"
              text="Mandate document"
              setMandateFile={setMandateFile}
            />

            <TextArea
              label="Narration"
              rows={4}
              cols={50}
              id="narration"
              formik={formik}
              {...formik.getFieldProps("narration")}
            />

            <div className="flex items-center gap-2">
              <input type="checkbox" id="mustSubmit" />

              <label htmlFor="mustSubmit">Submit this form</label>
            </div>

            <div className="flex justify-center mt-7">
              <Button
                text={isLoading ? <Loader /> : "Submit"}
                className="w-[400px]"
                ariaLabel="Submit button"
                disabled={!formik.isValid || isLoading || !state?.selectedBank}
                primary
              />
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CreatePaymentMandate;
