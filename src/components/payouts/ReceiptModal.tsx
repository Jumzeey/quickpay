import React, { useState, useRef, useEffect } from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import PayoutReceipt from './PayoutReceipt';
import { generateReceiptPDF } from '@/util/generateReceiptPDF';
import Image from 'next/image';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    payout: {
        id: number;
        reference: string;
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
        session_id?: string;
        customer_reference?: string;
    } | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payout }) => {
    const [zoom, setZoom] = useState(100);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && payout) {
            setZoom(100);
            setPdfUrl(null);
            setIsGeneratingPDF(false);
        }
    }, [isOpen, payout]);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50));
    };

    const handleResetZoom = () => {
        setZoom(100);
    };

    const handleDownload = async () => {
        if (!payout) return;

        try {
            setIsGeneratingPDF(true);

            // Wait for the hidden receipt container to be ready
            await new Promise(resolve => setTimeout(resolve, 300));

            const container = document.getElementById('receipt-pdf-container');
            if (!container) {
                throw new Error('Receipt container not found');
            }

            // Wait for images to load
            const images = container.querySelectorAll('img');
            await Promise.all(
                Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve; // Don't fail if image doesn't load
                        setTimeout(resolve, 2000); // Timeout after 2 seconds
                    });
                })
            );

            const filename = `payout-receipt-${payout.reference}.pdf`;
            await generateReceiptPDF('receipt-pdf-container', filename);
        } catch (error: any) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrint = () => {
        if (!payout) return;
        window.print();
    };

    if (!payout) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Transaction Receipt"
            className="!max-w-5xl !w-[95vw]"
        >
            <div className="flex flex-col" style={{ minHeight: '500px', maxHeight: '90vh' }}>
                {/* Controls Bar */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200" style={{ minHeight: '60px' }}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 50}
                            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Zoom out"
                        >
                            <Image
                                src="/images/arrow-down-circle.svg"
                                alt="Zoom out"
                                width={20}
                                height={20}
                            />
                        </button>
                        <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 200}
                            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Zoom in"
                        >
                            <Image
                                src="/images/arrow-up-circle.svg"
                                alt="Zoom in"
                                width={20}
                                height={20}
                            />
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            text={
                                <>
                                    <Image
                                        src="/images/download.svg"
                                        alt="Download"
                                        width={16}
                                        height={16}
                                        className="mr-2"
                                    />
                                    Download
                                </>
                            }
                            onClick={handleDownload}
                            ariaLabel="Download receipt as PDF"
                            disabled={isGeneratingPDF}
                            className="!h-10 !px-4"
                            primary
                        />
                        <Button
                            text="Print"
                            onClick={handlePrint}
                            ariaLabel="Print receipt"
                            className="!h-10 !px-4 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        />
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4" style={{ maxHeight: '70vh' }}>
                    <div
                        id="receipt-content"
                        ref={receiptRef}
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease',
                            width: 'fit-content',
                            margin: '0 auto',
                        }}
                        className="mx-auto"
                    >
                        <PayoutReceipt payout={payout} />
                    </div>
                </div>
            </div>

            {/* Hidden receipt container for PDF generation (always at 100% scale) */}
            {isOpen && (
                <div
                    id="receipt-pdf-container"
                    style={{
                        position: 'fixed',
                        left: '-9999px',
                        top: '0',
                        visibility: 'hidden',
                    }}
                >
                    <PayoutReceipt payout={payout} />
                </div>
            )}
        </Modal>
    );
};

export default ReceiptModal;

