import axios from 'axios';
import { API_KEYS, API_ENDPOINTS } from '../config/apiConfig';

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache
const cache = new Map();

/**
 * Alpha Vantage API Service for Stock Data
 */
class AlphaVantageService {
    constructor() {
        this.apiKey = API_KEYS.ALPHA_VANTAGE;
        this.baseUrl = API_ENDPOINTS.ALPHA_VANTAGE;
        this.callCount = 0;
        this.lastResetTime = Date.now();
    }

    /**
     * Check rate limit (5 calls per minute)
     */
    canMakeCall() {
        const now = Date.now();
        if (now - this.lastResetTime >= 60000) {
            this.callCount = 0;
            this.lastResetTime = now;
        }
        return this.callCount < 5;
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
     * Make API request with rate limiting
     */
    async makeRequest(params) {
        if (!this.canMakeCall()) {
            console.warn('Alpha Vantage rate limit reached, using cached data');
            return null;
        }

        try {
            this.callCount++;
            const response = await axios.get(this.baseUrl, {
                params: {
                    ...params,
                    apikey: this.apiKey,
                },
            });

            // Check for API error messages
            if (response.data['Error Message'] || response.data['Note']) {
                console.error('Alpha Vantage API error:', response.data);
                return null;
            }

            return response.data;
        } catch (error) {
            console.error('Alpha Vantage request failed:', error);
            return null;
        }
    }

    /**
     * Get global quote for a stock symbol
     * @param {string} symbol - Stock symbol (e.g., 'AAPL')
     */
    async getQuote(symbol) {
        const cacheKey = `quote_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest({
            function: 'GLOBAL_QUOTE',
            symbol,
        });

        if (data && data['Global Quote']) {
            const quote = data['Global Quote'];
            const result = {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
                volume: parseInt(quote['06. volume']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                previousClose: parseFloat(quote['08. previous close']),
                lastUpdated: quote['07. latest trading day'],
            };
            this.setCache(cacheKey, result);
            return result;
        }
        return null;
    }

    /**
     * Get intraday time series data
     * @param {string} symbol - Stock symbol
     * @param {string} interval - Time interval (1min, 5min, 15min, 30min, 60min)
     */
    async getIntraday(symbol, interval = '15min') {
        const cacheKey = `intraday_${symbol}_${interval}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest({
            function: 'TIME_SERIES_INTRADAY',
            symbol,
            interval,
            outputsize: 'compact',
        });

        const timeSeriesKey = `Time Series (${interval})`;
        if (data && data[timeSeriesKey]) {
            const timeSeries = data[timeSeriesKey];
            const result = Object.entries(timeSeries).map(([time, values]) => ({
                time,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume']),
            }));
            this.setCache(cacheKey, result);
            return result;
        }
        return null;
    }

    /**
     * Get daily time series data
     * @param {string} symbol - Stock symbol
     */
    async getDaily(symbol) {
        const cacheKey = `daily_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest({
            function: 'TIME_SERIES_DAILY',
            symbol,
            outputsize: 'compact',
        });

        if (data && data['Time Series (Daily)']) {
            const timeSeries = data['Time Series (Daily)'];
            const result = Object.entries(timeSeries).map(([date, values]) => ({
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume']),
            }));
            this.setCache(cacheKey, result);
            return result;
        }
        return null;
    }

    /**
     * Search for stock symbols
     * @param {string} keywords - Search keywords
     */
    async search(keywords) {
        const cacheKey = `search_${keywords}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest({
            function: 'SYMBOL_SEARCH',
            keywords,
        });

        if (data && data.bestMatches) {
            const result = data.bestMatches.map((match) => ({
                symbol: match['1. symbol'],
                name: match['2. name'],
                type: match['3. type'],
                region: match['4. region'],
                currency: match['8. currency'],
            }));
            this.setCache(cacheKey, result);
            return result;
        }
        return [];
    }

    /**
     * Get company overview
     * @param {string} symbol - Stock symbol
     */
    async getCompanyOverview(symbol) {
        const cacheKey = `overview_${symbol}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest({
            function: 'OVERVIEW',
            symbol,
        });

        if (data && data.Symbol) {
            const result = {
                symbol: data.Symbol,
                name: data.Name,
                description: data.Description,
                sector: data.Sector,
                industry: data.Industry,
                marketCap: parseInt(data.MarketCapitalization),
                peRatio: parseFloat(data.PERatio),
                eps: parseFloat(data.EPS),
                dividendYield: parseFloat(data.DividendYield),
                weekHigh52: parseFloat(data['52WeekHigh']),
                weekLow52: parseFloat(data['52WeekLow']),
                beta: parseFloat(data.Beta),
            };
            this.setCache(cacheKey, result);
            return result;
        }
        return null;
    }

    /**
     * Get multiple stock quotes for heatmap
     * @param {string[]} symbols - Array of stock symbols
     */
    async getMultipleQuotes(symbols) {
        const results = [];

        for (const symbol of symbols) {
            // Check cache first
            const cached = this.getCached(`quote_${symbol}`);
            if (cached) {
                results.push(cached);
                continue;
            }

            // Rate limit check
            if (!this.canMakeCall()) {
                console.warn(`Rate limit reached, skipping ${symbol}`);
                continue;
            }

            const quote = await this.getQuote(symbol);
            if (quote) {
                results.push(quote);
            }

            // Small delay between calls
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return results;
    }
}

export const alphaVantageService = new AlphaVantageService();
export default alphaVantageService;
