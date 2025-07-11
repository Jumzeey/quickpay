import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export interface IPWhitelistEntry {
    id: number;
    ip_address: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateIPWhitelistPayload {
    ip_address: string;
    description: string;
}

export interface UpdateIPWhitelistPayload {
    description: string;
    is_active: boolean;
}

export interface IPWhitelistResponse {
    status: boolean;
    message: string;
    data: IPWhitelistEntry[];
}

export interface CreateIPWhitelistResponse {
    status: boolean;
    message: string;
    data: IPWhitelistEntry;
}

// Get all IP whitelist entries
export async function getIPWhitelist(searchParams?: {}): Promise<IPWhitelistResponse> {
    try {
        const response = await api.get<IPWhitelistResponse>(apiEndpoints.ipWhitelist.GET_IP_WHITELIST);
        // @ts-ignore
        return response;
    } catch (error) {
        throw error;
    }
}

// Create new IP whitelist entry
export async function createIPWhitelist(payload: CreateIPWhitelistPayload): Promise<CreateIPWhitelistResponse> {
    try {
        const response = await api.post(
            apiEndpoints.ipWhitelist.CREATE_IP_WHITELIST,
            payload
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Update IP whitelist entry
export async function updateIPWhitelist(
    id: number,
    payload: UpdateIPWhitelistPayload
): Promise<IPWhitelistResponse> {
    try {
        const response = await api.put(
            `${apiEndpoints.ipWhitelist.UPDATE_IP_WHITELIST}/${id}`,
            payload
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Delete IP whitelist entry
export async function deleteIPWhitelist(id: number): Promise<IPWhitelistResponse> {
    try {
        const response = await api.delete(
            `${apiEndpoints.ipWhitelist.DELETE_IP_WHITELIST}/${id}`
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}
