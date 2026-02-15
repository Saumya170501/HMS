import axios from 'axios';

const CACHE_DURATION = 60 * 1000; // 1 minute for prices (real-time)
const MARKET_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for market data
const HISTORICAL_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for historical
const MAX_CALLS_PER_MINUTE = 25; // Conservative (free tier is 30/min)
const cache = new Map();

/**
 * CoinGecko API Service for Cryptocurrency Data
 * Free tier: 10,000 calls/month (~330/day), 30 calls/min
 * No API key required for basic use
 * Docs: https://www.coingecko.com/en/api/documentation
 */
class CoinGeckoService {
    constructor() {
        this.apiKey = import.meta.env.VITE_COINGECKO_API_KEY; // Optional
        this.baseUrl = this.apiKey
            ? 'https://pro-api.coingecko.com/api/v3'  // Pro API (with key)
            : 'https://api.coingecko.com/api/v3';      // Free API
        this.callTimestamps = [];
    }

    /**
     * Check rate limit (25 calls per minute to be safe)
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
        if (!this.canMakeCall()) {
            console.warn('CoinGecko rate limit reached, using cached data');
            return null;
        }

        try {
            this.recordCall();
            const headers = this.apiKey ? { 'x-cg-pro-api-key': this.apiKey } : {};

            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params,
                headers,
                timeout: 15000, // 15 second timeout
            });

            return response.data;
        } catch (error) {
            if (error.response?.status === 429) {
                console.error('CoinGecko rate limit exceeded');
            } else if (error.response?.status === 404) {
                console.error('CoinGecko: Resource not found');
            } else {
                console.error('CoinGecko request failed:', error.message);
            }
            return null;
        }
    }

    /**
     * Get simple prices for multiple coins
     * @param {string[]} coinIds - Array of coin IDs (e.g., ['bitcoin', 'ethereum'])
     * @param {string} vsCurrency - Target currency (default: 'usd')
     * @param {boolean} includeChange - Include 24h change data
     * @returns {Object|null} Price data keyed by coin ID
     */
    async getPrices(coinIds, vsCurrency = 'usd', includeChange = true) {
        const cacheKey = `prices_${coinIds.join(',')}_${vsCurrency}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const params = {
            ids: coinIds.join(','),
            vs_currencies: vsCurrency,
        };

        if (includeChange) {
            params.include_24hr_change = true;
            params.include_24hr_vol = true;
            params.include_market_cap = true;
        }

        const data = await this.makeRequest('/simple/price', params);

        if (data) {
            this.setCache(cacheKey, data);
            return data;
        }
        return null;
    }

    /**
     * Get detailed coin data
     * @param {string} coinId - Coin ID (e.g., 'bitcoin')
     * @returns {Object|null} Detailed coin information
     */
    async getCoinData(coinId) {
        const cacheKey = `coin_${coinId}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest(`/coins/${coinId}`, {
            localization: false,
            tickers: false,
            community_data: false,
            developer_data: false,
        });

        if (data) {
            const result = {
                id: data.id,
                symbol: data.symbol?.toUpperCase() || '',
                name: data.name,
                image: data.image?.large || data.image?.small,
                currentPrice: data.market_data?.current_price?.usd || 0,
                marketCap: data.market_data?.market_cap?.usd || 0,
                marketCapRank: data.market_cap_rank || 0,
                totalVolume: data.market_data?.total_volume?.usd || 0,
                high24h: data.market_data?.high_24h?.usd || 0,
                low24h: data.market_data?.low_24h?.usd || 0,
                priceChange24h: data.market_data?.price_change_24h || 0,
                priceChangePercentage24h: data.market_data?.price_change_percentage_24h || 0,
                circulatingSupply: data.market_data?.circulating_supply || 0,
                totalSupply: data.market_data?.total_supply || 0,
                maxSupply: data.market_data?.max_supply || null,
                ath: data.market_data?.ath?.usd || 0,
                athDate: data.market_data?.ath_date?.usd || null,
                description: data.description?.en || '',
            };
            this.setCache(cacheKey, result, MARKET_CACHE_DURATION);
            return result;
        }
        return null;
    }

