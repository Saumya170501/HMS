// API Configuration
// These should be moved to environment variables in production

export const API_KEYS = {
    ALPHA_VANTAGE: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'F7PBBII9P5SH1GSJ',
    FINNHUB: import.meta.env.VITE_FINNHUB_API_KEY,
    COINGECKO: import.meta.env.VITE_COINGECKO_API_KEY,  // Optional
    NDAX_API: 'a45c87307e96b560ae24e3b63bec7980',
    NDAX_SECRET: '56bce7d5abd64ec2ac92b5fa7a1cc8aa',
};

export const API_ENDPOINTS = {
    ALPHA_VANTAGE: 'https://www.alphavantage.co/query',
    FINNHUB: 'https://finnhub.io/api/v1',
    COINGECKO: 'https://api.coingecko.com/api/v3',
    NDAX: 'wss://api.ndax.io/WSGateway',
    COMMODITIES: 'https://commodities-api.com/api',
};

// Rate limiting configuration
export const RATE_LIMITS = {
    ALPHA_VANTAGE: {
        maxCalls: 5,
        perMinutes: 1,
        dailyLimit: 500,
    },
    FINNHUB: {
        maxCalls: 60,
        perMinutes: 1,
    },
    COINGECKO: {
        maxCalls: 30,
        perMinutes: 1,
        monthlyLimit: 10000,
    },
    COMMODITIES: {
        maxCalls: 100,
        perMonth: 1,
    },
};
