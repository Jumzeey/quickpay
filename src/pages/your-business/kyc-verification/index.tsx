// import Button from "@/components/button";
// import Card from "@/components/Card";
import CardSkeleton from "@/components/card-skeleton";
import env from "@/config/env";
import { useAsyncFetch } from "@/hooks/useAsyncFetch";
import { getKyc } from "@/services/kyc";
import useAuthentication from "@/stores/useAuthentication";
// import { capitalizeFirstLetter, formatDate } from "@/util/utils";
// import Image from "next/image";
import BusinessHeader from "@/components/BusinessHeader";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import KYCForm from "./kyc-form";

interface Field {
  key: string;
  value: string;
}

interface UserKyc {
  created_at: string;
  status: string;
  comment?: string;
  fields: Field[];
}

interface DocumentLinkProps {
  document: string;
  imageUrl: string;
}

const DocumentLink = ({ document, imageUrl }: DocumentLinkProps) => {
  if (document === 'N/A') return <span>N/A</span>;

  return (
    <Link
      href={`${imageUrl}/${document}`}
      target="_blank"
      rel="noopener noreferrer"
      className="sarepayPrimary underline font-bold text-sm"
    >
      View Document
    </Link>
  );
};

const KYCField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col space-y-1 sm:space-y-0">
    <h3 className="text-[#6E6893] font-semibold text-sm">{label}</h3>
    <p>{value}</p>
  </div>
);

const BusinessKYC = () => {
  useAuthentication();
  const router = useRouter();
  // const { getKyc, userKyc, getKycLoading } = useKyc();
  const [isExpanded, setIsExpanded] = useState(false);
  const { imageUrl } = env;

  const { data: userKyc, loading: getKycLoading } = useAsyncFetch({
    key: 'kyc-details',
    fn: async () => {
      const response = await getKyc();
      return response.data?.[0][0];
    }
  });

  const getField = (key: string): string => {
    return userKyc?.fields?.find((field: Field) => field.key.trim() === key)?.value || "N/A";
  };

  const isStarterBusiness = (): boolean => {
    return getField("Business Type").toLowerCase() === "starter business";
  };

  const canSubmitNewDocument = (): boolean => {
    return (userKyc.status === 'Approved' && isStarterBusiness()) ||
      userKyc.status === 'Rejected';
  };

  if (getKycLoading) return <CardSkeleton />;

  if (!userKyc || userKyc.fields.length === 0) {
    return <KYCForm />
  }

  console.log({ userKyc })

  return (
    <div className="mt-10">
      <BusinessHeader />

      <div className="grid grid-cols-2 w-1/2 mt-6 gap-6">
        <div className="space-y-2">
          <p className="text-[13px] text-[#7F7F7F] font-medium">
            Verification status:
            <span className="ml-1 text-[#090727]">{userKyc?.status}</span>
          </p>
          <h2 className="text-lg text-[#7F7F7F] font-bold">
            KYC Documents submitted
          </h2>
        </div>
        <div className="space-y-2">
          <p className="text-[13px] text-[#7F7F7F] font-medium">
            Date submitted:
          </p>

          {/* "26 Jun, 2025 07:04:16" */}
          <h2 className="text-lg text-[#090727] font-bold">
            {format(new Date(userKyc.created_at), "LLL do, yyyy")}
          </h2>
        </div>
      </div>


      {/* <Card>
        <div className="flex flex-col sm:flex-row justify-center items-center sm:justify-between p-5">
          <h6 className={`text-center font-bold py-3 px-3 ${userKyc.status === 'Approved' ? 'sarepayPrimary' : 'text-danger'
            }`}>
            KYC Status: {userKyc.status}
          </h6>

          <Link href="/your-business/kyc-verification/kyc-form">
            <Button
              text="Submit New Document"
              ariaLabel="Submit New Document"
              disabled={!canSubmitNewDocument()}
              primary
              medium
            />
          </Link>
        </div>

        <div className="p-4 bg-[#F5F8FA]">
          <div className="flex flex-col sm:grid sm:grid-cols-5 gap-4">
            <div className="flex flex-col space-y-1 sm:space-y-0">
              <Image
                src="/images/dashboard/your-business/kyc-dropdown.svg"
                onClick={() => setIsExpanded(!isExpanded)}
                width={20}
                height={20}
                alt="Toggle KYC Details"
                className="cursor-pointer"
              />
            </div>

            <KYCField
              label="BUSINESS TYPE"
              value={capitalizeFirstLetter(userKyc.fields[0].value)}
            />
            <KYCField
              label="STATUS"
              value={
                <span className={userKyc.status === 'Approved' ? 'sarepayPrimary' : 'text-danger'}>
                  {userKyc.status}
                </span>
              }
            />
            <KYCField
              label="COMPLIANCE COMMENT"
              value={userKyc.comment || 'N/A'}
            />
            <KYCField
              label="SUBMITTED DATE"
              value={formatDate(userKyc.created_at)}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="p-4">
            {isStarterBusiness() ? (
              <StarterBusinessDetails
                getField={getField}
                imageUrl={imageUrl || ""}
              />
            ) : (
              <RegisteredBusinessDetails
                getField={getField}
                imageUrl={imageUrl || ""}
              />
            )}
          </div>
        )}
      </Card> */}
    </div >
  );
};

export default BusinessKYC;


interface StarterBusinessDetailsProps {
  getField: (key: string) => string;
  imageUrl: string;
}

export const StarterBusinessDetails = ({ getField, imageUrl }: StarterBusinessDetailsProps) => (
  <>
    <div className="p-4 bg-[#D9D5EC]">
      <div className="flex flex-col sm:grid sm:grid-cols-5 gap-4">
        <KYCField label="ID Number" value={getField('ID Number')} />
        <KYCField label="Document Type" value={getField('ID Type')} />
        <KYCField
          label="Document"
          value={<DocumentLink document={getField('ID File')} imageUrl={imageUrl} />}
        />
      </div>
    </div>

    <div className="flex flex-col sm:grid sm:grid-cols-5 gap-4 mt-4">
      <KYCField label="Date Of Birth" value={getField('Date Of Birth')} />
      <KYCField
        label="Proof of Address"
        value={<DocumentLink document={getField('Proof of Address')} imageUrl={imageUrl} />}
      />
      <KYCField label="Note" value={getField('Note')} />
    </div>
  </>
);


interface RegisteredBusinessDetailsProps {
  getField: (key: string) => string;
  imageUrl: string;
}

export const RegisteredBusinessDetails = ({ getField, imageUrl }: RegisteredBusinessDetailsProps) => (
  <>
    <div className="p-4 bg-[#D9D5EC]">
      <div className="flex flex-col sm:grid sm:grid-cols-5 gap-4">
        <KYCField label="Directors ID" value={getField('Directors ID')} />
        <KYCField
          label="Directors Document"
          value={<DocumentLink document={getField('Directors Document')} imageUrl={imageUrl} />}
        />
        <KYCField
          label="Beneficiary ID"
          value={<DocumentLink document={getField('Beneficiary ID')} imageUrl={imageUrl} />}
        />
      </div>
    </div>

    {/* Additional sections for registered business */}
    <div className="p-4 bg-[#D9D5EC] mt-4">
      <div className="flex flex-col sm:grid sm:grid-cols-5 gap-4">
        <KYCField
          label="Business Description"
          value={getField('Business Description')}
        />
        <KYCField
          label="Note"
          value={getField('Note')}
        />
      </div>
    </div>
  </>
);