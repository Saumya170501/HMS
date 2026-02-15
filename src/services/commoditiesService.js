import finnhubService from './finnhubService';

const CACHE_DURATION = 60 * 1000; // 60 seconds for commodities
const cache = new Map();

/**
 * Commodity Futures Symbol Mapping
 * Maps our symbols to Finnhub commodity futures symbols
 */
const COMMODITY_SYMBOL_MAP = {
    'XAU': 'OANDA:XAU_USD', // Gold
    'XAG': 'OANDA:XAG_USD', // Silver
    'CL': 'OANDA:WTICO_USD', // WTI Crude Oil
    'BZ': 'OANDA:BCO_USD', // Brent Crude
    'NG': 'OANDA:NAT_GAS_USD', // Natural Gas
    'HG': 'OANDA:COPPER_USD', // Copper
    'PL': 'OANDA:XPT_USD', // Platinum
    'PA': 'OANDA:XPD_USD', // Palladium
    'ZW': 'OANDA:WHEAT_USD', // Wheat
    'ZC': 'OANDA:CORN_USD', // Corn
};

/**
 * Commodities API Service
 * Using Finnhub for real commodity futures prices
 * Fallback to mock data if API fails
 */
class CommoditiesService {
    constructor() {
        this.finnhub = finnhubService;
    }

