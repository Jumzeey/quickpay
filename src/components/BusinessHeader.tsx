import ActionButton from '@/components/action-button';
import { useAsyncFetch } from '@/hooks/useAsyncFetch';
import { getKyc } from '@/services/kyc';
import useAuthentication from '@/stores/useAuthentication';
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
            return response.data?.[0][0] || {};
        }
    });

    const kycStatus = kycData?.status || "Unverified";
    const statusColor = kycStatus === 'Approved' ? 'text-primary' : 'text-danger';

    const handleUpgradeAccount = () => {
        router.push('/your-business?tab=upgrade-account');
    };

    console.log({ kycData });

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