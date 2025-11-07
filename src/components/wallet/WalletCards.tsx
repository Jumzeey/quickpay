import { useState } from 'react';
import { useWallets, Wallet } from '@/services/wallet';
import EmptyState from '@/components/EmptyState';
import { currencySymbols, capitalizeFirstLetter, getCurrencyFlag } from '@/util/utils';

interface WalletCardProps {
    wallet: Wallet;
    isSelected: boolean;
    onClick: () => void;
}

const WalletCard = ({ wallet, isSelected, onClick }: WalletCardProps) => {
    const currencySymbol = currencySymbols[wallet.currency] || '';
    const currencyFlag = getCurrencyFlag(wallet.currency);
    const availableBalance = parseFloat(wallet.available_balance || '0');
    const ledgerBalance = parseFloat(wallet.ledger_balance || '0');
    const lockedBalance = parseFloat(wallet.locked_balance || '0');

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-[#C4C4C429] bg-white hover:border-primary/30'
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-black flex items-center gap-2 truncate">
                        {currencyFlag && <span className="text-lg flex-shrink-0">{currencyFlag}</span>}
                        <span className="truncate">{wallet.account_name}</span>
                    </h3>
                    <p className="text-xs text-[#7F7F7F] mt-1">
                        {capitalizeFirstLetter(wallet.account_type)} • {wallet.currency}
                    </p>
                </div>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${isSelected ? 'bg-primary' : 'bg-[#C4C4C429]'}`} />
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-xs text-[#7F7F7F] font-medium mb-1">Available Balance</p>
                    <p className="text-base font-bold text-black break-all leading-tight" style={{ wordBreak: 'break-word' }}>
                        {currencySymbol}
                        {availableBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>

                <div className="pt-2 border-t border-[#C4C4C429] space-y-2.5">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-[#7F7F7F] font-medium">Ledger</p>
                        <p className="text-xs font-semibold text-black break-all leading-tight" style={{ wordBreak: 'break-word' }}>
                            {currencySymbol}
                            {ledgerBalance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-[#7F7F7F] font-medium">Locked</p>
                        <p className="text-xs font-semibold text-black break-all leading-tight" style={{ wordBreak: 'break-word' }}>
                            {currencySymbol}
                            {lockedBalance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface WalletCardsProps {
    selectedWallet?: string | null;
    onWalletClick?: (wallet: Wallet) => void;
}

const WalletCards = ({
    selectedWallet,
    onWalletClick
}: WalletCardsProps) => {
    const { data: walletsData, isLoading: walletsLoading } = useWallets();

    // API interceptor returns response.data, so walletsData structure is:
    // { status: true, message: "Successful", data: { balances: [...] } }
    const wallets = (walletsData as any)?.data?.balances || [];

    const handleWalletClick = (wallet: Wallet) => {
        onWalletClick?.(wallet);
    };

    if (walletsLoading) {
        return (
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex-shrink-0 w-[280px] h-32 bg-gray-200 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (wallets.length === 0) {
        return (
            <EmptyState
                title="No Wallets Found"
                subTitle="We couldn't find any wallets for this account"
                image="/images/dashboard/disbursement/disbursement-empty-state.svg"
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">All Wallets</h2>
            </div>

            <div className="overflow-x-auto pb-4 -mx-4 px-4 wallet-scroll-container">
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                    {wallets.map((wallet: Wallet) => (
                        <div
                            key={wallet.account_id}
                            className="flex-shrink-0"
                            style={{
                                width: 'calc((100vw - 8rem) / 6)',
                                minWidth: '320px',
                                maxWidth: '380px'
                            }}
                        >
                            <WalletCard
                                wallet={wallet}
                                isSelected={selectedWallet === wallet.account_id}
                                onClick={() => handleWalletClick(wallet)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WalletCards;

