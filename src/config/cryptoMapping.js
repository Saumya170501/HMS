/**
 * Cryptocurrency Symbol to CoinGecko ID Mapping
 * Maps common crypto symbols (BTC, ETH, etc.) to CoinGecko API IDs
 */

export const CRYPTO_SYMBOL_TO_ID = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'TRX': 'tron',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'TON': 'the-open-network',
    'WBTC': 'wrapped-bitcoin',
    'ICP': 'internet-computer',
    'SHIB': 'shiba-inu',
    'DAI': 'dai',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'ETC': 'ethereum-classic',
    'XLM': 'stellar',
    'FIL': 'filecoin',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'APT': 'aptos',
    'NEAR': 'near',
    'VET': 'vechain',
    'ALGO': 'algorand',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'XTZ': 'tezos',
    'AAVE': 'aave',
    'GRT': 'the-graph',
    'EOS': 'eos',
    'FTM': 'fantom',
    'AXS': 'axie-infinity',
    'XMR': 'monero',
    'THETA': 'theta-token',
    'FLOW': 'flow',
    'EGLD': 'elrond-egd-2',
    'BSV': 'bitcoin-sv',
    'HBAR': 'hedera-hashgraph',
    'QNT': 'quant-network',
    'CHZ': 'chiliz',
    'CAKE': 'pancakeswap-token',
    'ZEC': 'zcash',
    'KLAY': 'klay-token',
};

/**
 * Reverse mapping: CoinGecko ID to Symbol
 */
export const CRYPTO_ID_TO_SYMBOL = Object.fromEntries(
    Object.entries(CRYPTO_SYMBOL_TO_ID).map(([symbol, id]) => [id, symbol])
);

/**
 * Get CoinGecko ID from symbol
 * @param {string} symbol - Crypto symbol (e.g., 'BTC')
 * @returns {string|null} CoinGecko ID or null if not found
 */
export function getCoinGeckoId(symbol) {
    const upperSymbol = symbol?.toUpperCase();
    return CRYPTO_SYMBOL_TO_ID[upperSymbol] || null;
}

/**
 * Get symbol from CoinGecko ID
 * @param {string} id - CoinGecko ID (e.g., 'bitcoin')
 * @returns {string|null} Symbol or null if not found
 */
export function getSymbolFromId(id) {
    return CRYPTO_ID_TO_SYMBOL[id?.toLowerCase()] || null;
}

/**
 * Check if symbol has a CoinGecko mapping
 * @param {string} symbol - Crypto symbol
 * @returns {boolean}
 */
export function hasMapping(symbol) {
    return getCoinGeckoId(symbol) !== null;
}

/**
 * Get popular crypto coins for market data
 * Returns array of CoinGecko IDs for top coins
 */
export const POPULAR_CRYPTO_IDS = [
    'bitcoin',
    'ethereum',
    'tether',
    'binancecoin',
    'solana',
    'ripple',
    'usd-coin',
    'cardano',
    'avalanche-2',
    'dogecoin',
    'polkadot',
    'tron',
    'chainlink',
    'matic-network',
    'the-open-network',
];

/**
 * Popular crypto symbols for quick reference
 */
export const POPULAR_CRYPTO_SYMBOLS = POPULAR_CRYPTO_IDS.map(id => getSymbolFromId(id)).filter(Boolean);

export default {
    CRYPTO_SYMBOL_TO_ID,
    CRYPTO_ID_TO_SYMBOL,
    getCoinGeckoId,
    getSymbolFromId,
    hasMapping,
    POPULAR_CRYPTO_IDS,
    POPULAR_CRYPTO_SYMBOLS,
};
