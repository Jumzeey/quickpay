import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';

export const useSafeTheme = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Since ThemeProvider now always provides a context, this should be safe
    const { theme, toggleTheme, setTheme } = useTheme();

    return {
        theme: mounted ? theme : 'light',
        toggleTheme,
        setTheme,
        mounted
    };
};
