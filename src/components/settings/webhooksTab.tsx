import Webhook from "@/pages/your-business/webhook";

/**
 * Settings Webhooks tab. Uses the same GET /merchant/webhook API and Webhook component
 * as Your Business > Webhooks, so data is consistent in both places.
 */
const WebhooksTab = () => {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-[#C4C4C452] dark:border-gray-700 p-4">
                <div className="text-left">
                    <h3 className="text-lg font-semibold text-black dark:text-white">Webhooks</h3>
                </div>
            </div>

            <div className="pl-4 pb-8">
                <Webhook />
            </div>
        </div>
    );
};

export default WebhooksTab;