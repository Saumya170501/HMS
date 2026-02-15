import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import * as userDataService from '../services/userDataService';

const DEFAULT_SETTINGS = {
    correlationLookback: 90,
    aiExplanations: true,
    aiDetailLevel: 'detailed',
    refreshInterval: 30, // seconds
    showAfterHoursGrayscale: true,
    alertSound: 'default',
    alertDuration: 5000,
    exportFormat: 'csv',
    exportMetadata: true,
    theme: 'dark',
    notifications: {
        correlationAlerts: true,
        priceAlerts: false,
        marketNews: true,
        volumeSpikes: false
    }
};

const useSettingsStore = create(
    persist(
        (set, get) => ({
            settings: { ...DEFAULT_SETTINGS },
            _userId: null,

            // Update a single top-level setting
            updateSetting: (key, value) => {
                set((state) => ({
                    settings: { ...state.settings, [key]: value }
                }));
                // Sync to Firestore
                const uid = get()._userId;
                if (uid) {
                    userDataService.saveSettings(uid, get().settings);
                }
            },

            // Update nested notification settings
            updateNotification: (key, value) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        notifications: { ...state.settings.notifications, [key]: value }
                    }
                }));
                const uid = get()._userId;
                if (uid) {
                    userDataService.saveSettings(uid, get().settings);
                }
            },

            // Reset all settings to defaults
            resetSettings: () => {
                set({ settings: { ...DEFAULT_SETTINGS } });
                const uid = get()._userId;
                if (uid) {
                    userDataService.saveSettings(uid, { ...DEFAULT_SETTINGS });
                }
            },

            // Load settings from Firestore for authenticated user
            loadFromFirestore: async (userId) => {
                if (!userId) return;
                set({ _userId: userId });
                try {
                    const settings = await userDataService.getSettings(userId);
                    if (settings && Object.keys(settings).length > 0) {
                        // Merge with defaults to ensure all keys exist
                        set({ settings: { ...DEFAULT_SETTINGS, ...settings } });
                    } else {
                        // New user: reset to defaults (clean slate)
                        set({ settings: { ...DEFAULT_SETTINGS } });
                    }
                } catch (error) {
                    console.error('Failed to load settings from Firestore:', error);
                }
            },

            // Clear user data on logout (reset to defaults)
            clearUserData: () => {
                set({ settings: { ...DEFAULT_SETTINGS }, _userId: null });
            },

            // Get specific parts of settings for easier consumption
            getRefreshInterval: () => get().settings.refreshInterval * 1000,
            getCorrelationLookback: () => get().settings.correlationLookback,
        }),
        {
            name: 'marketvue_settings',
            partialize: (state) => ({ settings: state.settings }),
        }
    )
);

// Auto-sync on auth state change
if (typeof window !== 'undefined') {
    try {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                useSettingsStore.getState().loadFromFirestore(user.uid);
            } else {
                // User logged out: reset to defaults to prevent data leakage
                useSettingsStore.getState().clearUserData();
            }
        });
    } catch (e) {
        // Firebase not initialized yet
    }
}

export default useSettingsStore;
