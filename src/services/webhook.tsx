import api from "../util/api";
import { apiEndpoints } from "../util/endpoints";

interface UpdateWebhook {
    webhook_url: string;
    enable_webhook: boolean;
}

export async function generateWebhookCredentials() {
    try {
        const response = await api.get(
            apiEndpoints.webhooks.GET_WEBHOOK
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateWebhookCredentials(payload:UpdateWebhook) {
    try {
        const response = await api.post(apiEndpoints.webhooks.UPDATE_WEBHOOK, payload);
        return response;
    } catch (error) {
        throw error;
    }
}
