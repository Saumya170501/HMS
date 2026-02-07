/**
 * Volatility Analysis Service
 * Functions for 24h price changes, opposite pair detection, and volatility alerts
 */

import apiManager from './apiManager';

/**
 * Get the current 24-hour price change for an asset
 * 
 * FUNCTION NAME: get24hPriceChange
 * 
 * @param {string} assetSymbol - "BTC", "GOLD", "AAPL"
 * @param {string} assetType - "crypto", "stock", "commodity"
 * 
 * @returns {Object|null} 
 *   {
 *     symbol: "BTC",
 *     current_price: 42800,
 *     price_24h_ago: 43500,
 *     change_amount: -700,
 *     change_percent: -1.61,
 *     timestamp: "2026-02-03T21:07:00Z"
 *   }
 */
export async function get24hPriceChange(assetSymbol, assetType) {
    try {
        // Get current market data
        const marketMap = {
            crypto: 'crypto',
            stock: 'stocks',
            commodity: 'commodities'
        };

        const marketType = marketMap[assetType] || assetType;
        const assets = await apiManager.getMarketData(marketType);

        // Find the specific asset
        const asset = assets.find(a =>
            a.symbol.toUpperCase() === assetSymbol.toUpperCase()
        );

        if (!asset) {
            console.warn(`Asset ${assetSymbol} not found in ${assetType} market`);
            return null;
        }

        // Asset already has 24h change from API
        const currentPrice = asset.price;
        const changePercent = asset.change;

        // Calculate price 24h ago from change percent
        // current_price = price_24h_ago * (1 + change_percent / 100)
        // price_24h_ago = current_price / (1 + change_percent / 100)
        const price24hAgo = currentPrice / (1 + changePercent / 100);
        const changeAmount = currentPrice - price24hAgo;

        return {
            symbol: asset.symbol,
            current_price: Math.round(currentPrice * 100) / 100,
            price_24h_ago: Math.round(price24hAgo * 100) / 100,
            change_amount: Math.round(changeAmount * 100) / 100,
            change_percent: Math.round(changePercent * 100) / 100,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Failed to get 24h price change for ${assetSymbol}:`, error);
        return null;
    }
}

/**
 * Find asset pairs moving in opposite directions
 * 
 * FUNCTION NAME: findOppositePairs
 * 
 * @param {Array} allAssets - Array of objects with 24h change
 *   [{ symbol: "BTC", change_percent: -2.5 }, ...]
 * 
 * @returns {Array} Opposite-moving pairs sorted by divergence
 *   [{
 *     asset1: "BTC",
 *     asset1_change: -2.5,
 *     asset2: "GOLD",
 *     asset2_change: +1.2,
 *     divergence_score: 3.7,
 *     opposite_strength: "strong"
 *   }, ...]
 */
export function findOppositePairs(allAssets) {
    // Validate input
    if (!allAssets || !Array.isArray(allAssets) || allAssets.length < 2) {
        return [];
    }

    const oppositePairs = [];

    // Compare each pair of assets
    for (let i = 0; i < allAssets.length; i++) {
        for (let j = i + 1; j < allAssets.length; j++) {
            const asset1 = allAssets[i];
            const asset2 = allAssets[j];

            const change1 = asset1.change_percent ?? asset1.change ?? 0;
            const change2 = asset2.change_percent ?? asset2.change ?? 0;

            // Skip if both changes are too small (< 0.5%)
            if (Math.abs(change1) < 0.5 && Math.abs(change2) < 0.5) {
                continue;
            }

            // Check if moving in opposite directions (one positive, one negative)
            const isOpposite = (change1 > 0 && change2 < 0) || (change1 < 0 && change2 > 0);

            if (!isOpposite) {
                continue;
            }

            // Calculate divergence score
            const divergenceScore = Math.abs(change1 - change2);

            // Classify strength
            let oppositeStrength;
            if (divergenceScore > 3) {
                oppositeStrength = 'strong';
            } else if (divergenceScore >= 1.5) {
                oppositeStrength = 'moderate';
            } else {
                oppositeStrength = 'low';
            }

            // Always put the negative change as asset1 for consistency
            const [neg, pos] = change1 < 0 ? [asset1, asset2] : [asset2, asset1];
            const negChange = change1 < 0 ? change1 : change2;
            const posChange = change1 < 0 ? change2 : change1;

            oppositePairs.push({
                asset1: neg.symbol,
                asset1_change: Math.round(negChange * 100) / 100,
                asset2: pos.symbol,
                asset2_change: Math.round(posChange * 100) / 100,
                divergence_score: Math.round(divergenceScore * 100) / 100,
                opposite_strength: oppositeStrength
            });
        }
    }

    // Sort by divergence score (highest first) and return top 10
    return oppositePairs
        .sort((a, b) => b.divergence_score - a.divergence_score)
        .slice(0, 10);
}

/**
 * Combine 24h price changes with historical correlation to generate alerts
 * 
 * FUNCTION NAME: getVolatilityPairAlerts
 * 
 * @param {Array} assets - Array of assets with 24h changes
 * @param {Object} correlations - Pre-calculated historical correlations
 *   Example: { "BTC-GOLD": 0.62, "BTC-AAPL": 0.45, ... }
 * 
 * @returns {Array} Alerts with recommendations
 *   [{
 *     asset1: "BTC",
 *     asset1_change: -2.5,
 *     asset2: "GOLD",
 *     asset2_change: +1.2,
 *     divergence: 3.7,
 *     historical_correlation: 0.62,
 *     alert_type: "HEDGE_OPPORTUNITY",
 *     message: "...",
 *     strength: "strong"
 *   }, ...]
 */
export function getVolatilityPairAlerts(assets, correlations = {}) {
    // Get opposite-moving pairs
    const oppositePairs = findOppositePairs(assets);

    if (oppositePairs.length === 0) {
        return [];
    }

    const alerts = [];

    for (const pair of oppositePairs) {
        // Look up historical correlation (try both orderings)
        const key1 = `${pair.asset1}-${pair.asset2}`;
        const key2 = `${pair.asset2}-${pair.asset1}`;
        const correlation = correlations[key1] ?? correlations[key2] ?? null;

        // Determine alert type based on correlation
        let alertType;
        let message;

        if (correlation === null) {
            alertType = 'DIVERGENCE_DETECTED';
            message = `${pair.asset1} ${pair.asset1_change >= 0 ? 'up' : 'down'} ${pair.asset1_change}% while ${pair.asset2} ${pair.asset2_change >= 0 ? 'up' : 'down'} ${pair.asset2_change}%`;
        } else if (Math.abs(correlation) > 0.5) {
            // High correlation but moving opposite = unusual!
            alertType = 'DIVERGENCE_WARNING';
            message = `Unusual! ${pair.asset1} and ${pair.asset2} usually move together (${correlation.toFixed(2)}) but are currently diverging!`;
        } else if (Math.abs(correlation) < 0.3) {
            // Low correlation and moving opposite = expected hedge
            alertType = 'HEDGE_OPPORTUNITY';
            message = `Natural hedge: ${pair.asset1} ↓ ${pair.asset1_change}% | ${pair.asset2} ↑ +${pair.asset2_change}%`;
        } else {
            // Moderate correlation
            alertType = 'DIVERGENCE_DETECTED';
            message = `${pair.asset1} and ${pair.asset2} showing ${pair.divergence_score.toFixed(1)}% divergence today`;
        }

        alerts.push({
            asset1: pair.asset1,
            asset1_change: pair.asset1_change,
            asset2: pair.asset2,
            asset2_change: pair.asset2_change,
            divergence: pair.divergence_score,
            historical_correlation: correlation !== null ? correlation : 'unknown',
            alert_type: alertType,
            message: message,
            strength: pair.opposite_strength
        });
    }

    // Sort by divergence (most interesting first)
    return alerts.sort((a, b) => b.divergence - a.divergence);
}

/**
 * Get all volatility alerts for the dashboard (convenience function)
 * Returns diverse pairs: 2 stocks, 2 crypto, 2 commodities (6 total)
 * Ensures no asset appears more than once
 * 
 * @returns {Promise<Array>} Array of 6 volatility alerts (2 per market)
 */
export async function getDashboardVolatilityAlerts() {
    try {
        const grouped = await getVolatilityAlertsByMarket();

        // Select 2 from each market, ensuring no duplicate assets
        const stockAlerts = selectDiversePairs(grouped.stocks, 2);
        const cryptoAlerts = selectDiversePairs(grouped.crypto, 2);
        const commodityAlerts = selectDiversePairs(grouped.commodities, 2);

        return [...stockAlerts, ...cryptoAlerts, ...commodityAlerts];
    } catch (error) {
        console.error('Failed to get dashboard volatility alerts:', error);
        return [];
    }
}

/**
 * Select diverse pairs where no asset appears more than once
 */
function selectDiversePairs(alerts, count) {
    const selected = [];
    const usedAssets = new Set();

    for (const alert of alerts) {
        if (selected.length >= count) break;

        // Skip if either asset was already used
        if (usedAssets.has(alert.asset1) || usedAssets.has(alert.asset2)) {
            continue;
        }

        selected.push(alert);
        usedAssets.add(alert.asset1);
        usedAssets.add(alert.asset2);
    }

    return selected;
}

/**
 * Get volatility alerts grouped by market type
 * Used for the dedicated Volatility Alerts page
 * 
 * @returns {Promise<Object>} { stocks: [...], crypto: [...], commodities: [...] }
 */
export async function getVolatilityAlertsByMarket() {
    try {
        // Get data from all markets
        const [crypto, stocks, commodities] = await Promise.all([
            apiManager.getMarketData('crypto'),
            apiManager.getMarketData('stocks'),
            apiManager.getMarketData('commodities')
        ]);

        // Pre-calculated correlations
        const knownCorrelations = {
            // Stock pairs
            'AAPL-MSFT': 0.78,
            'NVDA-AMD': 0.82,
            'GOOGL-META': 0.72,
            'AMZN-MSFT': 0.68,
            'TSLA-NVDA': 0.55,
            'JPM-V': 0.45,
            'WMT-MA': 0.35,
            // Crypto pairs
            'BTC-ETH': 0.85,
            'ETH-SOL': 0.80,
            'BTC-SOL': 0.75,
            'BTC-ADA': 0.70,
            'ETH-ADA': 0.72,
            'BTC-XRP': 0.65,
            // Commodity pairs
            'GOLD-SILVER': 0.92,
            'OIL-NATGAS': 0.45,
            'GOLD-OIL': 0.25,
            'SILVER-OIL': 0.28,
            // Cross-market pairs
            'BTC-GOLD': 0.25,
            'BTC-AAPL': 0.35,
            'ETH-AAPL': 0.28
        };

        // Generate alerts for each market separately
        const stocksWithMarket = stocks.map(a => ({
            symbol: a.symbol,
            change_percent: a.change,
            name: a.name,
            market: 'stocks'
        }));
        const cryptoWithMarket = crypto.map(a => ({
            symbol: a.symbol,
            change_percent: a.change,
            name: a.name,
            market: 'crypto'
        }));
        const commoditiesWithMarket = commodities.map(a => ({
            symbol: a.symbol,
            change_percent: a.change,
            name: a.name,
            market: 'commodities'
        }));

        // Get alerts for each market type
        const stockAlerts = getVolatilityPairAlerts(stocksWithMarket, knownCorrelations)
            .map(a => ({ ...a, market: 'stocks' }));
        const cryptoAlerts = getVolatilityPairAlerts(cryptoWithMarket, knownCorrelations)
            .map(a => ({ ...a, market: 'crypto' }));
        const commodityAlerts = getVolatilityPairAlerts(commoditiesWithMarket, knownCorrelations)
            .map(a => ({ ...a, market: 'commodities' }));

        return {
            stocks: stockAlerts,
            crypto: cryptoAlerts,
            commodities: commodityAlerts
        };
    } catch (error) {
        console.error('Failed to get volatility alerts by market:', error);
        return { stocks: [], crypto: [], commodities: [] };
    }
}

export default {
    get24hPriceChange,
    findOppositePairs,
    getVolatilityPairAlerts,
    getDashboardVolatilityAlerts,
    getVolatilityAlertsByMarket
};
