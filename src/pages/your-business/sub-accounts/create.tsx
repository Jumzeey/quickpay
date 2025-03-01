import React, { useState, useEffect, ChangeEvent } from "react";
import Button from "@/components/button";
import Layout from "@/components/layout";
import FloatingLabelInput from "@/components/floating-input";
// import { getBanks, performNameCheck } from "@/services/bank";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/router";
import {
  notifyError,
  notifySuccess,
  // removeCommasFromValue,
} from "@/util/utils";
import useSubAccount from "@/stores/useSubAccount";
import Loader from "@/components/loader";
import Card from "@/components/Card";
import Image from "next/image";
// import { Spinner } from "@/components/Spinner";

// interface StateProps {
//   merchant_name: string;
//   mode: boolean | undefined;
//   contactEmail: string;
//   // amount: string;
//   //   banks: [];
//   // selectedOption: string;
//   // accountName: string;
//   percentage: string;
//   description: string;
//   // accountNumber: string;
//   isLoading: boolean;
//   siteName: string;
//   websiteUrl: string;
//   riskRating: string;
//   category: string;
//   supportingDocuments: [];
// }

export const API_URL =
  "https://api.sheety.co/3e4167ce45e60748b1aedfad4e047b74/mccListing2024October/cardAcceptorBusiness";

