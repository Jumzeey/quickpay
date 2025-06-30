import { useSafeTheme } from '@/hooks/useSafeTheme';
import React from 'react';

const ThemeDebugger: React.FC = () => {
    const { theme, toggleTheme, mounted } = useSafeTheme();

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: '#f0f0f0',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999
        }}>
            <div>Theme: {theme}</div>
            <div>Mounted: {mounted ? 'Yes' : 'No'}</div>
            <button
                onClick={toggleTheme}
                style={{
                    marginTop: '5px',
                    padding: '5px 10px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                }}
            >
                Toggle Theme
            </button>
        </div>
    );
};

export default ThemeDebugger;
