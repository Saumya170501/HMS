import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            settings: DEFAULT_SETTINGS,

            // Update a single top-level setting
            updateSetting: (key, value) => set((state) => ({
                settings: { ...state.settings, [key]: value }
            })),

            // Update nested notification settings
            updateNotification: (key, value) => set((state) => ({
                settings: {
                    ...state.settings,
                    notifications: { ...state.settings.notifications, [key]: value }
                }
            })),

            // Reset all settings to defaults
            resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

            // Get specific parts of settings for easier consumption
            getRefreshInterval: () => get().settings.refreshInterval * 1000, // Convert to ms
            getCorrelationLookback: () => get().settings.correlationLookback,
        }),
        {
            name: 'marketvue_settings', // Local storage key
            partialize: (state) => ({ settings: state.settings }), // Only persist settings object
        }
    )
);

export default useSettingsStore;
