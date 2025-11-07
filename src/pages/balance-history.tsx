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
  const { data: walletsData } = useWallets();
  const wallets = useMemo(() => {
    return (walletsData as any)?.data?.balances || [];
  }, [walletsData]);

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