    /**
     * Get market data for top cryptocurrencies
     * @param {string} vsCurrency - Target currency (default: 'usd')
     * @param {number} perPage - Results per page (max 250)
     * @param {number} page - Page number
     * @returns {Array|null} Array of market data objects
     */
    async getMarketData(vsCurrency = 'usd', perPage = 100, page = 1) {
        const cacheKey = `market_${vsCurrency}_${perPage}_${page}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/coins/markets', {
            vs_currency: vsCurrency,
            order: 'market_cap_desc',
            per_page: Math.min(perPage, 250),
            page,
            sparkline: false,
        });

        if (data && Array.isArray(data)) {
            const result = data.map(coin => ({
                id: coin.id,
                symbol: coin.symbol?.toUpperCase() || '',
                name: coin.name,
                image: coin.image,
                price: coin.current_price || 0,
                marketCap: coin.market_cap || 0,
                marketCapRank: coin.market_cap_rank || 0,
                volume: coin.total_volume || 0,
                change: coin.price_change_percentage_24h || 0,
                high24h: coin.high_24h || 0,
                low24h: coin.low_24h || 0,
            }));
            this.setCache(cacheKey, result, MARKET_CACHE_DURATION);
            return result;
        }
        return null;
    }

    /**
     * Get historical market data for a coin
     * @param {string} coinId - Coin ID (e.g., 'bitcoin')
     * @param {number} days - Number of days (1, 7, 14, 30, 90, 180, 365, max)
     * @param {string} vsCurrency - Target currency (default: 'usd')
     * @returns {Array|null} Array of {date, price} objects
     */
    async getHistoricalData(coinId, days = 30, vsCurrency = 'usd') {
        const cacheKey = `historical_${coinId}_${days}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest(`/coins/${coinId}/market_chart`, {
            vs_currency: vsCurrency,
            days,
        });

        if (data && data.prices) {
            const result = data.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp).toISOString(),
                timestamp: timestamp,
                close: price,
                // CoinGecko doesn't provide OHLC in free tier, use close for all
                open: price,
                high: price,
                low: price,
            }));
            this.setCache(cacheKey, result, HISTORICAL_CACHE_DURATION);
            return result;
        }
        return null;
    }

    /**
     * Search for coins
     * @param {string} query - Search query
     * @returns {Array} Search results
     */
    async searchCoins(query) {
        const cacheKey = `search_${query}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/search', { query });

        if (data && data.coins) {
            const result = data.coins.slice(0, 20).map(coin => ({
                id: coin.id,
                symbol: coin.symbol?.toUpperCase() || '',
                name: coin.name,
                image: coin.thumb || coin.large,
                marketCapRank: coin.market_cap_rank || 0,
            }));
            this.setCache(cacheKey, result, MARKET_CACHE_DURATION);
            return result;
        }
        return [];
    }

    /**
     * Get trending coins (last 24 hours)
     * @returns {Array|null} Array of trending coins
     */
    async getTrendingCoins() {
        const cacheKey = 'trending';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/search/trending');

        if (data && data.coins) {
            const result = data.coins.map(item => ({
                id: item.item.id,
                symbol: item.item.symbol?.toUpperCase() || '',
                name: item.item.name,
                image: item.item.small || item.item.thumb,
                marketCapRank: item.item.market_cap_rank || 0,
                priceBtc: item.item.price_btc || 0,
            }));
            this.setCache(cacheKey, result, MARKET_CACHE_DURATION);
            return result;
        }
        return null;
    }

    /**
     * Get list of all supported coins (for symbol mapping)
     * @returns {Array} Array of {id, symbol, name}
     */
    async getCoinsList() {
        const cacheKey = 'coins_list';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest('/coins/list');

        if (data && Array.isArray(data)) {
            const result = data.map(coin => ({
                id: coin.id,
                symbol: coin.symbol?.toUpperCase() || '',
                name: coin.name,
            }));
            // Cache for 24 hours (list doesn't change often)
            this.setCache(cacheKey, result, 24 * 60 * 60 * 1000);
            return result;
        }
        return [];
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        cache.clear();
        console.log('CoinGecko cache cleared');
    }
}

export const coinGeckoService = new CoinGeckoService();
export default coinGeckoService;
