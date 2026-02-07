import axios from 'axios';

const API_Base = 'http://localhost:8080/api';

/**
 * Historical Price Service
 * Fetches real historical data via our proxy server (which talks to Binance/Finnhub)
 */
export async function getHistoricalPrices(assetSymbol, timeframeDays, assetType) {
    try {
        // Map frontend asset types to backend types
        // 'stock' -> 'stocks' (plural expected by backend default or fallback)
        // Actually api-server expects 'crypto' or 'stocks'/'commodities'
        let type = assetType.toLowerCase();
        if (type === 'stock') type = 'stocks';
        if (type === 'commodity') type = 'commodities';

        const url = `${API_Base}/historical/${type}/${assetSymbol}`;
        const response = await axios.get(url, {
            params: { days: timeframeDays }
        });

        if (response.data.success) {
            return response.data.data;
        } else {
            console.warn(`Proxy error for ${assetSymbol}:`, response.data.error);
            return [];
        }
    } catch (error) {
        console.error(`Error fetching historical prices for ${assetSymbol}:`, error.message);
        return [];
    }
}

export async function getMultipleHistoricalPrices(assets, timeframeDays) {
    const results = {};
    await Promise.all(
        assets.map(async ({ symbol, type }) => {
            results[symbol] = await getHistoricalPrices(symbol, timeframeDays, type);
        })
    );
    return results;
}

export default {
    getHistoricalPrices,
    getMultipleHistoricalPrices
};
