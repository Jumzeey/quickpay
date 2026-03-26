import React from 'react';
import Image from 'next/image';

interface PayoutReceiptProps {
    payout: {
        id: number;
        reference: string;
        customer_reference?: string;
        transaction_type?: string;
        currency: string;
        currency_symbol: string;
        amount: string;
        status: string;
        created_at: string;
        value_date?: string;
        recipient_account_number?: string;
        recipient_account_name?: string;
        recipient_bank?: string;
        channel?: string;
        session_id?: string | null;
    };
}

const PayoutReceipt: React.FC<PayoutReceiptProps> = ({ payout }) => {
    // Format date from ISO string to "Thurs Oct 2025 - 7:53 AM" format
    const formatReceiptDate = (dateString: string) => {
        const date = new Date(dateString);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        return `${dayName} ${monthName} ${year} - ${displayHours}:${minutes} ${ampm}`;
    };

    const receiptDate = payout.value_date
        ? formatReceiptDate(payout.value_date)
        : formatReceiptDate(payout.created_at);
    const transactionType = payout.transaction_type || 'Payout';
    const formattedAmount = (() => {
        const raw = payout.amount ?? '';
        const numeric = Number(String(raw).replace(/[^0-9.-]/g, ''));
        if (Number.isNaN(numeric)) return raw;
        const code = String(payout.currency || '').toUpperCase();
        try {
            return new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: code || 'NGN',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numeric);
        } catch {
            const symbol = payout.currency_symbol || code || '';
            return `${symbol}${numeric.toFixed(2)}`;
        }
    })();

    return (
        <div className="w-full max-w-md mx-auto bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minWidth: '400px' }}>
            {/* Blue Header Bar */}
            <div className="w-full h-3 bg-[#005BB0]"></div>

            {/* Logo and Title Section */}
            <div className="flex flex-col items-center py-8 px-6">
                <div className="mb-2">
                    <Image
                        src="/images/cray-logo.svg"
                        alt="CRAY Logo"
                        width={140}
                        height={50}
                        className="object-contain"
                        priority
                        unoptimized
                    />
                </div>
                <h1 className="text-lg font-semibold text-gray-900 mt-3" style={{ fontSize: '18px', fontWeight: 600 }}>
                    Transaction Receipt
                </h1>
            </div>

            {/* Transaction Details */}
            <div className="px-6 pb-8">
                <div className="space-y-3">
                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Transaction Type:</span>
                        <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>{transactionType}</span>
                    </div>

                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Date:</span>
                        <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>{receiptDate}</span>
                    </div>

                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Amount:</span>
                        <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>{formattedAmount}</span>
                    </div>

                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Status:</span>
                        <span className={`text-sm text-right font-medium`} style={{
                            fontSize: '14px',
                            color: payout.status === 'Successful' ? '#16a34a' : '#dc2626',
                            fontWeight: 500
                        }}>
                            {payout.status}
                        </span>
                    </div>

                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Currency:</span>
                        <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>{payout.currency}</span>
                    </div>

                    {payout.customer_reference && (
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Customer Reference:</span>
                            <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>
                                {payout.customer_reference}
                            </span>
                        </div>
                    )}

                    {payout.recipient_account_number && (
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Recipient Account Number:</span>
                            <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>
                                {payout.recipient_account_number}
                            </span>
                        </div>
                    )}

                    {payout.recipient_account_name && (
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Recipient Account Name:</span>
                            <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>
                                {payout.recipient_account_name}
                            </span>
                        </div>
                    )}

                    {payout.recipient_bank && (
                        <div className="flex justify-between items-start">
                            <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Bank:</span>
                            <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>
                                {payout.recipient_bank}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-700" style={{ fontSize: '14px' }}>Session ID:</span>
                        <span className="text-sm text-gray-900 text-right" style={{ fontSize: '14px', fontWeight: 500 }}>
                            {payout.session_id ?? '--'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Visit Cray Finance Link */}
            <div className="px-6 pb-8 text-center">
                <a
                    href="https://www.crayfinance.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#005BB0] text-sm font-medium hover:underline"
                    style={{ fontSize: '14px', color: '#005BB0', textDecoration: 'none' }}
                >
                    Visit Cray Finance
                </a>
            </div>
        </div>
    );
};

export default PayoutReceipt;

