import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const PORT = 8080;
const FINNHUB_KEY = 'd61qfo1r01qgcobqhjpgd61qfo1r01qgcobqhjq0';
const ALPHA_VANTAGE_KEY = 'F7PBCQ141GSJA61H'; // Backup key

console.log(`\n🚀 Starting HMS Consolidated Server...`);

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. DATA CACHE & UTILS
// ==========================================
const cache = {
    data: {},
    expiry: {},
    set: (key, data, ttlSeconds = 300) => {
        cache.data[key] = data;
        cache.expiry[key] = Date.now() + (ttlSeconds * 1000);
    },
    get: (key) => {
        if (cache.data[key] && cache.expiry[key] > Date.now()) {
            return cache.data[key];
        }
        return null;
    }
};

// Initial Market Data (Baseline) with better P/L simulation
const marketData = {
    crypto: [
        { id: 'btc', symbol: 'BTC', name: 'Bitcoin', marketCap: 1800000000000, price: 98500, change: 2.5, prevPrice: 96100 },
        { id: 'eth', symbol: 'ETH', name: 'Ethereum', marketCap: 450000000000, price: 3850, change: 1.2, prevPrice: 3805 },
        { id: 'sol', symbol: 'SOL', name: 'Solana', marketCap: 95000000000, price: 210, change: 3.5, prevPrice: 203 },
        { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', marketCap: 92000000000, price: 640, change: 0.5, prevPrice: 637 },
        { id: 'xrp', symbol: 'XRP', name: 'Ripple', marketCap: 70000000000, price: 0.85, change: -1.2, prevPrice: 0.86 },
        { id: 'ada', symbol: 'ADA', name: 'Cardano', marketCap: 50000000000, price: 0.75, change: 0.8, prevPrice: 0.74 },
        { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', marketCap: 48000000000, price: 0.22, change: 4.5, prevPrice: 0.21 },
        { id: 'avax', symbol: 'AVAX', name: 'Avalanche', marketCap: 42000000000, price: 55, change: -0.5, prevPrice: 55.3 },
        { id: 'dot', symbol: 'DOT', name: 'Polkadot', marketCap: 32000000000, price: 10.5, change: 1.1, prevPrice: 10.4 },
        { id: 'matic', symbol: 'MATIC', name: 'Polygon', marketCap: 28000000000, price: 1.15, change: -0.8, prevPrice: 1.16 },
        { id: 'link', symbol: 'LINK', name: 'Chainlink', marketCap: 21000000000, price: 22.5, change: 2.1, prevPrice: 22.0 },
        { id: 'uni', symbol: 'UNI', name: 'Uniswap', marketCap: 15000000000, price: 15.8, change: 0.5, prevPrice: 15.7 },
    ],
    stocks: [
        { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', marketCap: 3400000000000, price: 235.5, change: 1.2, prevPrice: 232.7 },
        { id: 'msft', symbol: 'MSFT', name: 'Microsoft', marketCap: 3200000000000, price: 445.2, change: -0.5, prevPrice: 447.4 },
        { id: 'googl', symbol: 'GOOGL', name: 'Alphabet', marketCap: 2100000000000, price: 185.8, change: 0.8, prevPrice: 184.3 },
        { id: 'amzn', symbol: 'AMZN', name: 'Amazon', marketCap: 2000000000000, price: 205.6, change: 1.5, prevPrice: 202.5 },
        { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA', marketCap: 3100000000000, price: 142.4, change: 2.8, prevPrice: 138.5 }, // Post-split price
        { id: 'meta', symbol: 'META', name: 'Meta Platforms', marketCap: 1400000000000, price: 585.3, change: -1.1, prevPrice: 591.8 },
        { id: 'tsla', symbol: 'TSLA', name: 'Tesla', marketCap: 850000000000, price: 268.9, change: 3.2, prevPrice: 260.5 },
        { id: 'brk-b', symbol: 'BRK.B', name: 'Berkshire Hathaway', marketCap: 900000000000, price: 462.6, change: 0.2, prevPrice: 461.7 },
        { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase', marketCap: 600000000000, price: 218.4, change: -0.4, prevPrice: 219.3 },
        { id: 'v', symbol: 'V', name: 'Visa Inc.', marketCap: 560000000000, price: 305.7, change: 0.6, prevPrice: 303.9 },
        { id: 'wmt', symbol: 'WMT', name: 'Walmart', marketCap: 520000000000, price: 88.3, change: 1.1, prevPrice: 87.3 }, // Post-split
        { id: 'ma', symbol: 'MA', name: 'Mastercard', marketCap: 450000000000, price: 505.2, change: 0.9, prevPrice: 500.7 },
    ],
    commodities: [
        { id: 'gold', symbol: 'GOLD', name: 'Gold', marketCap: 14000000000000, price: 2650.5, change: 0.5, prevPrice: 2637.3 },
        { id: 'silver', symbol: 'SILVER', name: 'Silver', marketCap: 1600000000000, price: 32.85, change: -1.2, prevPrice: 33.25 },
        { id: 'oil', symbol: 'CL', name: 'Crude Oil', marketCap: 2800000000000, price: 74.45, change: 1.5, prevPrice: 73.35 },
    ]
};

// Calculate initial P/L
['crypto', 'stocks', 'commodities'].forEach(market => {
    marketData[market].forEach(asset => {
        if (asset.prevPrice) {
            asset.change = parseFloat((((asset.price - asset.prevPrice) / asset.prevPrice) * 100).toFixed(2));
        }
    });
});


// ==========================================
// 2. EXTERNAL WEBSOCKET STREAMS
// ==========================================
// BINANCE
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws');
const cryptoSymbols = marketData.crypto.map(c => `${c.symbol.toLowerCase()}usdt`);

binanceWs.on('open', () => {
    console.log('✅ Connected to Binance WebSocket');
    const subscribeMsg = {
        method: 'SUBSCRIBE',
        params: cryptoSymbols.map(s => `${s}@ticker`),
        id: 1
    };
    binanceWs.send(JSON.stringify(subscribeMsg));
});

binanceWs.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        if (msg.s) {
            const symbol = msg.s.replace('USDT', '');
            const asset = marketData.crypto.find(c => c.symbol === symbol);

            if (asset) {
                asset.price = parseFloat(msg.c);
                asset.change = parseFloat(msg.P);
            }
        }
    } catch (e) { /* Ignore */ }
});

// FINNHUB
const finnhubWs = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);

finnhubWs.on('open', () => {
    console.log('✅ Connected to Finnhub WebSocket');
    marketData.stocks.forEach(stock => {
        finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: stock.symbol }));
    });
});

