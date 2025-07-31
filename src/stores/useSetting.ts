import { getUserLog } from "@/services/settings";
import { create } from "zustand";

interface UserLog {
  id: string;
  action: string;
  name: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Pagination {
  count: number;
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UserLogResponse {
  logs: UserLog[];
  pagination: Pagination;
  export_link?: string;
}

interface SearchParams {
  page?: number;
  search?: string;
  export?: boolean;
  start_date?: string;
  end_date?: string;
}

interface SettingState {
  logs: UserLog[];
  pagination: Pagination;
  getUserLogLoading: boolean;
  fetchUserLog: (searchParams?: SearchParams) => Promise<UserLogResponse>;
}

const initialState: Omit<SettingState, 'fetchUserLog'> = {
  logs: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 0,
    current_page: 1,
    last_page: 1,
  },
  getUserLogLoading: false
};

const useSetting = create<SettingState>((set) => ({
  ...initialState,

  fetchUserLog: async (searchParams?: SearchParams) => {
    set((state) => ({
      ...state,
      getUserLogLoading: true
    }));

    try {
      const response = await getUserLog(searchParams);
      const { logs, pagination, export_link } = response || {};

      // Only update state if not exporting
      if (!searchParams?.export) {
        set(state => ({
          ...state,
          logs,
          pagination,
        }));
      }

      return { logs, pagination, export_link };
    } catch (error) {
      // Re-throw error to be handled by caller
      throw error;
    } finally {
      set((state) => ({
        ...state,
        getUserLogLoading: false,
      }));
    }
  },
}));

export default useSetting;
export type { UserLog, Pagination, SearchParams, SettingState };