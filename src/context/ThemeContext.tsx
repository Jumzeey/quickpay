'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        console.error('ThemeContext is undefined. Make sure useTheme is called within a ThemeProvider.');
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('light');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        try {
            const savedTheme = localStorage.getItem('theme') as Theme;
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

            // const initialTheme = savedTheme || systemTheme;
            const initialTheme = "light";
            setThemeState(initialTheme);
            applyTheme(initialTheme);
        } catch (error) {
            console.warn('Error accessing localStorage or matchMedia:', error);
            setThemeState('light');
            applyTheme('light');
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        if (typeof window === 'undefined') return;

        try {
            const root = document.documentElement;

            if (newTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } catch (error) {
            console.warn('Error applying theme:', error);
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (isClient) {
            try {
                localStorage.setItem('theme', newTheme);
            } catch (error) {
                console.warn('Error saving theme to localStorage:', error);
            }
        }
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // Provide context value immediately, even before client-side hydration
    const contextValue = {
        theme,
        toggleTheme,
        setTheme
    };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};
