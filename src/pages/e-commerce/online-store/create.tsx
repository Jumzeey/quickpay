import Button from "@/components/button";
import Card from "@/components/Card";
import FloatingLabelInput from "@/components/floating-input";
import Layout from "@/components/layout";
import Loader from "@/components/loader";
import UploadComponent from "@/components/upload-component";
import WebPageTitle from "@/components/WebPageTitle";
import useKyc from "@/stores/useKyc";
import { documentTypes } from "@/util/constants";
import { notifyError, notifySuccess } from "@/util/utils";
import { useFormik } from "formik";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import * as Yup from "yup";

interface FormValues {
  business_type: string;
  id_number: string;
  id_type: string;
  dob: string;
  id_file: string;
  proof_of_address: string;
  note: string;
  bvn: string;
  nin: string;
  business_description: string;
  director_nin: string;
  company_business_status: string;
  director_bvn: string;
  document_beneficiary_type: string;
  director_tin: string;
  document_type: string;
  cac_documents: string;
  document_beneficiary_file: string;
  document_file: string;
}

const KYCPage: React.FC = () => {
  const router = useRouter();
  const { createKyc } = useKyc();
  const [isLoading, setIsLoading] = useState(false);

  const starterSchema = Yup.object().shape({
    business_type: Yup.string().required("Business Type is required!"),
    id_number: Yup.string().required("Identification Number is required!"),
    id_type: Yup.string().required("ID Type is required!"),
    dob: Yup.string().required("Date Of Birth is required!"),
    id_file: Yup.string().required("ID File is required!"),
    proof_of_address: Yup.string().required("Proof Of Address is required!"),
    nin: Yup.string()
      .required("NIN is required!")
      // .matches(/^\d{11}$/, "NIN must be exactly 11 digits!"),
  });

  const registeredSchema = Yup.object().shape({
    business_type: Yup.string().required("Business Type is required!"),
    proof_of_address: Yup.string().required("Proof Of Address is required!"),
    business_description: Yup.string().required(
      "Business Description is required!"
    ),
    director_nin: Yup.string()
      .required("Director NIN is required!"),
      // .matches(/^\d{11}$/, "Director NIN must be exactly 11 digits!"),
    company_business_status: Yup.string().required(
      "Company Business Status is required!"
    ),
    director_bvn: Yup.string()
      .required("Director BVN is required!")
      .matches(/^\d{11}$/, "Director BVN must be exactly 11 digits!"),
    document_beneficiary_type: Yup.string().required(
      "Document Beneficiary Type is required!"
    ),
    director_tin: Yup.string()
      .required("Director TIN is required!"),
    document_type: Yup.string().required("Document Type is required!"),
    cac_documents: Yup.string().required(
      "Company Registration Certificate are required!"
    ),
    document_beneficiary_file: Yup.string().required(
      "Document Beneficiary File is required!"
    ),
    document_file: Yup.string().required("Document File is required!"),
  });

  const validationSchema = Yup.lazy(values => {
    return values.business_type === "starter"
      ? starterSchema
      : registeredSchema;
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      business_type: "",
      id_number: "",
      id_type: "",
      dob: "",
      id_file: "",
      proof_of_address: "",
      note: "",
      bvn: "",
      nin: "",
      business_description: "",
      director_nin: "",
      company_business_status: "",
      director_bvn: "",
      document_beneficiary_type: "",
      director_tin: "",
      document_type: "",
      cac_documents: "",
      document_beneficiary_file: "",
      document_file: "",
    },
    validationSchema,
    validateOnMount: true,
    onSubmit: async values => {
      handleSubmit(values);
    },
  });

  const onFileUpload = (file: string, name: string) => {
    formik.setFieldValue(name, file);
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    let payload;
    if (values.business_type === "starter") {
      payload = {
        business_type: values.business_type,
        id_number: values.id_number,
        id_type: values.id_type,
        dob: values.dob,
        id_file: values.id_file,
        proof_of_address: values.proof_of_address,
        note: values.note,
        bvn: values.bvn,
        nin: values.nin,
      };
    } else {
      payload = {
        business_type: values.business_type,
        business_description: values.business_description,
        director_nin: values.director_nin,
        company_business_status: values.company_business_status,
        director_bvn: values.director_bvn,
        document_beneficiary_type: values.document_beneficiary_type,
        director_tin: values.director_tin,
        document_type: values.document_type,
        cac_documents: values.cac_documents,
        document_beneficiary_file: values.document_beneficiary_file,
        document_file: values.document_file,
        proof_of_address: values.proof_of_address,
        note: values.note,
      };
    }
    try {
      const response = await createKyc(payload);
      notifySuccess(response.message);
      setIsLoading(false);
      router.push({
        pathname: "/your-business/kyc-verification",
      });
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout pageTitle="Create Online Store" icon="ecommerce">
      <WebPageTitle title="Create Online Store | Ramp Merchant Portal" />
      <div className="pt-5">
        <Image
          src="/images/arrow-back.svg"
          alt="Back Arrow"
          className="cursor-pointer"
          onClick={() => router.back()}
          width={36}
          height={36}
          priority
        />
        <div className="flex justify-center">
          <Card extraPadding>
            <form onSubmit={formik.handleSubmit} className="mt-10">
              <div>
                <div className="flex">
                  <FloatingLabelInput
                    label="Store Name"
                    id="id_number"
                    type="text"
                    htmlFor="id_number"
                    formik={formik}
                    {...formik.getFieldProps("id_number")}
                    numberOnly
                  />
                  <select
                    className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5 mr-2"
                    onChange={formik.handleChange}
                    name="id_type"
                    value={formik.values.id_type}
                  >
                    <option value="">Select Shipping Status</option>
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  className="h-[60px] px-2 w-full rounded-lg border-[1px] border-[#CAC4D0] focus:border-[#6750A4] focus:outline-none text-sm mb-5 mr-2"
                  onChange={formik.handleChange}
                  name="id_type"
                  value={formik.values.id_type}
                >
                  <option value="">Select Product Type</option>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <UploadComponent
                  onFileUpload={onFileUpload}
                  buttonText="Select File"
                  name="id_file"
                  text="Upload a company logo"
                  folderName="kyc"
                />

                <UploadComponent
                  onFileUpload={onFileUpload}
                  buttonText="Select File"
                  name="proof_of_address"
                  text="Upload Header Picture"
                  folderName="kyc"
                />
                <FloatingLabelInput
                  label="Delivery Note"
                  id="note"
                  type="text"
                  htmlFor="note"
                  formik={formik}
                  {...formik.getFieldProps("note")}
                />
              </div>
              <FloatingLabelInput
                label="Store Description"
                id="note"
                type="text"
                htmlFor="note"
                formik={formik}
                {...formik.getFieldProps("note")}
              />

              <div className="flex justify-center mt-12">
                <Button
                  text={isLoading ? <Loader /> : "Submit"}
                  ariaLabel="Submit Button"
                  disabled={!formik.isValid || isLoading}
                  primary
                />
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default KYCPage;
