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
        { id: 'btc', symbol: 'BTC', name: 'Bitcoin', marketCap: 1200000000000, price: 67500, change: 0, prevPrice: 67200 },
        { id: 'eth', symbol: 'ETH', name: 'Ethereum', marketCap: 380000000000, price: 3450, change: 0, prevPrice: 3480 },
        { id: 'sol', symbol: 'SOL', name: 'Solana', marketCap: 78000000000, price: 175, change: 0, prevPrice: 170 },
        { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', marketCap: 85000000000, price: 580, change: 0, prevPrice: 575 },
        { id: 'xrp', symbol: 'XRP', name: 'Ripple', marketCap: 65000000000, price: 0.62, change: 0, prevPrice: 0.61 },
        { id: 'ada', symbol: 'ADA', name: 'Cardano', marketCap: 45000000000, price: 0.65, change: 0, prevPrice: 0.66 },
        { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', marketCap: 42000000000, price: 0.18, change: 0, prevPrice: 0.19 },
        { id: 'avax', symbol: 'AVAX', name: 'Avalanche', marketCap: 38000000000, price: 42, change: 0, prevPrice: 41 },
        { id: 'dot', symbol: 'DOT', name: 'Polkadot', marketCap: 28000000000, price: 8.5, change: 0, prevPrice: 8.3 },
        { id: 'matic', symbol: 'MATIC', name: 'Polygon', marketCap: 25000000000, price: 0.95, change: 0, prevPrice: 0.96 },
        { id: 'link', symbol: 'LINK', name: 'Chainlink', marketCap: 18000000000, price: 18.5, change: 0, prevPrice: 18.2 },
        { id: 'uni', symbol: 'UNI', name: 'Uniswap', marketCap: 12000000000, price: 12.8, change: 0, prevPrice: 13.0 },
    ],
    stocks: [
        { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', marketCap: 3000000000000, price: 195.5, change: 0, prevPrice: 193.0 },
        { id: 'msft', symbol: 'MSFT', name: 'Microsoft', marketCap: 2800000000000, price: 415.2, change: 0, prevPrice: 412.0 },
        { id: 'googl', symbol: 'GOOGL', name: 'Alphabet', marketCap: 1900000000000, price: 175.8, change: 0, prevPrice: 176.5 },
        { id: 'amzn', symbol: 'AMZN', name: 'Amazon', marketCap: 1800000000000, price: 185.6, change: 0, prevPrice: 184.0 },
        { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA', marketCap: 1500000000000, price: 875.4, change: 0, prevPrice: 860.0 },
        { id: 'meta', symbol: 'META', name: 'Meta Platforms', marketCap: 1200000000000, price: 505.3, change: 0, prevPrice: 510.0 },
        { id: 'tsla', symbol: 'TSLA', name: 'Tesla', marketCap: 750000000000, price: 248.9, change: 0, prevPrice: 240.0 },
        { id: 'brk-b', symbol: 'BRK.B', name: 'Berkshire Hathaway', marketCap: 780000000000, price: 412.6, change: 0, prevPrice: 415.0 },
        { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase', marketCap: 550000000000, price: 198.4, change: 0, prevPrice: 195.0 },
        { id: 'v', symbol: 'V', name: 'Visa Inc.', marketCap: 520000000000, price: 285.7, change: 0, prevPrice: 288.0 },
        { id: 'wmt', symbol: 'WMT', name: 'Walmart', marketCap: 480000000000, price: 168.3, change: 0, prevPrice: 167.0 },
        { id: 'ma', symbol: 'MA', name: 'Mastercard', marketCap: 420000000000, price: 465.2, change: 0, prevPrice: 460.0 },
    ],
    commodities: [
        { id: 'gold', symbol: 'GOLD', name: 'Gold', marketCap: 12000000000000, price: 2045.5, change: 0, prevPrice: 2030.0 },
        { id: 'silver', symbol: 'SILVER', name: 'Silver', marketCap: 1400000000000, price: 23.85, change: 0, prevPrice: 24.0 },
        { id: 'oil', symbol: 'CL', name: 'Crude Oil', marketCap: 2500000000000, price: 78.45, change: 0, prevPrice: 77.50 },
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

function generateMockHistoricalData(symbol, days) {
    let basePrice = 100;

    // Try to find current price from active market data
    const allAssets = [...marketData.crypto, ...marketData.stocks, ...marketData.commodities];
    const asset = allAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());

    if (asset && asset.price) {
        basePrice = asset.price;
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
            close: Math.round(price * 100) / 100,
            open: Math.round(price * 100) / 100,
            high: Math.round(price * 1.01 * 100) / 100,
            low: Math.round(price * 0.99 * 100) / 100
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
            data = await fetchBinanceHistory(symbol, days);
        } else {
            // Try Finnhub first, then Alpha Vantage
            try {
                data = await fetchFinnhubHistory(symbol, days);
            } catch (err) {
                console.log(`Switching to Alpha Vantage for ${symbol}...`);
                data = await fetchAlphaVantageHistory(symbol, days);
            }
        }
    } catch (err) {
        console.error(`Primary API failed for ${symbol}:`, err.message);
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