finnhubWs.on('message', (data) => {
    try {
        const msg = JSON.parse(data);
        if (msg.type === 'trade' && msg.data) {
            msg.data.forEach(trade => {
                const asset = marketData.stocks.find(s => s.symbol === trade.s);
                if (asset) {
                    asset.price = trade.p;
                    if (asset.prevPrice) {
                        const change = ((asset.price - asset.prevPrice) / asset.prevPrice) * 100;
                        asset.change = parseFloat(change.toFixed(2));
                    }
                }
            });
        }
    } catch (e) { /* Ignore */ }
});


// ==========================================
// 3. HISTORICAL DATA FUNCTIONS (ROBUST)
// ==========================================
async function fetchBinanceHistory(symbol, days) {
    try {
        let interval = '1d';
        let limit = days;
        if (days <= 7) { interval = '4h'; limit = days * 6; }

        const pair = `${symbol.toUpperCase()}USDT`;
        const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;

        const response = await axios.get(url);
        return response.data.map(candle => ({
            date: new Date(candle[0]).toISOString().split('T')[0],
            close: parseFloat(candle[4]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3])
        }));
    } catch (error) {
        throw new Error('Failed to fetch crypto history');
    }
}

async function fetchFinnhubHistory(symbol, days) {
    try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (days * 86400);
        const resolution = days > 60 ? 'D' : '60';

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;

        const response = await axios.get(url);
        const data = response.data;

        if (data.s === 'ok' && data.c && data.t) {
            return data.t.map((timestamp, index) => ({
                date: new Date(timestamp * 1000).toISOString().split('T')[0],
                close: data.c[index],
                open: data.o[index],
                high: data.h[index],
                low: data.l[index]
            }));
        } else if (data.s === 'no_data') {
            return [];
        }
        throw new Error('Finnhub returned error status');
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.warn(`Finnhub 403 Forbidden for ${symbol}. Key might be invalid or restricted.`);
        }
        throw error;
    }
}

