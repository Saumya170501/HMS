/**
 * Price Alerts Service — Subcollection-based
 * Each alert is a separate Firestore document in users/{userId}/priceAlerts/{alertId}
 * Uses localStorage for guests (no userId).
 */

import { db } from '../config/firebase';
import {
    collection, doc, getDocs, addDoc, setDoc, deleteDoc, writeBatch
} from 'firebase/firestore';

const STORAGE_KEY = 'marketvue_price_alerts';

// ─── Subcollection helper ────────────────────────────────────

function getAlertsCol(userId) {
    return collection(db, 'users', userId, 'priceAlerts');
}

// ─── Check for triggered alerts (pure logic, no DB) ──────────

export const checkPriceAlerts = (marketData, activeAlerts) => {
    const notifications = [];
    let hasUpdates = false;

    if (!activeAlerts || activeAlerts.length === 0) return { notifications, updatedAlerts: null };

    const allAssets = [
        ...marketData.stocks,
        ...marketData.crypto,
        ...marketData.commodities
    ];

    const updatedAlerts = activeAlerts.map(alert => {
        const asset = allAssets.find(a => a.symbol === alert.symbol);

        if (asset) {
            let triggered = false;
            let message = '';

            if (alert.triggered) return alert;

            switch (alert.type) {
                case 'price_above':
                    if (asset.price >= alert.threshold) {
                        triggered = true;
                        message = `${asset.symbol} is above target price of $${alert.threshold}`;
                    }
                    break;
                case 'price_below':
                    if (asset.price <= alert.threshold) {
                        triggered = true;
                        message = `${asset.symbol} is below target price of $${alert.threshold}`;
                    }
                    break;
                case 'percent_change':
                    if (Math.abs(asset.change) >= alert.threshold) {
                        triggered = true;
                        message = `${asset.symbol} has moved by ${asset.change}%`;
                    }
                    break;
            }

            if (triggered) {
                notifications.push({
                    title: `Price Alert: ${asset.symbol}`,
                    message: message,
                    type: 'alert',
                    timestamp: Date.now(),
                    assetId: asset.symbol
                });
                hasUpdates = true;
                return { ...alert, triggered: true };
            }
        }
        return alert;
    });

    return { notifications, updatedAlerts: hasUpdates ? updatedAlerts : null };
};

// ─── CRUD operations ─────────────────────────────────────────

/**
 * Add a new price alert
 */
export const addPriceAlert = async (alert, userId) => {
    const newAlert = {
        id: Date.now().toString(),
        created_at: Date.now(),
        triggered: false,
        ...alert
    };

    if (userId) {
        try {
            const alertRef = doc(db, 'users', userId, 'priceAlerts', newAlert.id);
            await setDoc(alertRef, newAlert);
            return newAlert;
        } catch (error) {
            console.error('Error adding price alert:', error);
            throw error;
        }
    }

    // Guest fallback
    const alerts = getPriceAlertsLocal();
    alerts.push(newAlert);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    return newAlert;
};

/**
 * Get all price alerts
 */
export const getPriceAlerts = async (userId) => {
    if (userId) {
        try {
            const snapshot = await getDocs(getAlertsCol(userId));
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error('Error fetching price alerts:', error);
            return [];
        }
    }
    return getPriceAlertsLocal();
};

/**
 * Synchronous local-only version (for useWebSocket fallback)
 */
export const getPriceAlertsLocal = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * Delete a single price alert
 */
export const deletePriceAlert = async (id, userId) => {
    if (userId) {
        try {
            const alertRef = doc(db, 'users', userId, 'priceAlerts', String(id));
            await deleteDoc(alertRef);
            return await getPriceAlerts(userId);
        } catch (error) {
            console.error('Error deleting price alert:', error);
            throw error;
        }
    }
    const alerts = getPriceAlertsLocal();
    const filtered = alerts.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
};

/**
 * Delete all price alerts
 */
export const deleteAllPriceAlerts = async (userId) => {
    if (userId) {
        try {
            const batch = writeBatch(db);
            const snapshot = await getDocs(getAlertsCol(userId));
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            return [];
        } catch (error) {
            console.error('Error deleting all price alerts:', error);
            return [];
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
};

/**
 * Save/update alerts — used by WebSocket when triggered alerts need to be persisted
 * For Firestore: batch update only triggered alerts
 * For guests: overwrite entire array
 */
export const savePriceAlerts = async (alerts, userId) => {
    if (userId) {
        try {
            const batch = writeBatch(db);
            for (const alert of alerts) {
                const alertId = String(alert.id);
                const alertRef = doc(db, 'users', userId, 'priceAlerts', alertId);
                batch.set(alertRef, { ...alert, id: alertId });
            }
            await batch.commit();
        } catch (error) {
            console.error('Error batch saving price alerts:', error);
        }
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    }
};
