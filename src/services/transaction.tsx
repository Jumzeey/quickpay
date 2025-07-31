import { CurrencyOption } from "@/stores/useCurrency";
import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";
import { notifyError } from "@/util/utils";

interface AddSettlementPayload {
  bank_code: string;
  account_number: string;
  account_name: string;
}

export async function getWalletBalances() {
  try {
    const response = await api.get(apiEndpoints.transaction.GET_BALANCE);
    return response;
  } catch (error) { }
}

export async function getMerchantBalance(currency: CurrencyOption) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_MERCHANT_BALANCE}`, {
      params: { currency }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function populateCharts(days: string, currency?: CurrencyOption) {
  try {
    const response = await api.get(`${apiEndpoints.transaction.GET_TRANSACTIONS}?days=${days}`, {
      params: { currency }
    });
    return response.data.transactions;
  } catch (error) { }
}

export const handleDashboardData = async (currency: CurrencyOption = 'NGN') => {
  const results = await Promise.allSettled([
    getWalletBalances(),
    populateCharts("7", currency),
    populateSettlementCharts(currency),
    getMerchantBalance(currency),
  ]);

  const balances = results[0].status === "fulfilled" ? results[0].value : null;

  const transactions =
    results[1].status === "fulfilled" ? results[1].value : null;

  const settlements =
    results[2].status === "fulfilled" ? results[2].value : null;

  if (results[0].status === "rejected") {
    notifyError(results[0].reason);
  }
  if (results[1].status === "rejected") {
    notifyError(results[1].reason);
  }
  if (results[2].status === "rejected") {
    notifyError(results[2].reason);
  }

  const merchantBalance =
    results[3].status === "fulfilled" ? results[3].value : null;

  return {
    balances,
    transactions,
    settlements,
    merchantBalance,
  };
};

export async function getSettlementAccounts(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_SETTLEMENT_ACCOUNTS}`,
      { params }
    );
    return response.data.accounts;
  } catch (error) {
    throw error;
  }
}

export async function addSettlementAccount(payload: AddSettlementPayload) {
  try {
    const response = await api.post(
      apiEndpoints.transaction.ADD_SETTLEMENT_ACCOUNT,
      payload
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getSettlementHistory(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_SETTLEMENT_HISTORY}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getSettlementBreakdown(
  id: string | string[] | undefined
) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_SETTLEMENT_HISTORY}/${id}`
    );
    return response.data.settlementRefs;
  } catch (error) {
    throw error;
  }
}

export async function getSettlementTransactions(
  settlementId: string | string[] | undefined,
  breakdownId: string | string[] | undefined
) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_SETTLEMENT_HISTORY}/${settlementId}/${breakdownId}/transactions`
    );
    return response.data.transactions;
  } catch (error) {
    throw error;
  }
}

export async function populateSettlementCharts(currency: CurrencyOption) {
  try {
    const response = await api.get(
      apiEndpoints.transaction.POPULATE_SETTLEMENT_CHARTS, {
      params: { currency }
    }
    );
    return response.data.settlements;
  } catch (error) { }
}

export async function EnableOrDisableAccount(id: number, targetStatus: string) {
  try {
    const response = await api.put(
      `${apiEndpoints.transaction.CHANGE_ACCOUNT_STATUS}/${id}/${targetStatus}`
    );
    return response;
  } catch (error) {
    throw error;
  }
}

export async function getWalletHistory(params?: object) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_WALLET_HISTORY}`,
      { params }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function checkExportStatus(jobId: number) {
  try {
    const response = await api.get(
      `${apiEndpoints.transaction.GET_WALLET_EXPORT_STATUS.replace(':id', jobId.toString())}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}