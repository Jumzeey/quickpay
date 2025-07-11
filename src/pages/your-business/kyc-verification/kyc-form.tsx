import BusinessHeader from "@/components/BusinessHeader";
import Button from "@/components/button";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import FormTextArea from "@/components/FormTextArea";
import Loader from "@/components/loader";
import UploadComponent from "@/components/upload-component";
import { useFormValidation } from "@/hooks/useFormValidation";
import useKyc from "@/stores/useKyc";
import { documentTypes } from "@/util/constants";
import { notifyError, notifySuccess } from "@/util/utils";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller } from "react-hook-form";
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

const starterSchema = Yup.object().shape({
  business_type: Yup.string().required("Business Type is required!"),
  id_number: Yup.string().required("Identification Number is required!"),
  id_type: Yup.string().required("ID Type is required!"),
  dob: Yup.string().required("Date Of Birth is required!"),
  id_file: Yup.string().required("ID File is required!"),
  proof_of_address: Yup.string().required("Proof Of Address is required!"),
  nin: Yup.string().required("NIN is required!")
});

const registeredSchema = Yup.object().shape({
  business_type: Yup.string().required("Business Type is required!"),
  proof_of_address: Yup.string().required("Proof Of Address is required!"),
  business_description: Yup.string().required("Business Description is required!"),
  company_business_status: Yup.string().required("Company Business Status is required!"),
  document_beneficiary_type: Yup.string().required("Document Beneficiary Type is required!"),
  director_tin: Yup.string().required("Director TIN is required!"),
  document_type: Yup.string().required("Document Type is required!"),
  cac_documents: Yup.string().required("Company Registration Certificate are required!"),
  document_beneficiary_file: Yup.string().required("Document Beneficiary File is required!"),
  document_file: Yup.string().required("Document File is required!")
});