async function fetchAlphaVantageHistory(symbol, days) {
    try {
        const url = 'https://www.alphavantage.co/query';
        const response = await axios.get(url, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: symbol,
                outputsize: days > 100 ? 'full' : 'compact',
                apikey: ALPHA_VANTAGE_KEY
            },
            timeout: 10000
        });

        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries) return [];

        return Object.entries(timeSeries)
            .map(([date, values]) => ({
                date: date,
                close: parseFloat(values['4. close']),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low'])
            }))
            .slice(0, days)
            .reverse();
    } catch (error) {
        console.error(`Alpha Vantage error for ${symbol}:`, error.message);
        return [];
    }
}

async function fetchCoinGeckoHistory(symbol, days) {
    try {
        // Map common symbols to CoinGecko IDs
        const map = {
            'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'BNB': 'binancecoin',
            'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2',
            'DOT': 'polkadot', 'MATIC': 'matic-network', 'LINK': 'chainlink', 'UNI': 'uniswap'
        };
        const id = map[symbol.toUpperCase()];
        if (!id) throw new Error('Symbol not mapped');

        const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
        const response = await axios.get(url);

        return response.data.prices.map(p => ({
            date: new Date(p[0]).toISOString().split('T')[0],
            close: p[1],
            open: p[1], // CoinGecko doesn't provide OHLC in this endpoint, only prices
            high: p[1],
            low: p[1]
        }));
    } catch (error) {
        throw new Error('CoinGecko fetch failed');
    }
}

function generateMockHistoricalData(symbol, days) {
    let basePrice = 100;
    let found = false;

    // Try to find current price from active market data
    const allAssets = [...marketData.crypto, ...marketData.stocks, ...marketData.commodities];
    const asset = allAssets.find(a => a.symbol.toUpperCase() === symbol.trim().toUpperCase());

    if (asset && asset.price) {
        basePrice = asset.price;
        found = true;
    } else {
        console.warn(`⚠️ Mock Gen: Asset ${symbol} not found in live data. Using default $100.`);
    }

    const data = [];
    let price = basePrice;
    const today = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Add some volatility
        const volatility = 0.02; // 2% daily volatility
        const change = (Math.random() - 0.5) * volatility;
        price = price * (1 + change);

        data.push({
            date: date.toISOString().split('T')[0],
            close: price,
            open: price * (1 + (Math.random() - 0.5) * 0.01),
            high: price * (1 + Math.random() * 0.015),
            low: price * (1 - Math.random() * 0.015)
        });
    }
    return data;
}

