/**
 * Portfolio Management Service
 * Handles CRUD operations for user portfolio holdings.
 * Uses Firestore for authenticated users, localStorage for guests.
 */

import { v4 as uuidv4 } from 'uuid';
import * as userDataService from './userDataService';

const PORTFOLIO_KEY = 'portfolio';

/**
 * Create empty portfolio structure
 */
function createEmptyPortfolio() {
    return {
        holdings: [],
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Get portfolio — Firestore if userId provided, localStorage otherwise
 */
export async function getPortfolio(userId) {
    if (userId) {
        return await userDataService.getPortfolio(userId);
    }
    try {
        const stored = localStorage.getItem(PORTFOLIO_KEY);
        if (!stored) return createEmptyPortfolio();
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to load portfolio:', error);
        return createEmptyPortfolio();
    }
}

/**
 * Save portfolio
 */
export async function savePortfolio(portfolio, userId) {
    portfolio.lastUpdated = new Date().toISOString();
    if (userId) {
        await userDataService.savePortfolio(userId, portfolio);
        return true;
    }
    try {
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
        return true;
    } catch (error) {
        console.error('Failed to save portfolio:', error);
        return false;
    }
}

/**
 * Add a new holding to portfolio
 */
export async function addHolding(holding, userId) {
    const portfolio = await getPortfolio(userId);

    const newHolding = {
        id: uuidv4(),
        symbol: holding.symbol,
        name: holding.name,
        market: holding.market,
        quantity: parseFloat(holding.quantity),
        purchasePrice: parseFloat(holding.purchasePrice),
        purchaseDate: holding.purchaseDate || new Date().toISOString().split('T')[0],
        currentPrice: parseFloat(holding.currentPrice || holding.purchasePrice),
        totalValue: 0,
        totalCost: 0,
        gainLoss: 0,
        gainLossPercent: 0
    };

    newHolding.totalCost = newHolding.quantity * newHolding.purchasePrice;
    newHolding.totalValue = newHolding.quantity * newHolding.currentPrice;
    newHolding.gainLoss = newHolding.totalValue - newHolding.totalCost;
    newHolding.gainLossPercent = (newHolding.gainLoss / newHolding.totalCost) * 100;

    portfolio.holdings.push(newHolding);
    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, userId);

    return portfolio;
}

/**
 * Remove holding from portfolio
 */
export async function removeHolding(holdingId, userId) {
    const portfolio = await getPortfolio(userId);
    portfolio.holdings = portfolio.holdings.filter(h => h.id !== holdingId);
    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, userId);
    return portfolio;
}

/**
 * Update an existing holding
 */
export async function updateHolding(holdingId, updates, userId) {
    const portfolio = await getPortfolio(userId);
    const holding = portfolio.holdings.find(h => h.id === holdingId);

    if (!holding) {
        throw new Error(`Holding ${holdingId} not found`);
    }

    Object.assign(holding, updates);
    holding.totalCost = holding.quantity * holding.purchasePrice;
    holding.totalValue = holding.quantity * holding.currentPrice;
    holding.gainLoss = holding.totalValue - holding.totalCost;
    holding.gainLossPercent = holding.totalCost > 0
        ? (holding.gainLoss / holding.totalCost) * 100
        : 0;

    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, userId);
    return portfolio;
}

/**
 * Update current prices for all holdings
 */
export async function updateCurrentPrices(priceUpdates, userId) {
    const portfolio = await getPortfolio(userId);
    const priceMap = new Map(priceUpdates.map(p => [p.symbol, p.currentPrice]));

    portfolio.holdings.forEach(holding => {
        if (priceMap.has(holding.symbol)) {
            holding.currentPrice = priceMap.get(holding.symbol);
            holding.totalValue = holding.quantity * holding.currentPrice;
            holding.gainLoss = holding.totalValue - holding.totalCost;
            holding.gainLossPercent = holding.totalCost > 0
                ? (holding.gainLoss / holding.totalCost) * 100
                : 0;
        }
    });

    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, userId);
    return portfolio;
}

/**
 * Calculate portfolio-level metrics
 */
export function calculatePortfolioMetrics(portfolio) {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
        portfolio.totalValue = 0;
        portfolio.totalCost = 0;
        portfolio.totalGainLoss = 0;
        portfolio.totalGainLossPercent = 0;
        return;
    }

    portfolio.totalValue = portfolio.holdings.reduce((sum, h) => sum + h.totalValue, 0);
    portfolio.totalCost = portfolio.holdings.reduce((sum, h) => sum + h.totalCost, 0);
    portfolio.totalGainLoss = portfolio.totalValue - portfolio.totalCost;
    portfolio.totalGainLossPercent = portfolio.totalCost > 0
        ? (portfolio.totalGainLoss / portfolio.totalCost) * 100
        : 0;
}

/**
 * Fetch current prices from API and update portfolio
 */
export async function refreshPortfolioPrices(apiManager, userId) {
    const portfolio = await getPortfolio(userId);

    if (!portfolio.holdings || portfolio.holdings.length === 0) {
        return portfolio;
    }

    try {
        const byMarket = portfolio.holdings.reduce((acc, h) => {
            if (!acc[h.market]) acc[h.market] = [];
            acc[h.market].push(h.symbol);
            return acc;
        }, {});

        const priceUpdates = [];

        for (const [market, symbols] of Object.entries(byMarket)) {
            const marketData = await apiManager.getMarketData(market);
            symbols.forEach(symbol => {
                const asset = marketData.find(a => a.symbol === symbol);
                if (asset) {
                    priceUpdates.push({
                        symbol: asset.symbol,
                        currentPrice: asset.price
                    });
                }
            });
        }

        return await updateCurrentPrices(priceUpdates, userId);
    } catch (error) {
        console.error('Failed to refresh portfolio prices:', error);
        return portfolio;
    }
}

/**
 * Get holdings for a specific market
 */
export async function getHoldingsByMarket(market, userId) {
    const portfolio = await getPortfolio(userId);
    return portfolio.holdings.filter(h => h.market === market);
}

/**
 * Get total value by market
 */
export async function getValueByMarket(userId) {
    const portfolio = await getPortfolio(userId);
    return portfolio.holdings.reduce((acc, h) => {
        if (!acc[h.market]) acc[h.market] = 0;
        acc[h.market] += h.totalValue;
        return acc;
    }, {});
}

/**
 * Clear entire portfolio
 */
export async function clearPortfolio(userId) {
    const empty = createEmptyPortfolio();
    await savePortfolio(empty, userId);
    return empty;
}
