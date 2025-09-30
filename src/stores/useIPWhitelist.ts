import {
    createIPWhitelist,
    deleteIPWhitelist,
    getIPWhitelist,
    updateIPWhitelist,
    type CreateIPWhitelistPayload,
    type IPWhitelistEntry,
    type UpdateIPWhitelistPayload,
} from '@/services/ip-whitelist';
import { create } from 'zustand';

type Pagination = {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type IPWhitelistStore = {
    entries: IPWhitelistEntry[];
    allFilteredEntries?: IPWhitelistEntry[];
    isLoading: boolean;
    error: any;
    pagination: Pagination;
    fetchIPWhitelist: (searchParams?: object) => Promise<{ entries: IPWhitelistEntry[] }>;
    addIPWhitelist: (payload: CreateIPWhitelistPayload) => Promise<{ success: boolean }>;
    updateIPWhitelist: (id: number, payload: UpdateIPWhitelistPayload) => Promise<{ success: boolean }>;
    removeIPWhitelist: (id: number) => Promise<{ success: boolean }>;
    setPagination: (page: number, allEntries?: IPWhitelistEntry[]) => void;
};

const initialState = {
    entries: [],
    allFilteredEntries: [],
    isLoading: false,
    error: null,
    pagination: {
        count: 0,
        total: 0,
        per_page: 5,
        current_page: 1,
        last_page: 1,
    },
};

const useIPWhitelist = create<IPWhitelistStore>((set, get) => ({
    ...initialState,

    // Fetch all IP whitelist entries (no server pagination)
    fetchIPWhitelist: async (searchParams = {}) => {
        set(state => ({
            ...state,
            isLoading: true,
            error: null,
        }));

        try {
            // Get all entries from API
            const response = await getIPWhitelist();
            const allEntries = response.data || [];

            // Calculate pagination based on all entries
            const { search } = searchParams as { search?: string };

            // Filter entries if search is provided
            const filteredEntries = search
                ? allEntries.filter(entry =>
                    entry.ip_address.includes(search) ||
                    entry.description.toLowerCase().includes(search.toLowerCase())
                )
                : allEntries;

            const perPage = 5;
            const total = filteredEntries.length;
            const lastPage = Math.max(1, Math.ceil(total / perPage));

            // Set initial pagination
            const currentPage = 1;

            // Calculate which entries to show on the current page
            const startIndex = (currentPage - 1) * perPage;
            const paginatedEntries = filteredEntries.slice(startIndex, startIndex + perPage);

            set(state => ({
                ...state,
                // Store all filtered entries in a hidden property
                allFilteredEntries: filteredEntries,
                // Store only the current page entries in the visible entries
                entries: paginatedEntries,
                pagination: {
                    count: filteredEntries.length,
                    total: filteredEntries.length,
                    per_page: perPage,
                    current_page: currentPage,
                    last_page: lastPage,
                },
            }));

            return { entries: paginatedEntries };
        } catch (error) {
            console.error('IP whitelist fetch error:', error);
            set(state => ({ ...state, error }));
            return { entries: [] };
        } finally {
            set(state => ({ ...state, isLoading: false }));
        }
    },

    // Set pagination - recalculate entries for current page
    setPagination: (page, allEntriesParam) => {
        const state = get();
        const allEntries = allEntriesParam || state.allFilteredEntries || [];
        const perPage = state.pagination.per_page;

        // Calculate new pagination
        const startIndex = (page - 1) * perPage;
        const paginatedEntries = allEntries.slice(startIndex, startIndex + perPage);

        set(state => ({
            ...state,
            entries: paginatedEntries,
            pagination: {
                ...state.pagination,
                current_page: page,
            }
        }));
    },

    // Add new IP to whitelist
    addIPWhitelist: async (payload) => {
        set(state => ({ ...state, isLoading: true, error: null }));
        try {
            const response = await createIPWhitelist(payload);
            // Refetch all entries after adding
            await get().fetchIPWhitelist();
            return { success: true };
        } catch (error) {
            console.error('Add IP whitelist error:', error);
            set(state => ({ ...state, error }));
            return { success: false };
        } finally {
            set(state => ({ ...state, isLoading: false }));
        }
    },

    // Update existing IP in whitelist
    updateIPWhitelist: async (id, payload) => {
        set(state => ({ ...state, isLoading: true, error: null }));
        try {
            await updateIPWhitelist(id, payload);
            // Refetch all entries after updating
            await get().fetchIPWhitelist();
            return { success: true };
        } catch (error) {
            console.error('Update IP whitelist error:', error);
            set(state => ({ ...state, error }));
            return { success: false };
        } finally {
            set(state => ({ ...state, isLoading: false }));
        }
    },

    // Remove IP from whitelist
    removeIPWhitelist: async (id) => {
        set(state => ({ ...state, isLoading: true, error: null }));
        try {
            await deleteIPWhitelist(id);
            // Refetch all entries after deleting
            await get().fetchIPWhitelist();
            return { success: true };
        } catch (error) {
            console.error('Remove IP whitelist error:', error);
            set(state => ({ ...state, error }));
            return { success: false };
        } finally {
            set(state => ({ ...state, isLoading: false }));
        }
    },
}));

export default useIPWhitelist;