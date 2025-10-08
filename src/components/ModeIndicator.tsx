import useMode from '@/stores/useMode';
import React from 'react';

interface ModeIndicatorProps {
    className?: string;
    showIcon?: boolean;
}

const ModeIndicator: React.FC<ModeIndicatorProps> = ({
    className = '',
    showIcon = true
}) => {
    const { isLiveMode } = useMode();

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isLiveMode
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-orange-100 text-orange-800 border border-orange-300'
                } ${className}`}
        >
            {showIcon && (
                <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
            )}
            {isLiveMode ? 'Live Mode' : 'Test Mode'}
        </div>
    );
};

export default ModeIndicator;
