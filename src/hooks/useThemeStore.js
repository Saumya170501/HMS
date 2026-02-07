import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'dark', // Default to dark
            isDarkMode: true,

            toggleTheme: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark';
                set({
                    theme: newTheme,
                    isDarkMode: newTheme === 'dark'
                });

                // Apply class to html element
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            setTheme: (theme) => {
                set({
                    theme,
                    isDarkMode: theme === 'dark'
                });

                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            // Initialize theme on app load
            initTheme: () => {
                const { theme } = get();
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }),
        {
            name: 'marketvue_theme', // Local storage key
        }
    )
);

export default useThemeStore;
