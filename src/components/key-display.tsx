import React from 'react';
import Image from 'next/image';
import { copyToClipboard } from '@/util/utils';

interface KeyDisplayProps {
    label: string;
    value: string;
    keyValue: string;
}

const KeyDisplay: React.FC<KeyDisplayProps> = ({ label, value, keyValue }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center rounded-lg p-2 gap-2">
            <div className="bg-[#D3D3D3] quickpayPrimary font-semibold rounded-lg px-3 py-2 min-w-40">
                {label}
            </div>
            <div className="flex items-center gap-2 w-full">
                <span className="bg-[#EEEEEE] text-gray-700 font-mono flex-1 px-3 py-2 rounded-lg truncate">
                    {value}
                </span>
                <button
                    className="bg-[#D3D3D3] p-2 rounded-lg"
                    onClick={() => copyToClipboard(keyValue)}
                >
                    <Image src="/images/dashboard/copy.svg" alt="Copy Icon" width={22} height={26} />
                </button>
            </div>
        </div>
    );
};

export default KeyDisplay;
