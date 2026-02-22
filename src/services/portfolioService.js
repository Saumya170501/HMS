/**
 * Portfolio Management Service — Subcollection-based
 * Each holding is a separate Firestore document in users/{userId}/portfolio/{holdingId}
 * Uses localStorage for guest users (no userId).
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase';
import {
    collection, doc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch
} from 'firebase/firestore';

const PORTFOLIO_KEY = 'portfolio';

// ─── Helpers ─────────────────────────────────────────────────

function getPortfolioCol(userId) {
    return collection(db, 'users', userId, 'portfolio');
}

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

function calculateHoldingMetrics(holding) {
    holding.totalCost = holding.quantity * holding.purchasePrice;
    holding.totalValue = holding.quantity * holding.currentPrice;
    holding.gainLoss = holding.totalValue - holding.totalCost;
    holding.gainLossPercent = holding.totalCost > 0
        ? (holding.gainLoss / holding.totalCost) * 100
        : 0;
    return holding;
}

// ─── Core Operations ─────────────────────────────────────────

/**
 * Get portfolio — Firestore subcollection if userId provided, localStorage otherwise
 */
export async function getPortfolio(userId) {
    if (userId) {
        try {
            const snapshot = await getDocs(getPortfolioCol(userId));
            const holdings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const portfolio = {
                holdings,
                totalValue: 0,
                totalCost: 0,
                totalGainLoss: 0,
                totalGainLossPercent: 0,
                lastUpdated: new Date().toISOString()
            };
            calculatePortfolioMetrics(portfolio);
            return portfolio;
        } catch (error) {
            console.error('Failed to load portfolio from Firestore:', error);
            return createEmptyPortfolio();
        }
    }
    // Guest fallback — localStorage
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
 * For Firestore: writes each holding as a separate doc.
 * For guests: writes entire portfolio to localStorage.
 */
export async function savePortfolio(portfolio, userId) {
    portfolio.lastUpdated = new Date().toISOString();
    if (userId) {
        try {
            // Batch write all holdings
            const batch = writeBatch(db);
            const colRef = getPortfolioCol(userId);

            // First, delete all existing holdings
            const existing = await getDocs(colRef);
            existing.docs.forEach(d => batch.delete(d.ref));

            // Then write all current holdings
            for (const holding of portfolio.holdings) {
                const holdingRef = doc(colRef, holding.id);
                batch.set(holdingRef, { ...holding });
            }

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Failed to save portfolio to Firestore:', error);
            return false;
        }
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

    calculateHoldingMetrics(newHolding);

    if (userId) {
        try {
            const holdingRef = doc(db, 'users', userId, 'portfolio', newHolding.id);
            await setDoc(holdingRef, newHolding);
            // Return full portfolio for consistency
            return await getPortfolio(userId);
        } catch (error) {
            console.error('Failed to add holding:', error);
            throw error;
        }
    }

    // Guest fallback
    const portfolio = await getPortfolio(null);
    portfolio.holdings.push(newHolding);
    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, null);
    return portfolio;
}

/**
 * Remove holding from portfolio
 */
export async function removeHolding(holdingId, userId) {
    if (userId) {
        try {
            const holdingRef = doc(db, 'users', userId, 'portfolio', holdingId);
            await deleteDoc(holdingRef);
            return await getPortfolio(userId);
        } catch (error) {
            console.error('Failed to remove holding:', error);
            throw error;
        }
    }

    const portfolio = await getPortfolio(null);
    portfolio.holdings = portfolio.holdings.filter(h => h.id !== holdingId);
    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, null);
    return portfolio;
}

/**
 * Update an existing holding
 */
export async function updateHolding(holdingId, updates, userId) {
    if (userId) {
        try {
            const holdingRef = doc(db, 'users', userId, 'portfolio', holdingId);
            // Get current holding, merge updates, recalculate metrics
            const portfolio = await getPortfolio(userId);
            const holding = portfolio.holdings.find(h => h.id === holdingId);
            if (!holding) throw new Error(`Holding ${holdingId} not found`);

            Object.assign(holding, updates);
            calculateHoldingMetrics(holding);
            await setDoc(holdingRef, holding);
            return await getPortfolio(userId);
        } catch (error) {
            console.error('Failed to update holding:', error);
            throw error;
        }
    }

    const portfolio = await getPortfolio(null);
    const holding = portfolio.holdings.find(h => h.id === holdingId);
    if (!holding) throw new Error(`Holding ${holdingId} not found`);

    Object.assign(holding, updates);
    calculateHoldingMetrics(holding);
    calculatePortfolioMetrics(portfolio);
    await savePortfolio(portfolio, null);
    return portfolio;
}

/**
 * Update current prices for all holdings
 */
export async function updateCurrentPrices(priceUpdates, userId) {
    const portfolio = await getPortfolio(userId);
    const priceMap = new Map(priceUpdates.map(p => [p.symbol, p.currentPrice]));
    let hasUpdates = false;

    portfolio.holdings.forEach(holding => {
        if (priceMap.has(holding.symbol)) {
            holding.currentPrice = priceMap.get(holding.symbol);
            calculateHoldingMetrics(holding);
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        calculatePortfolioMetrics(portfolio);

        if (userId) {
            // Batch update only changed holdings
            try {
                const batch = writeBatch(db);
                portfolio.holdings.forEach(holding => {
                    if (priceMap.has(holding.symbol)) {
                        const ref = doc(db, 'users', userId, 'portfolio', holding.id);
                        batch.set(ref, holding);
                    }
                });
                await batch.commit();
            } catch (error) {
                console.error('Failed to batch update prices:', error);
            }
        } else {
            await savePortfolio(portfolio, null);
        }
    }

    return portfolio;
}

/**
 * Calculate portfolio-level metrics from holdings array
 */
export function calculatePortfolioMetrics(portfolio) {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
        portfolio.totalValue = 0;
        portfolio.totalCost = 0;
        portfolio.totalGainLoss = 0;
        portfolio.totalGainLossPercent = 0;
        return;
    }

    portfolio.totalValue = portfolio.holdings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
    portfolio.totalCost = portfolio.holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0);
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
    if (userId) {
        try {
            const batch = writeBatch(db);
            const snapshot = await getDocs(getPortfolioCol(userId));
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (error) {
            console.error('Failed to clear portfolio:', error);
        }
    }
    const empty = createEmptyPortfolio();
    if (!userId) {
        await savePortfolio(empty, null);
    }
    return empty;
}
