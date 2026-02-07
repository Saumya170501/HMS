import alphaVantageService from './alphaVantageService';
import ndaxService from './ndaxService';
import commoditiesService from './commoditiesService';
import useMarketStore from '../store';

/**
 * Unified API Manager  
 * Handles all market data requests with caching and fallbacks
 */
class ApiManager {
    constructor() {
        this.alphaVantage = alphaVantageService;
        this.ndax = ndaxService;
        this.commodities = commoditiesService;
        this.subscribers = new Map();
        this.updateInterval = null;
    }

    /**
     * Get data for a specific market type
     * NOW USES REAL-TIME WEBSOCKET DATA FROM STORE!
     * @param {string} marketType - 'stocks', 'crypto', or 'commodities'
     */
    async getMarketData(marketType) {
        // Get real-time data from WebSocket store
        const storeData = useMarketStore.getState().marketData;

        if (storeData[marketType] && storeData[marketType].length > 0) {
            // Return real-time data from WebSocket
            console.log(`✅ Using WebSocket data for ${marketType}:`, {
                count: storeData[marketType].length,
                sample: storeData[marketType][0]
            });
            return storeData[marketType];
        }

        // Fallback to legacy methods if WebSocket hasn't connected yet
        console.warn(`⚠️ WebSocket data not available for ${marketType}, using fallback. Store contents:`, storeData);
        switch (marketType) {
            case 'stocks':
                return this.getStocksData();
            case 'crypto':
                return this.getCryptoData();
            case 'commodities':
                return this.getCommoditiesData();
            default:
                console.warn(`Unknown market type: ${marketType}`);
                return [];
        }
    }

    /**
     * Get stocks data for heatmap
     * Note: Alpha Vantage free tier has rate limits (5 calls/min)
     * We use mock data as the primary source for heatmap visualization
     */
    async getStocksData() {
        // Use mock data directly to avoid rate limiting issues
        // This provides consistent 12-stock display for the heatmap
        const mockData = this.getMockStocksData();

        // Try to fetch at least one real quote to validate API connection
        try {
            const quote = await this.alphaVantage.getQuote('AAPL');
            if (quote && quote.price) {
                // Update AAPL in mock data with real price
                const appleIndex = mockData.findIndex(s => s.symbol === 'AAPL');
                if (appleIndex !== -1) {
                    mockData[appleIndex].price = quote.price;
                    mockData[appleIndex].change = quote.changePercent || mockData[appleIndex].change;
                }
            }
        } catch (error) {
            // API might be rate limited, use mock data
            console.log('Using mock stock data (API rate limited)');
        }

        return mockData;
    }

    /**
     * Estimate market cap for known stocks (fallback)
     */
    estimateMarketCap(symbol) {
        const estimates = {
            'AAPL': 3000000000000,
            'MSFT': 2800000000000,
            'GOOGL': 1900000000000,
            'AMZN': 1800000000000,
            'NVDA': 1500000000000,
            'META': 1200000000000,
            'TSLA': 750000000000,
            'BRK.B': 780000000000,
            'JPM': 550000000000,
            'V': 520000000000,
            'WMT': 480000000000,
            'MA': 420000000000,
        };
        return estimates[symbol] || 100000000000;
    }

