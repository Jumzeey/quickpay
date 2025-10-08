import useMode from '@/stores/useMode';
import { useMemo } from 'react';

/**
 * Hook to filter data based on current mode (live/test)
 * @param data - Array of data to filter
 * @param modeKey - The key in the data object that indicates mode (e.g., 'mode', 'is_live', 'environment')
 * @param liveValue - The value that indicates live mode (e.g., true, 1, 'live')
 * @returns Filtered data based on current mode
 */
export const useModeFilter = <T extends Record<string, any>>(
    data: T[],
    modeKey: keyof T = 'mode' as keyof T,
    liveValue: any = true
) => {
    const { isLiveMode } = useMode();

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return data.filter((item) => {
            const itemMode = item[modeKey];

            // If the item's mode matches the live value, it's a live item
            const isLiveItem = itemMode === liveValue || itemMode === 1 || itemMode === 'live';

            // Return items that match the current mode
            return isLiveMode ? isLiveItem : !isLiveItem;
        });
    }, [data, modeKey, liveValue, isLiveMode]);

    return filteredData;
};

/**
 * Hook to get mode-specific API parameter
 * @returns Object with mode parameter for API calls
 */
export const useModeParam = () => {
    const { isLiveMode } = useMode();

    return {
        mode: isLiveMode ? 1 : 0,
        is_live: isLiveMode,
        environment: isLiveMode ? 'live' : 'test',
    };
};

/**
 * Hook to check if current mode matches a specific mode
 * @param mode - Mode to check against ('live' or 'test')
 * @returns Boolean indicating if modes match
 */
export const useIsMode = (mode: 'live' | 'test') => {
    const { isLiveMode } = useMode();
    return mode === 'live' ? isLiveMode : !isLiveMode;
};
