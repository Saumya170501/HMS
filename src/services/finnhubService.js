import axios from 'axios';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache for quotes
const PROFILE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for company profiles
const MAX_CALLS_PER_MINUTE = 50; // Conservative (free tier is 60/min)
const cache = new Map();

/**
 * Finnhub API Service for Real-Time Stock Data
 * Free tier: 60 API calls/min, real-time US stock quotes
 * Docs: https://finnhub.io/docs/api
 */
class FinnhubService {
    constructor() {
        this.apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
        this.baseUrl = 'https://finnhub.io/api/v1';
        this.callTimestamps = [];
    }

    /**
     * Check rate limit (50 calls per minute to be safe)
     */
    canMakeCall() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Remove old timestamps
        this.callTimestamps = this.callTimestamps.filter(t => t > oneMinuteAgo);

        return this.callTimestamps.length < MAX_CALLS_PER_MINUTE;
    }

    /**
     * Record an API call
     */
    recordCall() {
        this.callTimestamps.push(Date.now());
    }

    /**
     * Get cached data or null if expired
     */
    getCached(key) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.duration) {
            return cached.data;
        }
        cache.delete(key);
        return null;
    }

    /**
     * Store data in cache with custom duration
     */
    setCache(key, data, duration = CACHE_DURATION) {
        cache.set(key, { data, timestamp: Date.now(), duration });
    }

    /**
     * Make API request with rate limiting and error handling
     */
    async makeRequest(endpoint, params = {}) {
        if (!this.apiKey) {
            console.warn('Finnhub API key not configured');
            return null;
        }

        if (!this.canMakeCall()) {
            console.warn('Finnhub rate limit reached, using cached data');
            return null;
        }

        try {
            this.recordCall();
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params: {
                    ...params,
                    token: this.apiKey,
                },
                timeout: 10000, // 10 second timeout
            });

            // Check for API errors
            if (response.data.error) {
                console.error('Finnhub API error:', response.data.error);
                return null;
            }

            return response.data;
        } catch (error) {
            if (error.response?.status === 429) {
                console.error('Finnhub rate limit exceeded');
            } else {
                console.error('Finnhub request failed:', error.message);
            }
            return null;
        }
    }

    /**
     * Get real-time quote for a single stock
     * @param {string} symbol - Stock symbol (e.g., 'AAPL')
     * @returns {Object|null} Quote data with price, change, volume, etc.
     */
    async getQuote(symbol) {
        const cacheKey = `quote_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/quote', { symbol: symbol.toUpperCase() });

        if (data && data.c !== 0) {  // c = current price
            const result = {
                symbol: symbol.toUpperCase(),
                price: data.c,  // current price
                change: data.d,  // change
                changePercent: data.dp,  // percent change
                high: data.h,  // high price of day
                low: data.l,  // low price of day
                open: data.o,  // open price of day
                previousClose: data.pc,  // previous close
                timestamp: data.t,  // timestamp
            };
            this.setCache(cacheKey, result);
            return result;
        }
        return null;
    }

    /**
     * Get multiple stock quotes efficiently (batch processing)
     * @param {string[]} symbols - Array of stock symbols
     * @returns {Array} Array of quote objects
     */
    async getBatchQuotes(symbols) {
        const results = [];
        const uncachedSymbols = [];

        // Check cache first
        for (const symbol of symbols) {
            const cached = this.getCached(`quote_${symbol}`);
            if (cached) {
                results.push(cached);
            } else {
                uncachedSymbols.push(symbol);
            }
        }

        // Fetch uncached symbols with small delays
        for (const symbol of uncachedSymbols) {
            if (!this.canMakeCall()) {
                console.warn(`Rate limit reached, skipping ${symbol}`);
                continue;
            }

            const quote = await this.getQuote(symbol);
            if (quote) {
                results.push(quote);
            }

            // Small delay to avoid hitting rate limits
            if (uncachedSymbols.indexOf(symbol) < uncachedSymbols.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return results;
    }

    /**
     * Get company profile/information
     * @param {string} symbol - Stock symbol
     * @returns {Object|null} Company profile data
     */
    async getCompanyProfile(symbol) {
        const cacheKey = `profile_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/stock/profile2', { symbol: symbol.toUpperCase() });

        if (data && data.ticker) {
            const result = {
                symbol: data.ticker,
                name: data.name,
                country: data.country,
                currency: data.currency,
                exchange: data.exchange,
                industry: data.finnhubIndustry,
                marketCap: data.marketCapitalization,
                logo: data.logo,
                weburl: data.weburl,
                phone: data.phone,
                shareOutstanding: data.shareOutstanding,
                ipo: data.ipo,
            };
            this.setCache(cacheKey, result, PROFILE_CACHE_DURATION);
            return result;
        }
        return null;
    }

    /**
     * Get stock candles (OHLCV data) for historical analysis
     * @param {string} symbol - Stock symbol
     * @param {string} resolution - Time resolution: 1, 5, 15, 30, 60, D, W, M
     * @param {number} from - Unix timestamp (seconds)
     * @param {number} to - Unix timestamp (seconds)
     * @returns {Array|null} Array of candle data
     */
    async getCandles(symbol, resolution = 'D', from, to) {
        const cacheKey = `candles_${symbol}_${resolution}_${from}_${to}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/stock/candle', {
            symbol: symbol.toUpperCase(),
            resolution,
            from,
            to,
        });

        if (data && data.s === 'ok' && data.t) {
            const result = data.t.map((timestamp, i) => ({
                date: new Date(timestamp * 1000).toISOString(),
                timestamp: timestamp,
                open: data.o[i],
                high: data.h[i],
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i],
            }));
            this.setCache(cacheKey, result, CACHE_DURATION);
            return result;
        }
        return null;
    }

    /**
     * Search for stock symbols
     * @param {string} query - Search query
     * @returns {Array} Search results
     */
    async searchSymbols(query) {
        const cacheKey = `search_${query}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/search', { q: query });

        if (data && data.result) {
            const result = data.result
                .filter(item => item.type === 'Common Stock')  // Filter to stocks only
                .map(item => ({
                    symbol: item.symbol,
                    description: item.description,
                    type: item.type,
                    displaySymbol: item.displaySymbol,
                }));
            this.setCache(cacheKey, result, CACHE_DURATION);
            return result;
        }
        return [];
    }

    /**
     * Get market status
     * @param {string} exchange - Exchange code (US, TO, etc.)
     * @returns {Object|null} Market status
     */
    async getMarketStatus(exchange = 'US') {
        const data = await this.makeRequest('/stock/market-status', { exchange });
        return data;
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        cache.clear();
        console.log('Finnhub cache cleared');
    }
}

export const finnhubService = new FinnhubService();
export default finnhubService;
