/**
 * Central User Data Service
 * Handles Firestore operations for user profile, preferences, and settings.
 * Portfolio, watchlist, and price alerts now use their own subcollection-based services.
 */

import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Default structures
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

// Keep DEFAULT_PORTFOLIO for backwards compat (used by portfolioService)
const DEFAULT_PORTFOLIO = {
    holdings: [],
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    lastUpdated: new Date().toISOString()
};

// ─── Core helpers ────────────────────────────────────────────

function getUserRef(userId) {
    return doc(db, 'users', userId);
}

/**
 * Get full user root document
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
 * Update a single field on the root user document (merge)
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
 * Initialize a new user document with defaults
 */
export async function initializeUserDoc(userId, profile = {}) {
    if (!userId) return;
    try {
        const existing = await getUserData(userId);
        if (!existing) {
            await setDoc(getUserRef(userId), {
                ...profile,
                settings: { ...DEFAULT_SETTINGS },
                preferences: { ...DEFAULT_PREFERENCES },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error initializing user doc:', error);
    }
}

/**
 * Subscribe to real-time changes on the root user document
 */
export function subscribeToUserData(userId, callback) {
    if (!userId) return () => { };
    return onSnapshot(getUserRef(userId), (snap) => {
        callback(snap.exists() ? snap.data() : null);
    }, (error) => {
        console.error('User data subscription error:', error);
    });
}

// ─── Settings (stays on root doc) ────────────────────────────

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

// ─── Preferences (stays on root doc) ─────────────────────────

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

// ─── Legacy portfolio methods (delegate to subcollection service) ─

/**
 * @deprecated Use portfolioService directly. Kept for backwards compat.
 */
export async function getPortfolio(userId) {
    // Import dynamically to avoid circular deps
    const { getPortfolio: getPortfolioFromService } = await import('./portfolioService');
    return getPortfolioFromService(userId);
}

export async function savePortfolio(userId, portfolio) {
    const { savePortfolio: savePortfolioFromService } = await import('./portfolioService');
    return savePortfolioFromService(portfolio, userId);
}

// ─── Legacy price alert methods (delegate to subcollection service) ─

export async function getPriceAlerts(userId) {
    const { getPriceAlerts: getPriceAlertsFromService } = await import('./priceAlertsService');
    return getPriceAlertsFromService(userId);
}

export async function savePriceAlerts(userId, alerts) {
    const { savePriceAlerts: savePriceAlertsFromService } = await import('./priceAlertsService');
    return savePriceAlertsFromService(alerts, userId);
}

export async function addPriceAlert(userId, alert) {
    const { addPriceAlert: addPriceAlertFromService } = await import('./priceAlertsService');
    return addPriceAlertFromService(alert, userId);
}

export async function deletePriceAlert(userId, alertId) {
    const { deletePriceAlert: deletePriceAlertFromService } = await import('./priceAlertsService');
    return deletePriceAlertFromService(alertId, userId);
}

export async function deleteAllPriceAlerts(userId) {
    const { deleteAllPriceAlerts: deleteAllFromService } = await import('./priceAlertsService');
    return deleteAllFromService(userId);
}

export { DEFAULT_PORTFOLIO, DEFAULT_SETTINGS, DEFAULT_PREFERENCES };
