import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeTest() {
    const [mounted, setMounted] = useState(false);
    const { theme, toggleTheme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
            <h1 className="text-3xl font-bold mb-6">Theme Test Page</h1>

            <div className="space-y-4">
                <p className="text-lg">Current theme: <strong>{theme}</strong></p>

                <div className="flex gap-4">
                    <button
                        onClick={toggleTheme}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        Toggle Theme
                    </button>

                    <button
                        onClick={() => setTheme('light')}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Light Mode
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Dark Mode
                    </button>
                </div>

                <div className="mt-8 p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-semibold mb-4">Theme Test Card</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This card demonstrates how components adapt to the current theme.
                        The background, text colors, and borders should change when you toggle the theme.
                    </p>

                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    </div>
                </div>

                <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    <p>Debug info:</p>
                    <ul className="list-disc list-inside">
                        <li>Component mounted: {mounted ? 'Yes' : 'No'}</li>
                        <li>Theme state: {theme}</li>
                        <li>Dark class on html: {typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'Yes' : 'No'}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
