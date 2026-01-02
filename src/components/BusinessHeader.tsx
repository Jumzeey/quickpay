import ActionButton from '@/components/action-button';
import { useAsyncFetch } from '@/hooks/useAsyncFetch';
import { getKyc } from '@/services/kyc';
import useAuthentication from '@/stores/useAuthentication';
import { KycStatus } from '@/types/kyc';
import { notifyError } from '@/util/utils';
import { useRouter } from 'next/router';

type BusinessHeaderProps = {
    isStarterBusiness: boolean;
};

const BusinessHeader = ({ isStarterBusiness }: BusinessHeaderProps) => {
    const { user = {} } = useAuthentication();
    const router = useRouter();

    const { data: kycData } = useAsyncFetch({
        key: 'kyc-details',
        fn: async () => {
            const response = await getKyc();
            const data = response.data;

            // Handle new account structure: { data: { status: "Pending" } }
            if (data && typeof data === 'object' && !Array.isArray(data) && 'status' in data && !('fields' in data)) {
                return {
                    status: data.status,
                    fields: [],
                    created_at: null
                };
            }

            // Handle existing account structure: { data: [[{ fields: [...], status: ... }]] }
            return data?.[0]?.[0] || {};
        }
    });

    const kycStatus = kycData?.status || "Unverified";
    const statusColor = kycStatus === 'Approved' ? 'text-primary' : 'text-danger';

    const handleUpgradeAccount = () => {
        // Check KYC status before allowing upgrade
        const currentKycStatus = kycData?.status as KycStatus | string;

        if (currentKycStatus !== KycStatus.APPROVED) {
            notifyError(
                "Please have your account approved before you can upgrade to a business account.",
                "Account Approval Required"
            );
            return;
        }

        // Only navigate if KYC is approved
        router.push('/your-business?tab=upgrade-account');
    };

    return (
        <div className="flex justify-between items-center">
            <div>
                <h4 className="text-[13px] text-[#7F7F7F] font-medium">Business Name:</h4>
                <h2 className="text-lg text-[#090727] font-bold">
                    {user?.business_name ? user.business_name : "N/A"}
                    <span className={`text-[13px] font-medium ml-2 ${statusColor}`}>
                        ({kycStatus})
                    </span>
                </h2>
            </div>

            <div>
                {isStarterBusiness ?
                    <ActionButton
                        text="Upgrade Account"
                        ariaLabel="Upgrade Account"
                        onClick={handleUpgradeAccount}
                    /> : null}
            </div>
        </div>
    );
};

export default BusinessHeader;