import api from "../util/api";
import { apiEndpoints } from "../util/endpoints";

interface WEBHOOK_TYPE {
    webhook_url: string;
    enable_webhook: boolean;
}

export async function generateWebhookCredentials(): Promise<WEBHOOK_TYPE> {
    try {
        const response = await api.get<WEBHOOK_TYPE>(
            apiEndpoints.webhooks.GET_WEBHOOK
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateWebhookCredentials(payload: WEBHOOK_TYPE): Promise<WEBHOOK_TYPE> {
    try {
        const response = await api.post<WEBHOOK_TYPE>(apiEndpoints.webhooks.UPDATE_WEBHOOK, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}
