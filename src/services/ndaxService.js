import { API_KEYS } from '../config/apiConfig';

const CACHE_DURATION = 30 * 1000; // 30 seconds for crypto (more frequent)
const cache = new Map();

/**
 * NDAX API Service for Crypto Data
 * Using REST API for simplicity (WebSocket can be added for real-time)
 */
class NdaxService {
    constructor() {
        this.apiKey = API_KEYS.NDAX_API;
        this.apiSecret = API_KEYS.NDAX_SECRET;
        this.baseUrl = 'https://api.ndax.io:8443/AP';
        this.wsUrl = 'wss://api.ndax.io/WSGateway';
        this.ws = null;
        this.listeners = new Map();
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
     * Make authenticated request to NDAX
     */
    async makeRequest(endpoint, params = {}) {
        try {
            const url = new URL(`${this.baseUrl}/${endpoint}`);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('NDAX request failed:', error);
            return null;
        }
    }

    /**
     * Get available instruments (trading pairs)
     */
    async getInstruments() {
        const cacheKey = 'instruments';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('GetInstruments', { OMSId: 1 });
        if (data) {
            this.setCache(cacheKey, data);
            return data;
        }
        return [];
    }

    /**
     * Get ticker data for all instruments
     */
    async getTickers() {
        const cacheKey = 'tickers';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        // NDAX uses Level1 for ticker data
        const instruments = await this.getInstruments();
        const tickers = [];

        for (const instrument of instruments.slice(0, 20)) { // Limit to top 20
            try {
                const data = await this.makeRequest('GetLevel1', {
                    OMSId: 1,
                    InstrumentId: instrument.InstrumentId,
                });
                if (data) {
                    tickers.push({
                        id: instrument.Symbol.toLowerCase(),
                        symbol: instrument.Symbol,
                        name: instrument.Product1Symbol,
                        price: data.LastTradedPx || 0,
                        change: ((data.LastTradedPx - data.Rolling24HrPxChange) / data.Rolling24HrPxChange * 100) || 0,
                        volume: data.Rolling24HrVolume || 0,
                        high24h: data.SessionHigh || 0,
                        low24h: data.SessionLow || 0,
                        marketCap: data.Rolling24HrVolume * data.LastTradedPx || 0,
                    });
                }
            } catch (error) {
                console.error(`Failed to get ticker for ${instrument.Symbol}:`, error);
            }
        }

        this.setCache(cacheKey, tickers);
        return tickers;
    }

    /**
     * Get ticker for specific symbol
     * @param {string} symbol - Trading pair symbol (e.g., 'BTCCAD')
     */
    async getTicker(symbol) {
        const tickers = await this.getTickers();
        return tickers.find(t => t.symbol === symbol);
    }

    /**
     * Get mock crypto data (fallback when NDAX API is unavailable)
     * Using common crypto pairs with simulated prices
     */
    getMockCryptoData() {
        const cryptos = [
            { id: 'btc', symbol: 'BTC', name: 'Bitcoin', marketCap: 1200000000000, basePrice: 67500 },
            { id: 'eth', symbol: 'ETH', name: 'Ethereum', marketCap: 380000000000, basePrice: 3450 },
            { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', marketCap: 85000000000, basePrice: 580 },
            { id: 'sol', symbol: 'SOL', name: 'Solana', marketCap: 78000000000, basePrice: 175 },
            { id: 'xrp', symbol: 'XRP', name: 'Ripple', marketCap: 65000000000, basePrice: 0.62 },
            { id: 'ada', symbol: 'ADA', name: 'Cardano', marketCap: 45000000000, basePrice: 0.65 },
            { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', marketCap: 42000000000, basePrice: 0.18 },
            { id: 'avax', symbol: 'AVAX', name: 'Avalanche', marketCap: 38000000000, basePrice: 42 },
            { id: 'dot', symbol: 'DOT', name: 'Polkadot', marketCap: 28000000000, basePrice: 8.5 },
            { id: 'matic', symbol: 'MATIC', name: 'Polygon', marketCap: 25000000000, basePrice: 0.95 },
            { id: 'link', symbol: 'LINK', name: 'Chainlink', marketCap: 18000000000, basePrice: 18.5 },
            { id: 'uni', symbol: 'UNI', name: 'Uniswap', marketCap: 12000000000, basePrice: 12.8 },
        ];

        return cryptos.map(crypto => {
            const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
            const price = crypto.basePrice * (1 + changePercent / 100);
            return {
                ...crypto,
                price: Math.round(price * 100) / 100,
                change: Math.round(changePercent * 100) / 100,
            };
        });
    }

    /**
     * Get crypto data for heatmap (with fallback to mock)
     */
    async getCryptoForHeatmap() {
        try {
            const tickers = await this.getTickers();
            if (tickers && tickers.length > 0) {
                return tickers;
            }
        } catch (error) {
            console.warn('NDAX API unavailable, using mock data:', error);
        }

        return this.getMockCryptoData();
    }
}

export const ndaxService = new NdaxService();
export default ndaxService;