const KYCForm = () => {
  const router = useRouter();
  const { createKyc } = useKyc();
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.lazy(values => {
    return values.business_type === "starter"
      ? starterSchema
      : registeredSchema;
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useFormValidation<FormValues>(
    validationSchema as unknown as Yup.ObjectSchema<any>,
    {
      defaultValues: {
        business_type: "registered",
        id_number: "",
        id_type: "",
        dob: "",
        id_file: "",
        proof_of_address: "",
        note: "",
        bvn: "",
        nin: "",
        business_description: "",
        director_nin: "12345678901",
        company_business_status: "",
        director_bvn: "12345678901",
        document_beneficiary_type: "",
        director_tin: "",
        document_type: "",
        cac_documents: "",
        document_beneficiary_file: "",
        document_file: ""
      },
      mode: "onChange"
    }
  );

  const businessType = watch("business_type");

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const payload = businessType === "starter"
        ? {
          business_type: values.business_type,
          id_number: values.id_number,
          id_type: values.id_type,
          dob: values.dob,
          id_file: values.id_file,
          proof_of_address: values.proof_of_address,
          note: values.note,
          bvn: values.bvn,
          nin: values.nin,
        }
        : {
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

      const response = await createKyc(payload);
      notifySuccess(response.message);
      // router.push("/your-business");
      router.reload();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onFileUpload = (file: string, name: string) => {
    setValue(name as keyof FormValues, file, {
      shouldValidate: true
    });
  };

  return (
    <div className="w-full">
      <div>
        <BusinessHeader />

        <p className="my-5 text-[13px] text-[#7F7F7F] font-medium">
          Please provide the following details and submit your account for review
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-6 justify-start mt-10 w-full">
        {businessType === "starter" ? (
          <>
            <div className="row-span-2 space-y-6">
              <Controller
                name="id_type"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="ID Type"
                    id="id_type"
                    htmlFor="id_type"
                    options={documentTypes}
                    error={errors.id_type?.message}
                    touched={!!errors.id_type}
                    {...field}
                  />
                )}
              />

              <Controller
                name="id_number"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Identification Number"
                    id="id_number"
                    type="text"
                    htmlFor="id_number"
                    error={errors.id_number?.message}
                    touched={!!errors.id_number}
                    numberOnly
                    {...field}
                  />
                )}
              />

            </div>

            <div className="row-span-2 space-y-6">
              <Controller
                name="nin"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="National ID Number"
                    id="nin"
                    type="text"
                    htmlFor="nin"
                    error={errors.nin?.message}
                    touched={!!errors.nin}
                    numberOnly
                    {...field}
                  />
                )}
              />

              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Date of birth"
                    id="dob"
                    type="date"
                    htmlFor="dob"
                    error={errors.dob?.message}
                    touched={!!errors.dob}
                    max={new Date().toISOString().split("T")[0]}
                    {...field}
                  />
                )}
              />


            </div>

            <div className="row-span-3 space-y-6">
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Note"
                    id="note"
                    type="text"
                    htmlFor="note"
                    error={errors.note?.message}
                    touched={!!errors.note}
                    {...field}
                  />
                )}
              />

              <UploadComponent
                className="h-[380px]"
                onFileUpload={onFileUpload}
                buttonText="Select File"
                name="proof_of_address"
                text="Proof of Address (e.g Utility Bill)"
                folderName="kyc"
              />
            </div>

            <div className="col-span-2">
              <UploadComponent
                className="h-[230px] col-span-"
                onFileUpload={onFileUpload}
                buttonText="Select File"
                name="id_file"
                text="Upload ID FILE"
                folderName="kyc"
              />

            </div>

          </>
        ) : (
          <>
            <div className="row-span-2 space-y-6">
              <Controller
                name="document_type"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Document Type"
                    id="document_type"
                    htmlFor="document_type"
                    options={documentTypes}
                    error={errors.document_type?.message}
                    touched={!!errors.document_type}
                    {...field}
                  />
                )}
              />

              <UploadComponent
                onFileUpload={onFileUpload}
                buttonText="Select File"
                name="document_file"
                text="Document Upload"
                folderName="kyc"
                className="h-[230px]"
              />
            </div>

            <div className="row-span-2 space-y-6">
              <Controller
                name="document_beneficiary_type"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Document Type (Ultimate Beneficial Owner)"
                    id="document_beneficiary_type"
                    htmlFor="document_beneficiary_type"
                    options={documentTypes}
                    error={errors.document_beneficiary_type?.message}
                    touched={!!errors.document_beneficiary_type}
                    {...field}
                  />
                )}
              />

              <UploadComponent
                onFileUpload={onFileUpload}
                buttonText="Select File"
                name="document_beneficiary_file"
                text="Document Upload (Ultimate Beneficial Owner)"
                folderName="kyc"
                className="h-[230px]"
              />
            </div>

            <Controller
              name="director_tin"
              control={control}
              render={({ field }) => (
                <FormSelect
                  label="Tax Identification Number"
                  id="director_tin"
                  htmlFor="director_tin"
                  options={documentTypes}
                  error={errors.director_tin?.message}
                  touched={!!errors.director_tin}
                  {...field}
                />
              )}
            />
            <UploadComponent
              className="h-[230px]"
              onFileUpload={onFileUpload}
              buttonText="Select File"
              name="proof_of_address"
              text="Proof Of Business Address (e.g Utility Bill)"
              folderName="kyc"
            />


            <UploadComponent
              className="h-[260px]"
              onFileUpload={onFileUpload}
              buttonText="Select File"
              name="cac_documents"
              text="Company Registration Certificate"
              folderName="kyc"
            />
            <UploadComponent
              className="h-[260px]"
              onFileUpload={onFileUpload}
              buttonText="Select File"
              name="company_business_status"
              text="MEMART or its equivalent"
              folderName="kyc"
            />

            <div className="space-y-6">
              <Controller
                name="business_description"
                control={control}
                render={({ field }) => (
                  <FormTextArea
                    label="Business Description"
                    id="business_description"
                    htmlFor="business_description"
                    error={errors.business_description?.message}
                    touched={!!errors.business_description}
                    {...field}
                  />
                )}
              />

              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Note"
                    id="note"
                    type="text"
                    htmlFor="note"
                    error={errors.note?.message}
                    touched={!!errors.note}
                    {...field}
                  />
                )}
              />
            </div>
          </>
        )}

        <div className="flex justify-center mt-4 w-[28%] border-danger">
          <Button
            text={isLoading ? <Loader /> : "Submit"}
            ariaLabel="Submit Button"
            disabled={isLoading}
            primary
            type="submit"
          />
        </div>
      </form>
    </div>
  );
};

export default KYCForm;
