# Finnhub API Key

To get your free Finnhub API key:

1. Go to https://finnhub.io/
2. Click "Get Free API Key"
3. Sign up with your email (instant, no credit card required)
4. Copy your API key from the dashboard

Add to your `.env` file:
```
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

**What Finnhub Provides:**
- ✅ Real-time US stock quotes (60 calls/min)
- ✅ Commodity futures (Gold, Silver, Oil, Natural Gas, Copper, etc.)
- ✅ Company profiles and historical data
- ✅ WebSocket support for live streaming

# CoinGecko API Key (Optional)

CoinGecko works without an API key, but you can get one for higher rate limits:

1. Go to https://www.coingecko.com/en/api
2. Sign up for free account
3. Get your API key from dashboard

Add to your `.env` file (optional):
```
VITE_COINGECKO_API_KEY=your_coingecko_api_key_here
```

**Note**: The free tier of CoinGecko (without API key) is sufficient for most use cases.
