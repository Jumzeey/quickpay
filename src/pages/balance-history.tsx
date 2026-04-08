import PageHeader from '@/components/PageHeader';
import TableSkeleton from '@/components/TableSkeleton';
import WebPageTitle from '@/components/WebPageTitle';
import Layout from '@/components/layout';
import { useEffect, useState, useMemo } from 'react';
import WalletCards from '@/components/wallet/WalletCards';
import WalletTransactions from '@/components/wallet/WalletTransactions';
import { Wallet, useWallets } from '@/services/wallet';
import TabHeader from '@/components/TabHeader';
import { useRouter } from 'next/router';
import useCurrency from '@/stores/useCurrency';
import useKyc from '@/stores/useKyc';
import { KycStatus } from '@/types/kyc';
import { notifyError } from '@/util/utils';

const tabs = [
  { title: "Transactions", link: "?tab=transactions" },
];

const WalletHistory = () => {
  const router = useRouter();
  const { tab: urlTab } = router.query;
  const tab = urlTab || (tabs.length > 0 ? tabs[0].link.replace('?tab=', '') : '');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [selectedWalletCurrency, setSelectedWalletCurrency] = useState<string | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  // Fetch wallets to auto-select the first one
  const { data: walletsData, isLoading: walletsLoading } = useWallets();
  const { selectedCurrency, getAccountId } = useCurrency();
  const { userKyc } = useKyc();

  // Helper function to validate if an account_id is a real UUID (not a fallback like "main_NGN")
  const isValidAccountId = (accountId: string | undefined): boolean => {
    if (!accountId || !accountId.trim()) return false;
    // Real account_ids are UUIDs (contain dashes and are longer)
    // Fallback account_ids like "main_NGN" or "reserve_USD" don't contain dashes
    return accountId.includes('-') && accountId.length > 20;
  };

  // Check immediately if wallets have account_id and redirect if not
  useEffect(() => {
    if (walletsLoading || !walletsData) return;

    // Don't redirect if already on the KYC page
    if (router.pathname === '/your-business' && router.query.tab === 'business-kyc') {
      return;
    }

    const balances = (walletsData as any)?.data?.balances;

    // If balances is not an array or is empty, redirect (no wallets = no account_ids)
    if (!Array.isArray(balances) || balances.length === 0) {
      // Get KYC status to show appropriate message
      const kycStatus = userKyc?.status as KycStatus | string;

      let errorMessage = "Please submit KYC to have your account verified.";

      if (kycStatus === KycStatus.PENDING || kycStatus === KycStatus.RE_SUBMITTED) {
        errorMessage = "Please wait for your account to get verified.";
      } else if (kycStatus === KycStatus.UNVERIFIED || kycStatus === KycStatus.REJECTED || !userKyc) {
        errorMessage = "Please submit KYC to have your account verified.";
      }

      notifyError(errorMessage, "Account Verification Required");
      router.push("/your-business?tab=business-kyc");
      return;
    }

    // Check if any wallet has a valid account_id (UUID format) from the API response
    const hasValidAccountId = balances.some((wallet: any) =>
      isValidAccountId(wallet?.account_id)
    );

    if (!hasValidAccountId) {
      // Get KYC status to show appropriate message
      const kycStatus = userKyc?.status as KycStatus | string;

      let errorMessage = "Please submit KYC to have your account verified.";

      if (kycStatus === KycStatus.PENDING || kycStatus === KycStatus.RE_SUBMITTED) {
        errorMessage = "Please wait for your account to get verified.";
      } else if (kycStatus === KycStatus.UNVERIFIED || kycStatus === KycStatus.REJECTED || !userKyc) {
        errorMessage = "Please submit KYC to have your account verified.";
      }

      notifyError(errorMessage, "Account Verification Required");
      router.push("/your-business?tab=business-kyc");
      return;
    }
  }, [walletsData, walletsLoading, userKyc, router]);

  // Transform the response structure from object to array
  // Only use real account_ids from API - don't create fallbacks
  const wallets = useMemo(() => {
    const balances = (walletsData as any)?.data?.balances;

    // If balances is already an array, filter to only include wallets with valid account_ids
    if (Array.isArray(balances)) {
      // Only return wallets that have real account_ids from the API
      return balances.filter((wallet: any) =>
        wallet?.account_id && wallet.account_id.trim() !== ''
      );
    }

    // If balances is an object, transform it to an array
    // NEVER create fallback account_ids like "main_NGN" or "reserve_USD"
    if (balances && typeof balances === 'object') {
      const walletsArray: Wallet[] = [];
      const currency = selectedCurrency || 'NGN';

      // Handle main_account_balance - only if we have a real account_id
      if (balances.main_account_balance) {
        const mainAccountId = getAccountId(currency, 'main');
        // Only add if we have a real account_id (UUID format, not a fallback like "main_NGN")
        // Real account_ids are UUIDs (contain dashes and are longer than 20 chars)
        if (mainAccountId && mainAccountId.includes('-') && mainAccountId.length > 20) {
          walletsArray.push({
            account_id: mainAccountId,
            account_name: `Main Account (${currency})`,
            account_type: 'main',
            available_balance: String(balances.main_account_balance.available_balance || 0),
            ledger_balance: String(balances.main_account_balance.ledger_balance || 0),
            locked_balance: String(balances.main_account_balance.locked_balance || 0),
            currency: currency
          });
        }
      }

      // Handle rolling_reserve_account_balance - only if we have a real account_id
      if (balances.rolling_reserve_account_balance) {
        const reserveAccountId = getAccountId(currency, 'reserve');
        // Only add if we have a real account_id (UUID format, not a fallback)
        if (reserveAccountId && reserveAccountId.includes('-') && reserveAccountId.length > 20) {
          walletsArray.push({
            account_id: reserveAccountId,
            account_name: `Rolling Reserve Account (${currency})`,
            account_type: 'reserve',
            available_balance: String(balances.rolling_reserve_account_balance.available_balance || 0),
            ledger_balance: String(balances.rolling_reserve_account_balance.ledger_balance || 0),
            locked_balance: String(balances.rolling_reserve_account_balance.locked_balance || 0),
            currency: currency
          });
        }
      }

      return walletsArray;
    }

    return [];
  }, [walletsData, selectedCurrency, getAccountId]);

  // Auto-select the first wallet when wallets load
  useEffect(() => {
    if (wallets.length > 0 && !hasAutoSelected && !selectedWallet) {
      const firstWallet = wallets[0];
      setSelectedWallet(firstWallet.account_id);
      setSelectedWalletCurrency(firstWallet.currency);
      setHasAutoSelected(true);
    }
  }, [wallets, hasAutoSelected, selectedWallet]);

  const handleWalletClick = (wallet: Wallet) => {
    setSelectedWallet(wallet.account_id);
    setSelectedWalletCurrency(wallet.currency);
  };

  return (
    <Layout pageTitle='Balance History' icon='wallet-history'>
      <WebPageTitle title='Balance History | Cray Merchant Portal' />

      <div className="mb-8">
        <PageHeader
          className="!mb-0"
          title="Balance History"
          description="Track all your transactions effortlessly with a clear and secure history of your wallet activities."
        />
      </div>

      {/* Wallet Cards */}
      <div className="mt-8">
        <WalletCards
          selectedWallet={selectedWallet}
          onWalletClick={handleWalletClick}
        />
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <TabHeader tabs={tabs} />
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {tab === "transactions" && (
          <WalletTransactions
            selectedWallet={selectedWallet}
            selectedCurrency={selectedWalletCurrency}
          />
        )}
      </div>
    </Layout>
  );
};

export default WalletHistory;