async function getHistoricalData(symbol, type, days) {
    const cacheKey = `${symbol}-${type}-${days}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let data = [];

    // Priority 1: Primary API
    try {
        if (type === 'crypto') {
            try {
                data = await fetchBinanceHistory(symbol, days);
            } catch (binanceErr) {
                console.warn(`Binance failed for ${symbol}, trying CoinGecko...`);
                data = await fetchCoinGeckoHistory(symbol, days);
            }
        } else {
            // Try Finnhub first, then Alpha Vantage
            try {
                data = await fetchFinnhubHistory(symbol, days);
            } catch (err) {
                console.warn(`Finnhub failed for ${symbol}, switching to Alpha Vantage...`);
                data = await fetchAlphaVantageHistory(symbol, days);
            }
        }
    } catch (err) {
        console.error(`All APIs failed for ${symbol}:`, err.message);
    }

    // Priority 2: Mock Data (Last Resort)
    if (!data || data.length === 0) {
        console.log(`Generating mock data for ${symbol}`);
        data = generateMockHistoricalData(symbol, days);
    } else {
        cache.set(cacheKey, data, 300);
    }

    return data;
}

// COMMODITIES POLLING
async function updateCommodities() {
    console.log('🔄 Updating Commodities...');

    // Alpha Vantage Symbols: GOLD -> GC=F, SILVER -> SI=F, OIL -> CL=F
    // Or use Finnhub if available (often requires paid tier for commodities)

    const commoditiesMap = {
        'GOLD': 'GC=F',
        'SILVER': 'SI=F',
        'CL': 'CL=F'
    };

    for (const commodity of marketData.commodities) {
        try {
            // Using Alpha Vantage Global Quote or Finnhub fallback
            // Try Finnhub quote first as it's faster if accessible
            try {
                // Mapping for Finnhub OANDA symbols
                const finnhubSymbol = commodity.symbol === 'GOLD' ? 'OANDA:XAU_USD' :
                    commodity.symbol === 'SILVER' ? 'OANDA:XAG_USD' :
                        'OANDA:WTICO_USD';

                const url = `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_KEY}`;
                const response = await axios.get(url);

                if (response.data && response.data.c > 0) {
                    commodity.price = response.data.c;
                    commodity.change = response.data.dp; // dp is percent change
                    console.log(`✅ Updated ${commodity.symbol}: $${commodity.price}`);
                    continue; // Success, skip fallback
                }
            } catch (err) {
                // Finnhub failed, try Alpha Vantage
            }

            // Fallback: Add mock volatility to keep it alive if API fails
            const volatility = 0.005; // 0.5% volatility
            const change = (Math.random() - 0.5) * volatility;
            commodity.price = Math.round(commodity.price * (1 + change) * 100) / 100;

        } catch (error) {
            console.error(`Error updating commodity ${commodity.symbol}:`, error.message);
        }
    }
}

// Start polling commodities every 2 minutes
setInterval(updateCommodities, 120000);
// Initial update after 5 seconds
setTimeout(updateCommodities, 5000);


// ==========================================
// 4. API ENDPOINTS
// ==========================================
app.get('/api/historical/:type/:symbol', async (req, res) => {
    try {
        const { type, symbol } = req.params;
        const days = parseInt(req.query.days) || 90;

        // Try getting real data
        const data = await getHistoricalData(symbol, type, days);

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        // Even on error, try sending mock data so frontend doesn't break
        console.error(`Error fetching ${req.params.symbol}, defaulting to mock:`, error.message);
        const mock = generateMockHistoricalData(req.params.symbol, parseInt(req.query.days) || 90);
        res.json({ success: true, count: mock.length, data: mock });
    }
});


// ==========================================
// 5. SERVER STARTUP & WEBSOCKET BROADCAST
// ==========================================
const server = app.listen(PORT, () => {
    console.log(`\n🚀 HMS Consolidated Server running on http://localhost:${PORT}`);
    console.log('  Endpoints:');
    console.log('  GET /api/historical/:type/:symbol?days=30');
    console.log('  WS  ws://localhost:' + PORT);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('👤 Frontend client connected');
    ws.send(JSON.stringify({
        type: 'initial',
        timestamp: Date.now(),
        data: marketData
    }));
});

// Broadcast loop
setInterval(() => {
    const update = {
        type: 'update',
        timestamp: Date.now(),
        marketStatus: { stocks: true, crypto: true, commodities: true },
        data: marketData
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
        }
    });
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    binanceWs.terminate();
    finnhubWs.terminate();
    wss.close();
    server.close();
    process.exit(0);
});