    /**
     * Get mock stocks data (fallback)
     */
    getMockStocksData() {
        const stocks = [
            { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', marketCap: 3000000000000, basePrice: 195.5 },
            { id: 'msft', symbol: 'MSFT', name: 'Microsoft', marketCap: 2800000000000, basePrice: 415.2 },
            { id: 'googl', symbol: 'GOOGL', name: 'Alphabet', marketCap: 1900000000000, basePrice: 175.8 },
            { id: 'amzn', symbol: 'AMZN', name: 'Amazon', marketCap: 1800000000000, basePrice: 185.6 },
            { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA', marketCap: 1500000000000, basePrice: 875.4 },
            { id: 'meta', symbol: 'META', name: 'Meta Platforms', marketCap: 1200000000000, basePrice: 505.3 },
            { id: 'tsla', symbol: 'TSLA', name: 'Tesla', marketCap: 750000000000, basePrice: 248.9 },
            { id: 'brk', symbol: 'BRK.B', name: 'Berkshire Hathaway', marketCap: 780000000000, basePrice: 412.6 },
            { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase', marketCap: 550000000000, basePrice: 198.4 },
            { id: 'v', symbol: 'V', name: 'Visa Inc.', marketCap: 520000000000, basePrice: 285.7 },
            { id: 'wmt', symbol: 'WMT', name: 'Walmart', marketCap: 480000000000, basePrice: 168.3 },
            { id: 'ma', symbol: 'MA', name: 'Mastercard', marketCap: 420000000000, basePrice: 465.2 },
        ];

        return stocks.map(stock => {
            const changePercent = (Math.random() - 0.5) * 6;
            return {
                ...stock,
                price: Math.round(stock.basePrice * (1 + changePercent / 100) * 100) / 100,
                change: Math.round(changePercent * 100) / 100,
            };
        });
    }

    /**
     * Get crypto data for heatmap
     */
    async getCryptoData() {
        return this.ndax.getCryptoForHeatmap();
    }

    /**
     * Get commodities data for heatmap
     */
    async getCommoditiesData() {
        return this.commodities.getCommoditiesForHeatmap();
    }

    /**
     * Search across all markets
     * @param {string} query - Search query
     */
    async search(query) {
        const results = [];

        // Search stocks
        try {
            const stockResults = await this.alphaVantage.search(query);
            results.push(...stockResults.map(r => ({ ...r, market: 'stocks' })));
        } catch (error) {
            console.error('Stock search failed:', error);
        }

        // Add crypto matches from mock data
        const cryptoData = await this.getCryptoData();
        const cryptoMatches = cryptoData.filter(c =>
            c.symbol.toLowerCase().includes(query.toLowerCase()) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...cryptoMatches.map(r => ({ ...r, market: 'crypto' })));

        // Add commodity matches
        const commodityData = await this.getCommoditiesData();
        const commodityMatches = commodityData.filter(c =>
            c.symbol.toLowerCase().includes(query.toLowerCase()) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...commodityMatches.map(r => ({ ...r, market: 'commodities' })));

        return results;
    }

    /**
     * Get detailed asset information
     * @param {string} symbol - Asset symbol
     * @param {string} market - Market type
     */
    async getAssetDetail(symbol, market) {
        switch (market) {
            case 'stocks':
                return this.alphaVantage.getCompanyOverview(symbol);
            case 'crypto':
                return (await this.getCryptoData()).find(c => c.symbol === symbol);
            case 'commodities':
                return (await this.getCommoditiesData()).find(c => c.symbol === symbol);
            default:
                return null;
        }
    }

    /**
     * Get historical price data
     * @param {string} symbol - Asset symbol
     * @param {string} market - Market type
     * @param {string} timeframe - '1D', '1W', '1M', '1Y'
     */
    async getHistoricalData(symbol, market, timeframe = '1M') {
        switch (market) {
            case 'stocks':
                return this.alphaVantage.getDaily(symbol);
            case 'commodities':
                return this.commodities.getHistorical(symbol, this.getTimeframeDays(timeframe));
            default:
                return null;
        }
    }

    /**
     * Convert timeframe to days
     */
    getTimeframeDays(timeframe) {
        const days = {
            '1D': 1,
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365,
        };
        return days[timeframe] || 30;
    }

    /**
     * Check if market is open
     * @param {string} market - Market type
     */
    isMarketOpen(market) {
        if (market === 'crypto') return true; // Crypto is 24/7

        const now = new Date();
        const estOffset = -5 * 60;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const estTime = new Date(utc + (estOffset * 60000));

        const day = estTime.getDay();
        const hours = estTime.getHours();
        const minutes = estTime.getMinutes();
        const timeInMinutes = hours * 60 + minutes;

        const marketOpen = 9 * 60 + 30;
        const marketClose = 16 * 60;

        const isWeekday = day >= 1 && day <= 5;
        const isDuringHours = timeInMinutes >= marketOpen && timeInMinutes < marketClose;

        return isWeekday && isDuringHours;
    }
}

export const apiManager = new ApiManager();
export default apiManager;
