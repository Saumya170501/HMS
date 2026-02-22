/**
 * Alert Manager — Zustand Store
 * Wraps alertManagementService for React-friendly state management.
 * Persisted to localStorage and synced to Firestore for authenticated users.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
    getAlertKey,
    shouldShowAlert,
    dismissAlert as dismissAlertService,
    getDismissedAlerts,
    resetDismissedAlerts as resetDismissedService,
    undismissAlert as undismissService,
    getDismissalStats,
    getLocalDismissed,
} from '../services/alertManagementService';

const useAlertManager = create(
    persist(
        (set, get) => ({
            // ─── State ───────────────────────────────────────
            dismissedAlerts: {},  // { alertKey: dismissalEntry }
            feedbackHistory: [],  // Recent feedback for analytics
            _userId: null,
            _loaded: false,

            // ─── Core Actions ────────────────────────────────

            /**
             * Dismiss an alert with optional feedback
             */
            dismissAlert: async (alert, { reason, note, permanent, dataSnapshot } = {}) => {
                const key = typeof alert === 'string' ? alert : getAlertKey(alert);
                const userId = get()._userId;

                const entry = await dismissAlertService(key, {
                    reason: reason || 'dismissed',
                    note: note || '',
                    permanent: permanent || false,
                    dataSnapshot: dataSnapshot || {},
                }, userId);

                set(state => ({
                    dismissedAlerts: { ...state.dismissedAlerts, [key]: entry },
                    feedbackHistory: [
                        { key, reason: entry.reason, timestamp: entry.dismissedAt },
                        ...state.feedbackHistory.slice(0, 49), // Keep last 50
                    ],
                }));

                return entry;
            },

            /**
             * Check if an alert should be shown (synchronous, fast)
             */
            shouldShow: (alert, currentData) => {
                const key = typeof alert === 'string' ? alert : getAlertKey(alert);
                const settings = get()._getSettings();
                const reappearanceDays = settings.reappearanceDays ?? 7;

                // Check per-type opt-out
                const alertType = alert?.alert_type || alert?.type || '';
                if (alertType === 'DIVERGENCE_DETECTED' && !settings.divergenceAlerts) return false;
                if (alertType === 'DIVERGENCE_WARNING' && !settings.divergenceAlerts) return false;
                if (alertType === 'HEDGE_OPPORTUNITY' && !settings.hedgeOpportunities) return false;
                if (alertType === 'price_above' || alertType === 'price_below') {
                    // Price alerts are controlled by the existing priceAlerts toggle
                }

                return shouldShowAlert(key, currentData, reappearanceDays);
            },

            /**
             * Un-dismiss a specific alert
             */
            undismiss: async (alertKey) => {
                const userId = get()._userId;
                await undismissService(alertKey, userId);

                set(state => {
                    const updated = { ...state.dismissedAlerts };
                    delete updated[alertKey];
                    return { dismissedAlerts: updated };
                });
            },

            /**
             * Reset all dismissed alerts
             */
            resetAll: async () => {
                const userId = get()._userId;
                await resetDismissedService(userId);
                set({ dismissedAlerts: {}, feedbackHistory: [] });
            },

            /**
             * Get stats about dismissals
             */
            getStats: () => getDismissalStats(),

            // ─── Firestore Sync ──────────────────────────────

            loadFromFirestore: async (userId) => {
                set({ _userId: userId, _loaded: false });
                try {
                    const dismissed = await getDismissedAlerts(userId);
                    set({ dismissedAlerts: dismissed, _loaded: true });
                } catch (error) {
                    console.error('Failed to load dismissed alerts:', error);
                    // Fall back to local
                    set({ dismissedAlerts: getLocalDismissed(), _loaded: true });
                }
            },

            clearUserData: () => {
                set({ dismissedAlerts: {}, feedbackHistory: [], _userId: null, _loaded: false });
            },

            // ─── Internal helper ─────────────────────────────

            /**
             * Get alert management settings from useSettingsStore
             * (imported dynamically to avoid circular deps)
             */
            _getSettings: () => {
                try {
                    // Dynamic access to avoid circular dependency
                    const settingsModule = require('../hooks/useSettingsStore');
                    const store = settingsModule.default;
                    return store.getState().settings.alertManagement || {};
                } catch {
                    return {};
                }
            },
        }),
        {
            name: 'marketvue_alert_manager',
            partialize: (state) => ({
                dismissedAlerts: state.dismissedAlerts,
                feedbackHistory: state.feedbackHistory,
            }),
        }
    )
);

// ─── Auto-sync on auth state change ──────────────────────────

if (typeof window !== 'undefined') {
    try {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                useAlertManager.getState().loadFromFirestore(user.uid);
            } else {
                useAlertManager.getState().clearUserData();
            }
        });
    } catch {
        // Firebase not initialized yet
    }
}

export default useAlertManager;