const SubAccountForm: React.FC = () => {
  const router = useRouter();
  const { postSubAccountAmount } = useSubAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [documents, setDocuments] = useState<
    { title: string; file: File | null }[]
  >([{ title: "", file: null }]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        const categorySet = new Set<string>();

        data.cardAcceptorBusiness.forEach((item: any) => {
          const name = item.tccName?.trim();
          if (
            name &&
            name.toLowerCase() !== "this cell is intentionally left blank." &&
            name.toLowerCase() !== "r, t" &&
            name.toLowerCase() !== "u"
          ) {
            categorySet.add(name);
          }
        });

        setCategories(Array.from(categorySet));
      } catch (error) {
        console.error("Error fetching categories:", error);
        notifyError("Failed to load categories.");
      }
    };

    fetchCategories();
  }, []);

  const formik = useFormik({
    initialValues: {
      // accountNumber: "",
      // accountName: "",
      // amount: "",
      merchant_name: "",
      mode: undefined,
      contactEmail: "",
      percentage: "",
      description: "",
      siteName: "",
      websiteUrl: "",
      riskRating: "",
      category: "",
      supportingDocuments: [],
    },
    validationSchema: Yup.object().shape({
      // accountNumber: Yup.string()
      //   .required("Account number is required!")
      //   .min(10, "Account number must be 10 digits"),
      // accountName: Yup.string().required("Account name is required!"),
      // amount: Yup.string().required("Amount is required!"),
      merchant_name: Yup.string().required("Merchant name is required!"),
      mode: Yup.boolean().required("Mode is required!"),
      contactEmail: Yup.string()
        .email("Invalid email format")
        .required("Contact email is required!"),
      percentage: Yup.string().required("Percentage is required!"),
      siteName: Yup.string().required("Site name is required!"),
      websiteUrl: Yup.string()
        .url("Invalid URL format")
        .required("Website URL is required!"),
      riskRating: Yup.string().required("Risk rating is required!"),
      category: Yup.string().required("Category is required!"),
      supportingDocuments: Yup.array().of(Yup.mixed()).notRequired(),
    }),
    validateOnMount: true,
    onSubmit: async () => {
      postDisbursement();
    },
  });

  // const [state, setState] = useState<StateProps>({
  //   //     banks: [],
  //   // selectedOption: "",
  //   // accountNumber: "",
  //   // accountName: "",
  //   // amount: "",
  //   merchant_name: "",
  //   mode: undefined,
  //   contactEmail: "",
  //   percentage: "",
  //   description: "",
  //   isLoading: false,
  //   siteName: "",
  //   websiteUrl: "",
  //   riskRating: "",
  //   category: "",
  //   supportingDocuments: [],
  // });

  // const accountNumber = formik.values.accountNumber;
  /*
  useEffect(() => {
    fetchBanks();
  }, []);*/

  // useEffect(() => {
  //   if (accountNumber.length === 10) {
  //     nameCheck();
  //   }
  // }, [accountNumber]);

  //   const fetchBanks = async () => {
  //     const banks = await getBanks();
  //     setState({ ...state, banks });
  //   };

  // const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
  //   const { value } = e.target;
  //   setState({ ...state, selectedOption: value });
  // };

  // Handle file uploads
  const handleFileChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    const updatedDocs = [...documents];
    updatedDocs[index].file = file;
    setDocuments(updatedDocs);
  };

  // Handle title change
  const handleTitleChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedDocs = [...documents];
    updatedDocs[index].title = event.target.value;
    setDocuments(updatedDocs);
  };

  // Add new file upload field
  const addNewFileUpload = () => {
    setDocuments([...documents, { title: "", file: null }]);
  };

  // Remove a file upload entry
  const removeFileUpload = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
  };

  const postDisbursement = async () => {
    setIsLoading(true);
    const payload = {
      // amount: removeCommasFromValue(formik.values.amount),
      // account_number: formik.values.accountNumber,
      // account_name: formik.values.accountName,
      merchant_name: formik.values.merchant_name,
      mode: formik.values.mode,
      email: formik.values.contactEmail,
      percentage: formik.values.percentage,
      website_url: formik.values.websiteUrl,
      risk_rating: formik.values.riskRating,
      site_name: formik.values.siteName,
      category: formik.values.category,
      description: formik.values.description,
      // supporting_documents: documents.map(doc => ({
      //   title: doc.title,
      //   file: doc.file,
      // })),
    };
    try {
      // console.log(payload)
      const response = await postSubAccountAmount(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      router.push({
        pathname: "/your-business/sub-accounts",
      });
    } catch (error: any) {
      notifyError(error.message);
      setIsLoading(false);
    }
  };

  // const nameCheck = async () => {
  //   const payload = {
  //     bank_code: state.selectedOption,
  //     account_number: accountNumber,
  //   };
  //   try {
  //     setState({ ...state, isLoading: true });
  //     const accountName = await performNameCheck(payload);
  //     formik.setFieldValue("accountName", accountName);
  //   } catch (error: any) {
  //     notifyError(error.message);
  //   } finally {
  //     setState({ ...state, isLoading: false });
  //   }
  // };

  return (
    <Layout pageTitle="Sub Account" icon="sub-accounts">
      <div className="flex justify-between items-center p-4 sm:p-6 lg:p-12">
        <Image
          src="/images/arrow-back.svg"
          className="cursor-pointer"
          width={36}
          height={36}
          onClick={() => router.back()}
          alt="back icon"
        />
      </div>
      <div className="flex justify-center mt-4 sm:mt-6 lg:mt-2">
        <Card extraPadding>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="font-semibold">
                Select Sub Account Mode Type
              </label>
              <select
                className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                onChange={e => {
                  formik.setFieldValue("mode", e.target.value === "true");
                }}
                name="mode"
                value={
                  formik.values.mode === undefined
                    ? ""
                    : formik.values.mode
                    ? "true"
                    : "false"
                }
              >
                {formik.values.mode === undefined && (
                  <option value="">--Select--</option>
                )}
                <option value="true">Live</option>
                <option value="false">Test</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <FloatingLabelInput
                label="Site Name"
                id="siteName"
                type="text"
                htmlFor="siteName"
                formik={formik}
                {...formik.getFieldProps("siteName")}
              />

              <FloatingLabelInput
                label="Website URL"
                id="websiteUrl"
                type="text"
                htmlFor="websiteUrl"
                formik={formik}
                {...formik.getFieldProps("websiteUrl")}
              />

              <FloatingLabelInput
                label="Merchant Name"
                id="merchant_name"
                type="text"
                htmlFor="merchant_name"
                formik={formik}
                {...formik.getFieldProps("merchant_name")}
              />
              <FloatingLabelInput
                label="Percentage"
                id="percentage"
                type="text"
                htmlFor="percentage"
                formik={formik}
                maxLength={10}
                {...formik.getFieldProps("percentage")}
              />
            </div>
            <FloatingLabelInput
              label="Contact Email"
              id="contactEmail"
              type="text"
              htmlFor="contactEmail"
              formik={formik}
              {...formik.getFieldProps("contactEmail")}
            />
            <div>
              <label className="font-semibold">Risk Rating</label>
              <select
                className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                {...formik.getFieldProps("riskRating")}
              >
                <option value="">--Select--</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            {/* <FloatingLabelInput
              label="Risk Rating"
              id="riskRating"
              type="text"
              htmlFor="riskRating"
              formik={formik}
              {...formik.getFieldProps("riskRating")}
            /> */}
            {/* <div>
              <label className="text-sm block mb-2">Select bank</label>
              <select
                className="h-[45px] sm:h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm sm:text-base"
                onChange={handleChange}
              >
                <option disabled defaultValue="Select bank">
                  Select bank
                </option>
                {state.banks.map((bank: any, index) => (
                  <option key={index} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div> */}
            <div>
              <label className="font-semibold">Category</label>
              <select
                className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5"
                {...formik.getFieldProps("category")}
              >
                <option value="">--Select Category--</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mt-4">
              <div>
                <FloatingLabelInput
                  label="Account number"
                  id="accountNumber"
                  type="text"
                  htmlFor="accountNumber"
                  formik={formik}
                  maxLength={10}
                  {...formik.getFieldProps("accountNumber")}
                />
              </div>
              <div>
                <FloatingLabelInput
                  label="Amount"
                  id="amount"
                  type="text"
                  htmlFor="amount"
                  formik={formik}
                  maxLength={10}
                  {...formik.getFieldProps("amount")}
                />
              </div>
            </div> */}
            {/* <div className="relative mt-4">
              <FloatingLabelInput
                label="Account name"
                id="accountName"
                type="text"
                htmlFor="accountName"
                formik={formik}
                {...formik.getFieldProps("accountName")}
                readOnly
              />
              {state.isLoading && (
                <div className="absolute right-2 top-5">
                  <span>
                    <Spinner />
                  </span>
                </div>
              )}
            </div> */}

            <div>
              <label className="font-semibold text-gray-700">
                Upload Supporting Documents
              </label>
              {documents.map((doc, index) => (
                <div key={index} className="flex items-end gap-4 p-3 pl-0">
                  <div className="flex flex-col w-2/4">
                    <label className="text-sm font-medium text-gray-600">
                      Title
                    </label>

                    <input
                      type="text"
                      placeholder="Enter document title"
                      value={doc.title}
                      onChange={e => handleTitleChange(index, e)}
                      className="p-2 border-b w-full bg-[#ececec]"
                    />
                  </div>

                  {/* Custom File Upload Button */}
                  <input
                    type="file"
                    onChange={e => handleFileChange(index, e)}
                    // className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />

                  {/* Remove Button */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeFileUpload(index)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}

              {/* Plus Button to Add New Upload Field */}
              <button
                type="button"
                onClick={addNewFileUpload}
                className="mt-4 flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full hover:bg-gray-400 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            <FloatingLabelInput
              label="Description"
              id="description"
              type="text"
              htmlFor="message"
              formik={formik}
              {...formik.getFieldProps("description")}
            />
            <Button
              className="text-white mt-4 text-xs sm:text-sm p-2 sm:p-3 rounded"
              text={isLoading ? <Loader /> : "Create Sub Account"}
              ariaLabel="Create Sub Account Button"
              disabled={!formik.isValid || isLoading}
              primary
            />
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default SubAccountForm;
