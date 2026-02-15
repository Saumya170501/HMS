import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import * as userDataService from '../services/userDataService';

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
                applyThemeToDOM(newTheme);

                // Sync to Firestore
                const auth = getAuth();
                if (auth.currentUser) {
                    userDataService.getPreferences(auth.currentUser.uid).then(prefs => {
                        userDataService.savePreferences(auth.currentUser.uid, { ...prefs, theme: newTheme });
                    });
                }
            },

            setTheme: (theme) => {
                set({
                    theme,
                    isDarkMode: theme === 'dark'
                });
                applyThemeToDOM(theme);
            },

            // Load theme from Firestore
            loadFromFirestore: async (userId) => {
                if (!userId) return;
                try {
                    const prefs = await userDataService.getPreferences(userId);
                    if (prefs?.theme) {
                        get().setTheme(prefs.theme);
                    }
                } catch (error) {
                    console.error('Failed to load theme from Firestore:', error);
                }
            },

            // Reset to defaults on logout
            clearUserData: () => {
                set({ theme: 'dark', isDarkMode: true });
                applyThemeToDOM('dark');
            },

            // Initialize theme on app load
            initTheme: () => {
                const { theme } = get();
                applyThemeToDOM(theme);
            }
        }),
        {
            name: 'marketvue_theme',
        }
    )
);

// Helper: apply theme class to <html>
function applyThemeToDOM(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Auto-sync on auth state change
if (typeof window !== 'undefined') {
    try {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                useThemeStore.getState().loadFromFirestore(user.uid);
            } else {
                // User logged out: reset to dark default
                useThemeStore.getState().clearUserData();
            }
        });
    } catch (e) {
        // Firebase not initialized yet
    }
}

export default useThemeStore;
