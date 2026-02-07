
// Check for price alerts based on new market data
export const checkPriceAlerts = (marketData, activeAlerts) => {
    const notifications = [];
    let hasUpdates = false;

    if (!activeAlerts || activeAlerts.length === 0) return { notifications, updatedAlerts: null };

    // Flatten market data for easier lookup
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

            // Skip if already triggered
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

// Add a new alert
export const addPriceAlert = (alert) => {
    const alerts = getPriceAlerts();
    const newAlert = {
        id: Date.now(),
        created_at: Date.now(),
        triggered: false,
        ...alert
    };

    alerts.push(newAlert);
    localStorage.setItem('marketvue_price_alerts', JSON.stringify(alerts));
    return newAlert;
};

// Get all alerts
export const getPriceAlerts = () => {
    const stored = localStorage.getItem('marketvue_price_alerts');
    return stored ? JSON.parse(stored) : [];
};

// Delete an alert
export const deletePriceAlert = (id) => {
    const alerts = getPriceAlerts();
    const filtered = alerts.filter(a => a.id !== id);
    localStorage.setItem('marketvue_price_alerts', JSON.stringify(filtered));
    return filtered;
};

// Delete all alerts
export const deleteAllPriceAlerts = () => {
    localStorage.setItem('marketvue_price_alerts', JSON.stringify([]));
    return [];
};
