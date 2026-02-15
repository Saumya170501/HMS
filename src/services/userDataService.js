/**
 * Central User Data Service
 * Handles all Firestore operations for user-specific data.
 * All data is stored under users/{userId} to ensure complete isolation.
 */

import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// Default structures for new users
const DEFAULT_PORTFOLIO = {
    holdings: [],
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    lastUpdated: new Date().toISOString()
};

const DEFAULT_SETTINGS = {
    correlationLookback: 90,
    aiExplanations: true,
    aiDetailLevel: 'detailed',
    refreshInterval: 30,
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

const DEFAULT_PREFERENCES = {
    theme: 'dark',
    historicalAssetType: 'crypto',
    historicalSymbol: 'BTC',
    historicalTimeframe: 90
};

/**
 * Get a reference to a user's document
 */
function getUserRef(userId) {
    return doc(db, 'users', userId);
}

/**
 * Get full user data document
 */
export async function getUserData(userId) {
    if (!userId) return null;
    try {
        const snap = await getDoc(getUserRef(userId));
        return snap.exists() ? snap.data() : null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

/**
 * Update a single field on the user document (merge)
 */
export async function updateUserField(userId, field, value) {
    if (!userId) return;
    try {
        await setDoc(getUserRef(userId), {
            [field]: value,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error(`Error updating ${field}:`, error);
        throw error;
    }
}

/**
 * Subscribe to real-time changes on the entire user document
 */
export function subscribeToUserData(userId, callback) {
    if (!userId) return () => { };
    return onSnapshot(getUserRef(userId), (snap) => {
        callback(snap.exists() ? snap.data() : null);
    }, (error) => {
        console.error('User data subscription error:', error);
    });
}

// ─── Portfolio ───────────────────────────────────────────────

export async function getPortfolio(userId) {
    if (!userId) return { ...DEFAULT_PORTFOLIO };
    try {
        const data = await getUserData(userId);
        return data?.portfolio || { ...DEFAULT_PORTFOLIO };
    } catch {
        return { ...DEFAULT_PORTFOLIO };
    }
}

export async function savePortfolio(userId, portfolio) {
    portfolio.lastUpdated = new Date().toISOString();
    await updateUserField(userId, 'portfolio', portfolio);
}

// ─── Price Alerts ────────────────────────────────────────────

export async function getPriceAlerts(userId) {
    if (!userId) return [];
    try {
        const data = await getUserData(userId);
        return data?.priceAlerts || [];
    } catch {
        return [];
    }
}

export async function savePriceAlerts(userId, alerts) {
    await updateUserField(userId, 'priceAlerts', alerts);
}

export async function addPriceAlert(userId, alert) {
    const alerts = await getPriceAlerts(userId);
    const newAlert = {
        id: Date.now(),
        created_at: Date.now(),
        triggered: false,
        ...alert
    };
    alerts.push(newAlert);
    await savePriceAlerts(userId, alerts);
    return newAlert;
}

export async function deletePriceAlert(userId, alertId) {
    const alerts = await getPriceAlerts(userId);
    const filtered = alerts.filter(a => a.id !== alertId);
    await savePriceAlerts(userId, filtered);
    return filtered;
}

export async function deleteAllPriceAlerts(userId) {
    await savePriceAlerts(userId, []);
    return [];
}

// ─── Settings ────────────────────────────────────────────────

export async function getSettings(userId) {
    if (!userId) return { ...DEFAULT_SETTINGS };
    try {
        const data = await getUserData(userId);
        return data?.settings || { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export async function saveSettings(userId, settings) {
    await updateUserField(userId, 'settings', settings);
}

// ─── Preferences (theme, historical, etc.) ───────────────────

export async function getPreferences(userId) {
    if (!userId) return { ...DEFAULT_PREFERENCES };
    try {
        const data = await getUserData(userId);
        return data?.preferences || { ...DEFAULT_PREFERENCES };
    } catch {
        return { ...DEFAULT_PREFERENCES };
    }
}

export async function savePreferences(userId, preferences) {
    await updateUserField(userId, 'preferences', preferences);
}

export { DEFAULT_PORTFOLIO, DEFAULT_SETTINGS, DEFAULT_PREFERENCES };
