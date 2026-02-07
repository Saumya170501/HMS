/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Semantic Colors (Themed)
                background: 'var(--background)',
                surface: 'var(--surface)',
                border: 'var(--border)',
                primary: 'var(--text-primary)',
                secondary: 'var(--text-secondary)',

                // Keep original names mapped to vars for backward compatibility
                'dark-bg': 'var(--background)',
                'dark-surface': 'var(--surface)',
                'dark-border': 'var(--border)',

                // Accents
                'accent-green': '#22c55e',
                'accent-red': '#ef4444',
                'accent-gray': '#64748b',

                // Status Colors
                'gain-bright': '#22c55e',
                'gain-muted': 'var(--gain-muted)',
                'loss-bright': '#ef4444',
                'loss-muted': 'var(--loss-muted)',
                'warning-bright': '#f59e0b',
                'warning-muted': 'var(--warning-muted)',

                // Brand
                'accent-primary': '#3b82f6',
                'accent-secondary': '#8b5cf6',

                // Glass
                'glass-overlay': 'var(--glass-overlay)',
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
