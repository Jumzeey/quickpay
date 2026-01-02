import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallets, Wallet } from '@/services/wallet';
import EmptyState from '@/components/EmptyState';
import { currencySymbols, capitalizeFirstLetter, getCurrencyFlag, notifyError } from '@/util/utils';
import useCurrency from '@/stores/useCurrency';
import useKyc from '@/stores/useKyc';
import { KycStatus } from '@/types/kyc';

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
    const router = useRouter();
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

        // If balances is an object (legacy format), we need to check if we have real account_ids
        // Don't create fallback account_ids - only use real ones from currency store
        if (balances && typeof balances === 'object') {
            const walletsArray: Wallet[] = [];
            const currency = selectedCurrency || 'NGN';

            // Handle main_account_balance - only if we have a real account_id from store
            // NEVER create fallback account_ids like "main_NGN"
            if (balances.main_account_balance) {
                const mainAccountId = getAccountId(currency, 'main');
                // Only add if we have a real account_id (UUID format, not a fallback like "main_NGN")
                // Real account_ids are UUIDs (contain dashes and are longer than 20 chars)
                // This prevents using fallback account_ids that would cause API errors
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

            // Handle rolling_reserve_account_balance - only if we have a real account_id from store
            // NEVER create fallback account_ids like "reserve_NGN"
            if (balances.rolling_reserve_account_balance) {
                const reserveAccountId = getAccountId(currency, 'reserve');
                // Only add if we have a real account_id (UUID format, not a fallback)
                // This prevents using fallback account_ids that would cause API errors
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

    const handleWalletClick = (wallet: Wallet) => {
        onWalletClick?.(wallet);
    };

    // Check if we should redirect (no valid account_ids)
    const shouldRedirect = useMemo(() => {
        if (walletsLoading || !walletsData) return false;
        if (router.pathname === '/your-business' && router.query.tab === 'business-kyc') return false;

        const balances = (walletsData as any)?.data?.balances;
        if (!Array.isArray(balances) || balances.length === 0) return false;

        // Check if any wallet has a valid account_id from the API response
        return !balances.some((wallet: any) =>
            wallet?.account_id && wallet.account_id.trim() !== ''
        );
    }, [walletsData, walletsLoading, router.pathname, router.query.tab]);

    // If we should redirect, return null to prevent rendering
    if (shouldRedirect) {
        return null;
    }

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

