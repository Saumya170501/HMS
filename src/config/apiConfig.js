// API Configuration
// These should be moved to environment variables in production

export const API_KEYS = {
    ALPHA_VANTAGE: 'F7PBBII9P5SH1GSJ',
    NDAX_API: 'a45c87307e96b560ae24e3b63bec7980',
    NDAX_SECRET: '56bce7d5abd64ec2ac92b5fa7a1cc8aa',
};

export const API_ENDPOINTS = {
    ALPHA_VANTAGE: 'https://www.alphavantage.co/query',
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
    COMMODITIES: {
        maxCalls: 100,
        perMonth: 1,
    },
};
