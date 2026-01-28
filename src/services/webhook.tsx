import api from "../util/api";
import { apiEndpoints } from "../util/endpoints";

interface WEBHOOK_TYPE {
    webhook_url: string;
    enable_webhook: boolean;
}

interface WebhookApiResponse {
    status: boolean;
    message: string;
    data: WEBHOOK_TYPE;
}

export async function generateWebhookCredentials(): Promise<WEBHOOK_TYPE> {
    try {
        const response = await api.get<WebhookApiResponse>(
            apiEndpoints.webhooks.GET_WEBHOOK
        ) as unknown as WebhookApiResponse;
        // API returns { status, message, data: { enable_webhook, webhook_url } }
        // The interceptor returns response.data, so response is WebhookApiResponse
        return response.data || { webhook_url: "", enable_webhook: false };
    } catch (error) {
        throw error;
    }
}

export async function updateWebhookCredentials(payload: WEBHOOK_TYPE): Promise<WEBHOOK_TYPE> {
    try {
        const response = await api.post<WebhookApiResponse>(apiEndpoints.webhooks.UPDATE_WEBHOOK, payload) as unknown as WebhookApiResponse;
        // API returns { status, message, data: { enable_webhook, webhook_url } }
        // The interceptor returns response.data, so response is WebhookApiResponse
        const webhookData: WEBHOOK_TYPE = response.data || payload;
        return webhookData;
    } catch (error) {
        throw error;
    }
}
