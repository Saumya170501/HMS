const CACHE_DURATION = 60 * 1000; // 60 seconds for commodities
const cache = new Map();

/**
 * Commodities API Service
 * Using free APIs for gold, silver, oil prices
 */
class CommoditiesService {
    constructor() {
        // Using free tier - limited to 100 requests/month
        // Fallback to mock data when limit is reached
        this.dailyCalls = 0;
        this.lastCallDate = new Date().toDateString();
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
     * Track daily API calls
     */
    trackCall() {
        const today = new Date().toDateString();
        if (today !== this.lastCallDate) {
            this.dailyCalls = 0;
            this.lastCallDate = today;
        }
        this.dailyCalls++;
    }

    /**
     * Check if we can make API calls (100/month ≈ 3/day to be safe)
     */
    canMakeCall() {
        return this.dailyCalls < 3;
    }

    /**
     * Fetch commodities data from free API
     * Using metals-api.com for precious metals
     */
    async fetchFromAPI() {
        // For free tier, we'll use mock data to avoid hitting limits
        // In production, replace with actual API call
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
            const changePercent = (Math.random() - 0.5) * 4; // -2% to +2% (commodities are less volatile)
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

        // Try API first if we have calls left
        if (this.canMakeCall()) {
            const apiData = await this.fetchFromAPI();
            if (apiData) {
                this.trackCall();
                this.setCache(cacheKey, apiData);
                return apiData;
            }
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
     */
    async getCommoditiesForHeatmap() {
        const cacheKey = 'all_commodities';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        // For MVP, use mock data with simulated price changes
        const data = this.getMockCommoditiesData();
        this.setCache(cacheKey, data);
        return data;
    }

    /**
     * Get historical data for a commodity (mock)
     * @param {string} symbol - Commodity symbol
     * @param {number} days - Number of days of history
     */
    async getHistorical(symbol, days = 30) {
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
}

export const commoditiesService = new CommoditiesService();
export default commoditiesService;