    /**
     * Get cached data or null if expired
     */
    getCached(key) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }

    /**
     * Store data in cache
     */
    setCache(key, data) {
        cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Get commodity metadata
     */
    getCommodityMetadata(symbol) {
        const metadata = {
            'XAU': { id: 'gold', name: 'Gold', unit: '/oz', marketCap: 12000000000000 },
            'XAG': { id: 'silver', name: 'Silver', unit: '/oz', marketCap: 1400000000000 },
            'CL': { id: 'oil', name: 'Crude Oil (WTI)', unit: '/bbl', marketCap: 2500000000000 },
            'BZ': { id: 'brent', name: 'Brent Crude', unit: '/bbl', marketCap: 2200000000000 },
            'NG': { id: 'natgas', name: 'Natural Gas', unit: '/MMBtu', marketCap: 800000000000 },
            'HG': { id: 'copper', name: 'Copper', unit: '/lb', marketCap: 350000000000 },
            'PL': { id: 'platinum', name: 'Platinum', unit: '/oz', marketCap: 280000000000 },
            'PA': { id: 'palladium', name: 'Palladium', unit: '/oz', marketCap: 120000000000 },
            'ZW': { id: 'wheat', name: 'Wheat', unit: '/bu', marketCap: 95000000000 },
            'ZC': { id: 'corn', name: 'Corn', unit: '/bu', marketCap: 85000000000 },
        };
        return metadata[symbol] || { id: symbol.toLowerCase(), name: symbol, unit: '', marketCap: 0 };
    }

    /**
     * Fetch commodity quote from Finnhub
     */
    async fetchFromFinnhub(symbol) {
        try {
            const finnhubSymbol = COMMODITY_SYMBOL_MAP[symbol];
            if (!finnhubSymbol) return null;

            const quote = await this.finnhub.getQuote(finnhubSymbol);
            if (quote && quote.price) {
                const metadata = this.getCommodityMetadata(symbol);
                return {
                    id: metadata.id,
                    symbol: symbol,
                    name: metadata.name,
                    price: quote.price,
                    change: quote.changePercent,
                    marketCap: metadata.marketCap,
                    unit: metadata.unit,
                };
            }
        } catch (error) {
            console.warn(`Finnhub commodity fetch failed for ${symbol}:`, error.message);
        }
        return null;
    }

    /**
     * Get mock commodities data with realistic prices
     */
    getMockCommoditiesData() {
        const baseData = [
            { id: 'gold', symbol: 'XAU', name: 'Gold', marketCap: 12000000000000, basePrice: 2045.5, unit: '/oz' },
            { id: 'silver', symbol: 'XAG', name: 'Silver', marketCap: 1400000000000, basePrice: 23.85, unit: '/oz' },
            { id: 'oil', symbol: 'CL', name: 'Crude Oil (WTI)', marketCap: 2500000000000, basePrice: 78.45, unit: '/bbl' },
            { id: 'brent', symbol: 'BZ', name: 'Brent Crude', marketCap: 2200000000000, basePrice: 82.30, unit: '/bbl' },
            { id: 'natgas', symbol: 'NG', name: 'Natural Gas', marketCap: 800000000000, basePrice: 2.85, unit: '/MMBtu' },
            { id: 'copper', symbol: 'HG', name: 'Copper', marketCap: 350000000000, basePrice: 4.25, unit: '/lb' },
            { id: 'platinum', symbol: 'PL', name: 'Platinum', marketCap: 280000000000, basePrice: 985.6, unit: '/oz' },
            { id: 'palladium', symbol: 'PA', name: 'Palladium', marketCap: 120000000000, basePrice: 1025.4, unit: '/oz' },
            { id: 'wheat', symbol: 'ZW', name: 'Wheat', marketCap: 95000000000, basePrice: 625.8, unit: '/bu' },
            { id: 'corn', symbol: 'ZC', name: 'Corn', marketCap: 85000000000, basePrice: 485.2, unit: '/bu' },
        ];

        return baseData.map(commodity => {
            const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
            const price = commodity.basePrice * (1 + changePercent / 100);
            return {
                id: commodity.id,
                symbol: commodity.symbol,
                name: commodity.name,
                marketCap: commodity.marketCap,
                price: Math.round(price * 100) / 100,
                change: Math.round(changePercent * 100) / 100,
                unit: commodity.unit,
            };
        });
    }

    /**
     * Get commodity price by symbol
     * @param {string} symbol - Commodity symbol (e.g., 'XAU' for gold)
     */
    async getCommodity(symbol) {
        const cacheKey = `commodity_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        // Try Finnhub first
        const finnhubData = await this.fetchFromFinnhub(symbol);
        if (finnhubData) {
            this.setCache(cacheKey, finnhubData);
            return finnhubData;
        }

        // Fallback to mock data
        const mockData = this.getMockCommoditiesData();
        const commodity = mockData.find(c => c.symbol === symbol);
        if (commodity) {
            this.setCache(cacheKey, commodity);
        }
        return commodity;
    }

    /**
     * Get all commodities for heatmap
     * Uses Finnhub → Mock Data
     */
    async getCommoditiesForHeatmap() {
        const cacheKey = 'all_commodities';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const symbols = ['XAU', 'XAG', 'CL', 'BZ', 'NG', 'HG', 'PL', 'PA', 'ZW', 'ZC'];
        const results = [];

        // Try to fetch from Finnhub
        try {
            console.log('Fetching commodities from Finnhub...');
            for (const symbol of symbols) {
                const data = await this.fetchFromFinnhub(symbol);
                if (data) {
                    results.push(data);
                }
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (results.length > 0) {
                console.log(`Got ${results.length} commodities from Finnhub`);
                this.setCache(cacheKey, results);
                return results;
            }
        } catch (error) {
            console.warn('Finnhub commodities failed:', error.message);
        }

        // Fallback to mock data
        console.log('Using mock commodity data');
        const data = this.getMockCommoditiesData();
        this.setCache(cacheKey, data);
        return data;
    }

    /**
     * Get historical data for a commodity
     * @param {string} symbol - Commodity symbol
     * @param {number} days - Number of days of history
     */
    async getHistorical(symbol, days = 30) {
        const finnhubSymbol = COMMODITY_SYMBOL_MAP[symbol];

        if (finnhubSymbol) {
            try {
                // Calculate timestamps
                const to = Math.floor(Date.now() / 1000);
                const from = to - (days * 24 * 60 * 60);

                // Try to get candles from Finnhub
                const candles = await this.finnhub.getCandles(finnhubSymbol, 'D', from, to);
                if (candles && candles.length > 0) {
                    return candles;
                }
            } catch (error) {
                console.warn(`Finnhub historical data failed for ${symbol}:`, error.message);
            }
        }

        // Fallback to mock historical data
        const commodity = await this.getCommodity(symbol);
        if (!commodity) return [];

        const history = [];
        let currentPrice = commodity.price;
        const now = new Date();

        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random walk simulation
            const change = (Math.random() - 0.5) * 2;
            currentPrice = currentPrice * (1 + change / 100);

            history.push({
                date: date.toISOString().split('T')[0],
                open: currentPrice * (1 + (Math.random() - 0.5) * 0.01),
                high: currentPrice * (1 + Math.random() * 0.02),
                low: currentPrice * (1 - Math.random() * 0.02),
                close: currentPrice,
                volume: Math.floor(Math.random() * 1000000),
            });
        }

        return history;
    }

    /**
     * Clear cache
     */
    clearCache() {
        cache.clear();
        console.log('Commodities cache cleared');
    }
}

export const commoditiesService = new CommoditiesService();
export default commoditiesService;
