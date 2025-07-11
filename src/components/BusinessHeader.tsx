import { useAsyncFetch } from '@/hooks/useAsyncFetch';
import { getKyc } from '@/services/kyc';
import useAuthentication from '@/stores/useAuthentication';


const BusinessHeader = () => {
    const { user = {}, } = useAuthentication();

    const { data: kycData } = useAsyncFetch({
        key: 'kyc-details',
        fn: async () => {
            const response = await getKyc();
            return response.data?.[0][0] || {};
        }
    });

    const kycStatus = kycData?.status || "Unverified";
    const statusColor = kycStatus === 'Approved' ? 'text-primary' : 'text-danger';

    return (
        <>
            <h4 className="text-[13px] text-[#7F7F7F] font-medium">Business Name:</h4>
            <h2 className="text-lg text-[#090727] font-bold">
                {user?.business_name ? user.business_name : "N/A"}
                <span className={`text-[13px] font-medium ml-2 ${statusColor}`}>
                    ({kycStatus})
                </span>
            </h2>
        </>
    );
};

export default BusinessHeader;