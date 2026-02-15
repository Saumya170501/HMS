/**
 * Price Alerts Service
 * Uses Firestore for authenticated users, localStorage for guests.
 */

import * as userDataService from './userDataService';

const STORAGE_KEY = 'marketvue_price_alerts';

// ─── Check for triggered alerts ──────────────────────────────

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

// ─── CRUD operations (Firestore or localStorage) ────────────

export const addPriceAlert = async (alert, userId) => {
    const newAlert = {
        id: Date.now(),
        created_at: Date.now(),
        triggered: false,
        ...alert
    };

    if (userId) {
        return await userDataService.addPriceAlert(userId, alert);
    }

    const alerts = getPriceAlertsLocal();
    alerts.push(newAlert);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    return newAlert;
};

export const getPriceAlerts = async (userId) => {
    if (userId) {
        return await userDataService.getPriceAlerts(userId);
    }
    return getPriceAlertsLocal();
};

// Synchronous local-only version (for useWebSocket fallback)
export const getPriceAlertsLocal = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const deletePriceAlert = async (id, userId) => {
    if (userId) {
        return await userDataService.deletePriceAlert(userId, id);
    }
    const alerts = getPriceAlertsLocal();
    const filtered = alerts.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
};

export const deleteAllPriceAlerts = async (userId) => {
    if (userId) {
        return await userDataService.deleteAllPriceAlerts(userId);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
};

// Save alerts (used by WebSocket when alerts trigger)
export const savePriceAlerts = async (alerts, userId) => {
    if (userId) {
        await userDataService.savePriceAlerts(userId, alerts);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    }
};
