import api from "../util/api";
import { apiEndpoints } from "../util/endpoints";

interface WEBHOOK_TYPE {
    webhook_url: string;
    enable_webhook: boolean;
    otp?: string;
}

/** API response: { status, message, data: { enable_webhook, webhook_url } } */
interface WebhookApiResponse {
    status: boolean;
    message: string;
    data: WEBHOOK_TYPE;
}

const defaultWebhook: WEBHOOK_TYPE = { webhook_url: "", enable_webhook: false };

export async function getWebhook(): Promise<WEBHOOK_TYPE> {
    try {
        const response = await api.get<WebhookApiResponse>(
            apiEndpoints.webhooks.GET_WEBHOOK
        ) as unknown as WebhookApiResponse;
        // API returns { status, message, data: { enable_webhook, webhook_url } }
        const payload = response?.data ?? defaultWebhook;
        return {
            enable_webhook: payload.enable_webhook ?? false,
            webhook_url: payload.webhook_url ?? "",
        };
    } catch (error) {
        throw error;
    }
}

/** @deprecated Use getWebhook. Kept for backward compatibility. */
export async function generateWebhookCredentials(): Promise<WEBHOOK_TYPE> {
    return getWebhook();
}

export async function updateWebhookCredentials(payload: WEBHOOK_TYPE): Promise<WEBHOOK_TYPE> {
    try {
        const response = await api.post<WebhookApiResponse>(apiEndpoints.webhooks.UPDATE_WEBHOOK, payload) as unknown as WebhookApiResponse;
        const data = response?.data ?? payload;
        return {
            enable_webhook: data.enable_webhook ?? false,
            webhook_url: data.webhook_url ?? "",
        };
    } catch (error) {
        throw error;
    }
}
