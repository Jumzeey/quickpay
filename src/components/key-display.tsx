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
            <span className="bg-[#D3D3D3] sarepayPrimary font-semibold rounded-lg px-3 py-2 w-full sm:w-auto">
                {label}
            </span>
            <div className="flex items-center gap-2 w-full">
                <span className="bg-[#EEEEEE] text-gray-700 font-mono flex-1 px-3 py-2 rounded-lg truncate">
                    {value}
                </span>
                <span
                    className="bg-[#D3D3D3] p-2 rounded-lg cursor-pointer"
                    onClick={() => copyToClipboard(keyValue)}
                >
                    <Image src="/images/dashboard/copy.svg" alt="Copy Icon" width={22} height={26} />
                </span>
            </div>
        </div>
    );
};

export default KeyDisplay;
