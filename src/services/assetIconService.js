/**
 * Asset Icon Service
 * Provides logo URLs for crypto, stocks, and commodities using free CDNs.
 * - Crypto: CoinCap / CryptoFonts (no API key)
 * - Stocks: logo.clearbit.com (no API key)
 * - Commodities: hardcoded emoji/SVG fallback
 */

// ─── Crypto: CoinCap assets API (free, no key) ──────────────
const CRYPTO_ICON_IDS = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    LINK: 'chainlink',
    UNI: 'uniswap',
    USDT: 'tether',
    USDC: 'usd-coin',
    SHIB: 'shiba-inu',
    LTC: 'litecoin',
    BCH: 'bitcoin-cash',
    ATOM: 'cosmos',
    FIL: 'filecoin',
    NEAR: 'near',
    ARB: 'arbitrum',
    OP: 'optimism',
    APT: 'aptos',
    TRX: 'tron',
    TON: 'the-open-network',
    AAVE: 'aave',
    ETC: 'ethereum-classic',
    XLM: 'stellar',
    ALGO: 'algorand',
    SAND: 'the-sandbox',
    MANA: 'decentraland',
    ICP: 'internet-computer',
    VET: 'vechain',
    GRT: 'the-graph',
    FTM: 'fantom',
    EOS: 'eos',
    HBAR: 'hedera-hashgraph',
    THETA: 'theta-token',
    FLOW: 'flow',
    XMR: 'monero',
    CAKE: 'pancakeswap-token',
    CHZ: 'chiliz',
    AXS: 'axie-infinity',
    ZEC: 'zcash',
    WBTC: 'wrapped-bitcoin',
    DAI: 'dai',
    QNT: 'quant-network',
    XTZ: 'tezos',
};

// ─── Stocks: Clearbit Logo API (domain-based, free) ─────────
const STOCK_DOMAINS = {
    AAPL: 'apple.com',
    MSFT: 'microsoft.com',
    GOOGL: 'google.com',
    AMZN: 'amazon.com',
    NVDA: 'nvidia.com',
    META: 'meta.com',
    TSLA: 'tesla.com',
    'BRK.B': 'berkshirehathaway.com',
    JPM: 'jpmorganchase.com',
    V: 'visa.com',
    WMT: 'walmart.com',
    MA: 'mastercard.com',
    JNJ: 'jnj.com',
    PG: 'pg.com',
    UNH: 'unitedhealthgroup.com',
    HD: 'homedepot.com',
    DIS: 'disney.com',
    NFLX: 'netflix.com',
    INTC: 'intel.com',
    AMD: 'amd.com',
    CRM: 'salesforce.com',
    PYPL: 'paypal.com',
    ADBE: 'adobe.com',
    CSCO: 'cisco.com',
    PEP: 'pepsico.com',
    KO: 'coca-cola.com',
    COST: 'costco.com',
    ABBV: 'abbvie.com',
    MRK: 'merck.com',
    PFE: 'pfizer.com',
    BA: 'boeing.com',
    IBM: 'ibm.com',
};

// ─── Commodities: hardcoded icon mapping ─────────────────────
const COMMODITY_ICONS = {
    GOLD: '🥇',
    SILVER: '🥈',
    CL: '🛢️',
    NG: '🔥',
    COPPER: '🔶',
    PLATINUM: '💎',
    WHEAT: '🌾',
    CORN: '🌽',
    COFFEE: '☕',
};

/**
 * Get the icon URL for an asset
 * @param {string} symbol - Asset symbol (e.g., 'BTC', 'AAPL', 'GOLD')
 * @param {string} market - Market type ('crypto', 'stocks', 'commodities')
 * @returns {{ type: 'url'|'emoji', value: string }}
 */
export function getAssetIcon(symbol, market) {
    const upperSymbol = symbol?.toUpperCase();

    if (market === 'crypto') {
        const coinId = CRYPTO_ICON_IDS[upperSymbol];
        if (coinId) {
            return {
                type: 'url',
                value: `https://assets.coingecko.com/coins/images/1/small/${coinId}.png`,
                // Use the CryptoFonts CDN which uses symbol directly — more reliable
                fallback: `https://cryptofonts.com/img/icons/${coinId}.svg`
            };
        }
    }

    if (market === 'stocks') {
        const domain = STOCK_DOMAINS[upperSymbol];
        if (domain) {
            return {
                type: 'url',
                value: `https://logo.clearbit.com/${domain}`,
                fallback: null
            };
        }
    }

    if (market === 'commodities') {
        const emoji = COMMODITY_ICONS[upperSymbol];
        if (emoji) {
            return { type: 'emoji', value: emoji };
        }
    }

    // Fallback: generate a color avatar from the symbol
    return { type: 'letter', value: (upperSymbol || '?').charAt(0) };
}

/**
 * Get crypto icon URL directly (convenience helper)
 */
export function getCryptoIconUrl(symbol) {
    const coinId = CRYPTO_ICON_IDS[symbol?.toUpperCase()];
    if (!coinId) return null;
    return `https://cryptofonts.com/img/icons/${coinId}.svg`;
}

/**
 * Get stock icon URL directly (convenience helper)
 */
export function getStockIconUrl(symbol) {
    const domain = STOCK_DOMAINS[symbol?.toUpperCase()];
    if (!domain) return null;
    return `https://logo.clearbit.com/${domain}`;
}

export default { getAssetIcon, getCryptoIconUrl, getStockIconUrl };
