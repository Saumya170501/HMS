/**
 * Alert Management Service
 * Handles dismissed alerts with persistent storage, conditional reappearance,
 * and user feedback tracking.
 *
 * Storage: Firestore subcollection users/{uid}/dismissedAlerts/{alertKey}
 * Fallback: localStorage for guests
 */

import { db } from '../config/firebase';
import {
    collection, doc, getDocs, setDoc, deleteDoc, writeBatch
} from 'firebase/firestore';

const STORAGE_KEY = 'marketvue_dismissed_alerts';

// ─── Firestore helpers ───────────────────────────────────────

function getDismissedCol(userId) {
    return collection(db, 'users', userId, 'dismissedAlerts');
}

// ─── Generate a stable key for an alert ──────────────────────

/**
 * Creates a deterministic key for an alert so the same logical alert
 * always maps to the same key.
 *
 * For volatility alerts: "vol_MSFT_TSLA" (sorted pair)
 * For price alerts: "price_BTC_above_50000"
 * For generic alerts: "gen_{type}_{hash}"
 */
export function getAlertKey(alert) {
    if (alert.asset1 && alert.asset2) {
        // Volatility / divergence alert
        const pair = [alert.asset1, alert.asset2].sort().join('_');
        return `vol_${pair}`;
    }
    if (alert.symbol && alert.type) {
        // Price alert
        return `price_${alert.symbol}_${alert.type}_${alert.threshold || ''}`;
    }
    // Fallback — use title + type
    const slug = (alert.title || alert.message || 'unknown')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 40);
    return `gen_${alert.alert_type || 'misc'}_${slug}`;
}

// ─── Conditional reappearance logic ──────────────────────────

const REAPPEARANCE_DEFAULTS = {
    divergenceChangeThreshold: 0.5,  // 50% change in divergence score
    priceChangeThreshold: 0.1,       // 10% price change
    defaultExpiryDays: 7,
};

/**
 * Determine if a dismissed alert should reappear based on data changes.
 *
 * @param {Object} dismissedEntry - The stored dismissal record
 * @param {Object} currentData - Current alert data for comparison
 * @param {number} reappearanceDays - User-configured days before expiry (-1 = never)
 * @returns {boolean} true if the alert should reappear
 */
export function shouldReappear(dismissedEntry, currentData, reappearanceDays) {
    if (!dismissedEntry) return true; // Not dismissed

    // If user chose "never reappear" and hasn't set a manual reset
    if (dismissedEntry.permanent) return false;

    // Time-based expiry
    if (reappearanceDays > 0) {
        const dismissedAt = dismissedEntry.dismissedAt || 0;
        const expiryMs = reappearanceDays * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedAt > expiryMs) return true;
    }

    // Data-change-based reappearance
    const snapshot = dismissedEntry.dataSnapshot || {};

    // Divergence score changed significantly
    if (snapshot.divergence && currentData?.divergence) {
        const change = Math.abs(currentData.divergence - snapshot.divergence) / snapshot.divergence;
        if (change >= REAPPEARANCE_DEFAULTS.divergenceChangeThreshold) return true;
    }

    // Price changed significantly
    if (snapshot.price && currentData?.price) {
        const change = Math.abs(currentData.price - snapshot.price) / snapshot.price;
        if (change >= REAPPEARANCE_DEFAULTS.priceChangeThreshold) return true;
    }

    return false;
}

// ─── Dismissal reasons ───────────────────────────────────────

export const DISMISSAL_REASONS = [
    { id: 'not_relevant', label: 'Not relevant to me', icon: '🚫' },
    { id: 'already_acted', label: 'Already acted on this', icon: '✅' },
    { id: 'too_frequent', label: 'Too frequent', icon: '🔁' },
    { id: 'not_interested', label: 'Not interested in this pair', icon: '👎' },
    { id: 'other', label: 'Other reason', icon: '💬' },
];

// ─── CRUD Operations ─────────────────────────────────────────

/**
 * Dismiss an alert with user feedback
 */
export async function dismissAlert(alertKey, { reason, note, permanent, dataSnapshot }, userId) {
    const entry = {
        alertKey,
        reason: reason || 'dismissed',
        note: note || '',
        permanent: permanent || false,
        dataSnapshot: dataSnapshot || {},
        dismissedAt: Date.now(),
    };

    if (userId) {
        try {
            const ref = doc(db, 'users', userId, 'dismissedAlerts', alertKey);
            await setDoc(ref, entry);
        } catch (error) {
            console.error('Error dismissing alert in Firestore:', error);
        }
    }

    // Always save locally for immediate UI response
    const local = getLocalDismissed();
    local[alertKey] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));

    return entry;
}

/**
 * Get all dismissed alerts
 */
export async function getDismissedAlerts(userId) {
    if (userId) {
        try {
            const snapshot = await getDocs(getDismissedCol(userId));
            const entries = {};
            snapshot.docs.forEach(d => {
                entries[d.id] = d.data();
            });
            // Also merge to local for fast access
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
            return entries;
        } catch (error) {
            console.error('Error fetching dismissed alerts:', error);
        }
    }
    return getLocalDismissed();
}

/**
 * Get local dismissed alerts (synchronous, for fast checks)
 */
export function getLocalDismissed() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

/**
 * Check if a specific alert should be shown (synchronous, fast)
 */
export function shouldShowAlert(alertKey, currentData, reappearanceDays) {
    const dismissed = getLocalDismissed();
    const entry = dismissed[alertKey];
    if (!entry) return true;
    return shouldReappear(entry, currentData, reappearanceDays ?? REAPPEARANCE_DEFAULTS.defaultExpiryDays);
}

/**
 * Reset all dismissed alerts
 */
export async function resetDismissedAlerts(userId) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));

    if (userId) {
        try {
            const batch = writeBatch(db);
            const snapshot = await getDocs(getDismissedCol(userId));
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (error) {
            console.error('Error resetting dismissed alerts:', error);
        }
    }
}

/**
 * Remove a single dismissal (un-dismiss an alert)
 */
export async function undismissAlert(alertKey, userId) {
    const local = getLocalDismissed();
    delete local[alertKey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));

    if (userId) {
        try {
            const ref = doc(db, 'users', userId, 'dismissedAlerts', alertKey);
            await deleteDoc(ref);
        } catch (error) {
            console.error('Error un-dismissing alert:', error);
        }
    }
}

/**
 * Get dismissal stats
 */
export function getDismissalStats() {
    const dismissed = getLocalDismissed();
    const entries = Object.values(dismissed);
    return {
        total: entries.length,
        permanent: entries.filter(e => e.permanent).length,
        reasons: entries.reduce((acc, e) => {
            acc[e.reason] = (acc[e.reason] || 0) + 1;
            return acc;
        }, {}),
    };
}
