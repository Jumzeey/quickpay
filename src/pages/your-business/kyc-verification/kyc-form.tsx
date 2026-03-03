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
import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import * as Yup from "yup";

const FormSection = ({
  title,
  description,
  children,
  className = ""
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-xl border border-[#E5E7EB] bg-white p-5 md:p-6 shadow-sm ${className}`}
  >
    <div className="mb-4">
      <h3 className="text-base font-semibold text-[#090727]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[#7F7F7F]">{description}</p>
      )}
    </div>
    <div className="space-y-4 md:space-y-5">{children}</div>
  </section>
);

interface FormValues {
  business_type: string;
  is_licensed: boolean;
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

const starterSchema = (isLicensed: boolean) =>
  Yup.object().shape({
    business_type: Yup.string().required("Business Type is required!"),
    id_number: Yup.string().required("Identification Number is required!"),
    id_type: Yup.string().required("ID Type is required!"),
    dob: Yup.string().required("Date Of Birth is required!"),
    id_file: Yup.string().required("ID File is required!"),
    proof_of_address: Yup.string().required("Proof Of Address is required!"),
    nin: isLicensed
      ? Yup.string().required("NIN is required!").matches(/^\d{11}$/, "NIN must be exactly 11 digits")
      : Yup.string(),
    bvn: isLicensed
      ? Yup.string().required("BVN is required!").matches(/^\d{11}$/, "BVN must be exactly 11 digits")
      : Yup.string()
  });

const registeredSchema = (isLicensed: boolean) =>
  Yup.object().shape({
    business_type: Yup.string().required("Business Type is required!"),
    proof_of_address: Yup.string().required("Proof Of Address is required!"),
    business_description: Yup.string().required("Business Description is required!"),
    company_business_status: Yup.string().required("Company Business Status is required!"),
    document_beneficiary_type: Yup.string().required("Document Beneficiary Type is required!"),
    director_tin: Yup.string()
      .required("Director TIN is required!")
      .matches(
        /^[A-Z0-9\-]{3,25}$/i,
        "TIN must be 3–25 characters.\nOnly letters, numbers and hyphens allowed.\nNo spaces, @ or _."
      ),
    document_type: Yup.string().required("Document Type is required!"),
    cac_documents: Yup.string().required("Company Registration Certificate are required!"),
    document_beneficiary_file: Yup.string().required("Document Beneficiary File is required!"),
    document_file: Yup.string().required("Document File is required!"),
    director_nin: isLicensed
      ? Yup.string().required("Director NIN is required!").matches(/^\d{11}$/, "NIN must be exactly 11 digits")
      : Yup.string(),
    director_bvn: isLicensed
      ? Yup.string().required("Director BVN is required!").matches(/^\d{11}$/, "BVN must be exactly 11 digits")
      : Yup.string()
  });

const KYCForm = () => {
  const router = useRouter();
  const { createKyc, getKyc } = useKyc();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const result = await getKyc();
        console.log("get kyc", result);
      } catch (error) {
        console.error("Error fetching KYC:", error);
      }
    };
    fetchKyc();
  }, [getKyc]);

  const validationSchema = Yup.lazy((values: FormValues) => {
    const isLicensed = !!values?.is_licensed;
    return values.business_type === "starter"
      ? starterSchema(isLicensed)
      : registeredSchema(isLicensed);
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
        is_licensed: false,
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
        document_file: ""
      },
      mode: "onChange"
    }
  );

  const businessType = watch("business_type");
  const isStarterBusiness = businessType === "starter";
  const isLicensed = watch("is_licensed");

  // Watch file upload fields to pass to UploadComponent
  const idFile = watch("id_file");
  const proofOfAddress = watch("proof_of_address");
  const documentFile = watch("document_file");
  const documentBeneficiaryFile = watch("document_beneficiary_file");
  const cacDocuments = watch("cac_documents");
  const companyBusinessStatus = watch("company_business_status");

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const starterDocuments = [
        {
          url: values.id_file,
          type: values.id_type
        },
        {
          url: values.proof_of_address,
          type: "proof_of_address"
        }
      ].filter(doc => !!doc.url);

      const registeredDocuments = [
        {
          url: values.cac_documents,
          type: "cac_documents"
        },
        {
          url: values.company_business_status,
          type: "company_business_status"
        },
        {
          url: values.document_beneficiary_file,
          type: "document_beneficiary_file"
        },
        {
          url: values.document_file,
          type: values.document_type
        },
        {
          url: values.proof_of_address,
          type: "proof_of_address"
        }
      ].filter(doc => !!doc.url);

      const payload = isStarterBusiness
        ? {
          business_type: values.business_type,
          id_number: values.id_number,
          id_type: values.id_type,
          dob: values.dob,
          id_file: values.id_file,
          proof_of_address: values.proof_of_address,
          note: values.note,
          ...(values.is_licensed && {
            bvn: values.bvn,
            nin: values.nin
          }),
          documents: starterDocuments
        } : {
          business_type: values.business_type,
          business_description: values.business_description,
          company_business_status: values.company_business_status,
          document_beneficiary_type: values.document_beneficiary_type,
          director_tin: values.director_tin,
          document_type: values.document_type,
          cac_documents: values.cac_documents,
          document_beneficiary_file: values.document_beneficiary_file,
          document_file: values.document_file,
          proof_of_address: values.proof_of_address,
          note: values.note,
          ...(values.is_licensed && {
            director_bvn: values.director_bvn,
            director_nin: values.director_nin
          }),
          documents: registeredDocuments
        };

      const response = await createKyc(payload);
      // @ts-ignore
      notifySuccess(response?.message || "KYC submitted successfully");
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
    <div className="w-full px-4 md:px-0 max-w-4xl">
      <div className="mb-8">
        <BusinessHeader isStarterBusiness={isStarterBusiness} />
        <p className="mt-3 text-sm text-[#7F7F7F] leading-relaxed">
          Please complete the sections below. All documents should be clear, valid, and in JPG, PNG or PDF (max 10MB).
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection
          title="Business licensing"
          description="If your business holds a regulatory or trade licence, we’ll need additional verification."
        >
          <Controller
            name="is_licensed"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <input
                  type="checkbox"
                  id="is_licensed"
                  className="w-4 h-4 rounded border-[#7F7F7F] text-primary focus:ring-primary"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                <label htmlFor="is_licensed" className="text-sm font-medium text-[#090727] cursor-pointer">
                  Yes, my business / merchant is licensed
                </label>
              </div>
            )}
          />
        </FormSection>

        {businessType === "starter" ? (
          <>
            <FormSection
              title="Identity details"
              description="Provide a valid ID and your date of birth."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                {isLicensed && (
                  <>
                    <Controller
                      name="nin"
                      control={control}
                      render={({ field }) => (
                        <FormInput
                          label="National ID Number (NIN)"
                          id="nin"
                          type="text"
                          htmlFor="nin"
                          error={errors.nin?.message}
                          touched={!!errors.nin}
                          numberOnly
                          maxLength={11}
                          {...field}
                        />
                      )}
                    />
                    <Controller
                      name="bvn"
                      control={control}
                      render={({ field }) => (
                        <FormInput
                          label="Bank Verification Number (BVN)"
                          id="bvn"
                          type="text"
                          htmlFor="bvn"
                          error={errors.bvn?.message}
                          touched={!!errors.bvn}
                          numberOnly
                          maxLength={11}
                          {...field}
                        />
                      )}
                    />
                  </>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Documents"
              description="Upload a clear copy of your ID and a recent proof of address (e.g. utility bill)."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <UploadComponent
                  className="min-h-[200px]"
                  onFileUpload={onFileUpload}
                  buttonText="Select File"
                  name="id_file"
                  text="ID document"
                  folderName="kyc"
                  value={idFile}
                />
                <UploadComponent
                  className="min-h-[200px]"
                  onFileUpload={onFileUpload}
                  buttonText="Select File"
                  name="proof_of_address"
                  text="Proof of address"
                  folderName="kyc"
                  value={proofOfAddress}
                />
              </div>
              <Controller
                name="note"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Note (optional)"
                    id="note"
                    type="text"
                    htmlFor="note"
                    error={errors.note?.message}
                    touched={!!errors.note}
                    {...field}
                  />
                )}
              />
            </FormSection>
          </>
        ) : (
          <>
            <FormSection
              title="Company documents"
              description="Upload your company registration and business address proof."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <Controller
                    name="document_type"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label="Document type"
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
                    text="Upload document"
                    folderName="kyc"
                    className="min-h-[180px]"
                    value={documentFile}
                  />
                </div>
                <div className="space-y-4">
                  <UploadComponent
                    className="min-h-[180px]"
                    onFileUpload={onFileUpload}
                    buttonText="Select File"
                    name="cac_documents"
                    text="Company Registration Certificate (CAC)"
                    folderName="kyc"
                    value={cacDocuments}
                  />
                  <UploadComponent
                    className="min-h-[180px]"
                    onFileUpload={onFileUpload}
                    buttonText="Select File"
                    name="company_business_status"
                    text="MEMART or equivalent"
                    folderName="kyc"
                    value={companyBusinessStatus}
                  />
                </div>
              </div>
              <UploadComponent
                className="min-h-[180px]"
                onFileUpload={onFileUpload}
                buttonText="Select File"
                name="proof_of_address"
                text="Proof of business address (e.g. utility bill)"
                folderName="kyc"
                value={proofOfAddress}
              />
            </FormSection>

            <FormSection
              title="Ultimate Beneficial Owner (UBO)"
              description="The person who ultimately owns or controls the business. Provide their ID type and upload a copy."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <Controller
                    name="document_beneficiary_type"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        label="UBO document type"
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
                    text="UBO document upload"
                    folderName="kyc"
                    className="min-h-[180px]"
                    value={documentBeneficiaryFile}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Director details"
              description="Tax and verification details for the director."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Controller
                  name="director_tin"
                  control={control}
                  render={({ field }) => (
                    <FormInput
                      label="Tax Identification Number (TIN)"
                      id="director_tin"
                      htmlFor="director_tin"
                      error={errors.director_tin?.message}
                      touched={!!errors.director_tin}
                      {...field}
                    />
                  )}
                />
                {isLicensed && (
                  <>
                    <Controller
                      name="director_nin"
                      control={control}
                      render={({ field }) => (
                        <FormInput
                          label="Director NIN"
                          id="director_nin"
                          type="text"
                          htmlFor="director_nin"
                          error={errors.director_nin?.message}
                          touched={!!errors.director_nin}
                          numberOnly
                          maxLength={11}
                          {...field}
                        />
                      )}
                    />
                    <Controller
                      name="director_bvn"
                      control={control}
                      render={({ field }) => (
                        <FormInput
                          label="Director BVN"
                          id="director_bvn"
                          type="text"
                          htmlFor="director_bvn"
                          error={errors.director_bvn?.message}
                          touched={!!errors.director_bvn}
                          numberOnly
                          maxLength={11}
                          {...field}
                        />
                      )}
                    />
                  </>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Additional information"
              description="Brief description of your business and any notes for the reviewer."
            >
              <Controller
                name="business_description"
                control={control}
                render={({ field }) => (
                  <FormTextArea
                    label="Business description"
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
                    label="Note (optional)"
                    id="note"
                    type="text"
                    htmlFor="note"
                    error={errors.note?.message}
                    touched={!!errors.note}
                    {...field}
                  />
                )}
              />
            </FormSection>
          </>
        )}

        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#7F7F7F] text-center sm:text-left">
            By submitting, you confirm that the information provided is accurate. We’ll review and get back to you.
          </p>
          <Button
            text={isLoading ? <Loader /> : "Submit for review"}
            ariaLabel="Submit Button"
            disabled={isLoading}
            primary
            type="submit"
            className="w-full sm:w-auto sm:min-w-[180px]"
          />
        </div>
      </form>
    </div>
  );
};

export default KYCForm;
