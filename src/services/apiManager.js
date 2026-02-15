import alphaVantageService from './alphaVantageService';
import finnhubService from './finnhubService';
import coinGeckoService from './coinGeckoService';
import ndaxService from './ndaxService';
import commoditiesService from './commoditiesService';
import useMarketStore from '../store';
import { getCoinGeckoId } from '../config/cryptoMapping';

/**
 * Unified API Manager  
 * Handles all market data requests with caching and fallbacks
 * NOW WITH FINNHUB (stocks) AND COINGECKO (crypto) INTEGRATION!
 */
class ApiManager {
    constructor() {
        this.alphaVantage = alphaVantageService;
        this.finnhub = finnhubService;
        this.coinGecko = coinGeckoService;
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
            console.log(`Using WebSocket data for ${marketType}:`, {
                count: storeData[marketType].length,
                sample: storeData[marketType][0]
            });
            return storeData[marketType];
        }

        // Fallback to legacy methods if WebSocket hasn't connected yet
        console.warn(`WebSocket data not available for ${marketType}, using fallback. Store contents:`, storeData);
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
     * Uses Finnhub (60/min) → Alpha Vantage (5/min) → Mock Data
     */
    async getStocksData() {
        const stockSymbols = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META',
            'TSLA', 'BRK.B', 'JPM', 'V', 'WMT', 'MA'
        ];

        // Try Finnhub first (best rate limits)
        try {
            console.log('Fetching stocks from Finnhub...');
            const finnhubData = await this.finnhub.getBatchQuotes(stockSymbols);

            if (finnhubData && finnhubData.length > 0) {
                console.log(`Got ${finnhubData.length} stocks from Finnhub`);
                return finnhubData.map(quote => ({
                    symbol: quote.symbol,
                    name: this.getStockName(quote.symbol),
                    price: quote.price,
                    change: quote.changePercent,
                    volume: quote.previousClose * 1000000, // Estimate
                    marketCap: this.estimateMarketCap(quote.symbol),
                    market: 'stocks'
                }));
            }
        } catch (error) {
            console.warn('Finnhub failed, trying Alpha Vantage:', error.message);
        }

        // Fallback to Alpha Vantage
        try {
            const mockData = this.getMockStocksData();
            const quote = await this.alphaVantage.getQuote('AAPL');
            if (quote && quote.price) {
                const appleIndex = mockData.findIndex(s => s.symbol === 'AAPL');
                if (appleIndex !== -1) {
                    mockData[appleIndex].price = quote.price;
                    mockData[appleIndex].change = quote.changePercent || mockData[appleIndex].change;
                }
            }
            console.log('Using Alpha Vantage + mock data');
            return mockData;
        } catch (error) {
            console.warn('Alpha Vantage failed, using mock data:', error.message);
        }

        // Final fallback to mock data
        console.log('Using mock stock data only');
        return this.getMockStocksData();
    }

    /**
     * Get stock name from symbol
     */
    getStockName(symbol) {
        const names = {
            'AAPL': 'Apple Inc.',
            'MSFT': 'Microsoft',
            'GOOGL': 'Alphabet',
            'AMZN': 'Amazon',
            'NVDA': 'NVIDIA',
            'META': 'Meta Platforms',
            'TSLA': 'Tesla',
            'BRK.B': 'Berkshire Hathaway',
            'JPM': 'JPMorgan Chase',
            'V': 'Visa Inc.',
            'WMT': 'Walmart',
            'MA': 'Mastercard',
        };
        return names[symbol] || symbol;
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
     * Uses CoinGecko (500+ coins, 30/min) → NDAX → Mock Data
     */
    async getCryptoData() {
        // Try CoinGecko first (best crypto coverage)
        try {
            console.log('Fetching crypto from CoinGecko...');
            const coinGeckoData = await this.coinGecko.getMarketData('usd', 50);

            if (coinGeckoData && coinGeckoData.length > 0) {
                console.log(`Got ${coinGeckoData.length} coins from CoinGecko`);
                return coinGeckoData.map(coin => ({
                    symbol: coin.symbol,
                    name: coin.name,
                    price: coin.price,
                    change: coin.change,
                    volume: coin.volume,
                    marketCap: coin.marketCap,
                    market: 'crypto'
                }));
            }
        } catch (error) {
            console.warn('CoinGecko failed, trying NDAX:', error.message);
        }

        // Fallback to NDAX data
        try {
            return await this.ndax.getCryptoForHeatmap();
        } catch (error) {
            console.warn('NDAX failed, using mock data:', error.message);
            return this.getMockCryptoData();
        }
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

        // Search stocks (try Finnhub first)
        try {
            const finnhubResults = await this.finnhub.searchSymbols(query);
            if (finnhubResults && finnhubResults.length > 0) {
                results.push(...finnhubResults.map(r => ({ ...r, market: 'stocks' })));
            } else {
                // Fallback to Alpha Vantage
                const stockResults = await this.alphaVantage.search(query);
                results.push(...stockResults.map(r => ({ ...r, market: 'stocks' })));
            }
        } catch (error) {
            console.error('Stock search failed:', error);
        }

        // Search crypto with CoinGecko
        try {
            const coinResults = await this.coinGecko.searchCoins(query);
            if (coinResults && coinResults.length > 0) {
                results.push(...coinResults.map(r => ({ ...r, market: 'crypto' })));
            }
        } catch (error) {
            // Fallback to local crypto data search
            const cryptoData = await this.getCryptoData();
            const cryptoMatches = cryptoData.filter(c =>
                c.symbol.toLowerCase().includes(query.toLowerCase()) ||
                c.name.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...cryptoMatches.map(r => ({ ...r, market: 'crypto' })));
        }

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
