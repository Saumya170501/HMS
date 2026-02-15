/**
 * Portfolio Analytics Service
 * Calculate portfolio performance metrics, risk ratios, and generate charts
 */

import { getHistoricalPrices } from './historicalPriceService';
import { calculateDailyReturns, calculateCorrelation } from './analysisService';

/**
 * Calculate daily portfolio returns over a time period
 * @param {Array} holdings - Portfolio holdings
 * @param {number} days - Number of days to calculate
 * @returns {Promise<Array>} Array of {date, portfolioValue, dailyReturn}
 */
export async function calculatePortfolioReturns(holdings, days = 30) {
    if (!holdings || holdings.length === 0) {
        return [];
    }

    try {
        // Fetch historical prices for all holdings
        const historicalData = await Promise.all(
            holdings.map(async (holding) => {
                const history = await getHistoricalPrices(holding.symbol, days, holding.market);
                return {
                    symbol: holding.symbol,
                    quantity: holding.quantity,
                    history: history
                };
            })
        );

        // Find common dates across all assets
        const allDates = new Set();
        historicalData.forEach(asset => {
            asset.history.forEach(h => allDates.add(h.date.split('T')[0]));
        });
        const sortedDates = Array.from(allDates).sort();

        // Calculate portfolio value for each date
        const portfolioValues = sortedDates.map(date => {
            let totalValue = 0;

            historicalData.forEach(asset => {
                const priceData = asset.history.find(h => h.date.startsWith(date));
                if (priceData) {
                    totalValue += priceData.close * asset.quantity;
                }
            });

            return {
                date,
                portfolioValue: totalValue
            };
        }).filter(pv => pv.portfolioValue > 0);

        // Calculate daily returns
        const returns = [];
        for (let i = 1; i < portfolioValues.length; i++) {
            const prevValue = portfolioValues[i - 1].portfolioValue;
            const currValue = portfolioValues[i].portfolioValue;
            const dailyReturn = (currValue - prevValue) / prevValue;

            returns.push({
                date: portfolioValues[i].date,
                portfolioValue: currValue,
                dailyReturn: dailyReturn
            });
        }

        return returns;
    } catch (error) {
        console.error('Failed to calculate portfolio returns:', error);
        return [];
    }
}

/**
 * Calculate Sharpe Ratio
 * @param {Array} returns - Array of daily returns (decimals)
 * @param {number} riskFreeRate - Annual risk-free rate (default 2%)
 * @returns {number} Sharpe ratio
 */
export function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    if (!returns || returns.length < 2) {
        return 0;
    }

    // Extract daily return values
    const dailyReturns = returns.map(r => r.dailyReturn || r);

    // Calculate average return
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    // Calculate standard deviation
    const variance = dailyReturns.reduce((sum, r) => {
        return sum + Math.pow(r - avgReturn, 2);
    }, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Convert annual risk-free rate to daily
    const dailyRiskFreeRate = riskFreeRate / 252; // 252 trading days

    // Annualize returns and std dev
    const annualizedReturn = avgReturn * 252;
    const annualizedStdDev = stdDev * Math.sqrt(252);

    // Calculate Sharpe Ratio
    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedStdDev;

    return Math.round(sharpeRatio * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate portfolio volatility (30-day annualized)
 * @param {Array} returns - Array of daily returns
 * @returns {number} Volatility percentage
 */
export function calculateVolatility(returns) {
    if (!returns || returns.length < 2) {
        return 0;
    }

    const dailyReturns = returns.map(r => r.dailyReturn || r);

    // Calculate standard deviation
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => {
        return sum + Math.pow(r - avgReturn, 2);
    }, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    // Annualize volatility
    const annualizedVolatility = stdDev * Math.sqrt(252);

    return Math.round(annualizedVolatility * 1000) / 10; // Return as percentage
}

/**
 * Calculate Beta (vs market proxy like SPY)
 * @param {Array} portfolioReturns - Portfolio daily returns
 * @param {Array} marketReturns - Market daily returns (SPY or similar)
 * @returns {number} Beta value
 */
export async function calculateBeta(portfolioReturns, marketSymbol = 'SPY', days = 90) {
    if (!portfolioReturns || portfolioReturns.length < 2) {
        return 1.0; // Default to market beta
    }

    try {
        // Fetch market returns
        const marketHistory = await getHistoricalPrices(marketSymbol, days, 'stocks');
        const marketPrices = marketHistory.map(h => h.close);
        const marketDailyReturns = calculateDailyReturns(marketPrices);

        // Extract portfolio daily returns
        const portfolioDailyReturns = portfolioReturns.map(r => r.dailyReturn || r);

        // Align arrays (take minimum length)
        const minLength = Math.min(portfolioDailyReturns.length, marketDailyReturns.length);
        const alignedPortfolio = portfolioDailyReturns.slice(-minLength);
        const alignedMarket = marketDailyReturns.slice(-minLength);

        // Calculate covariance and variance
        const portfolioMean = alignedPortfolio.reduce((sum, r) => sum + r, 0) / alignedPortfolio.length;
        const marketMean = alignedMarket.reduce((sum, r) => sum + r, 0) / alignedMarket.length;

        let covariance = 0;
        let marketVariance = 0;

        for (let i = 0; i < alignedPortfolio.length; i++) {
            covariance += (alignedPortfolio[i] - portfolioMean) * (alignedMarket[i] - marketMean);
            marketVariance += Math.pow(alignedMarket[i] - marketMean, 2);
        }

        covariance /= alignedPortfolio.length;
        marketVariance /= alignedMarket.length;

        if (marketVariance === 0) return 1.0;

        const beta = covariance / marketVariance;

        return Math.round(beta * 100) / 100; // Round to 2 decimals
    } catch (error) {
        console.error('Failed to calculate beta:', error);
        return 1.0; // Default to market beta on error
    }
}

/**
 * Generate performance chart data
 * @param {Array} holdings - Portfolio holdings
 * @param {number} days - Number of days
 * @returns {Promise<Array>} Chart data points
 */
export async function generatePerformanceChart(holdings, days = 30) {
    if (!holdings || holdings.length === 0) {
        return [];
    }

    try {
        const portfolioReturns = await calculatePortfolioReturns(holdings, days);

        if (portfolioReturns.length === 0) {
            return [];
        }

        // Generate benchmark (use initial value with slight variation)
        const initialValue = portfolioReturns[0].portfolioValue;

        return portfolioReturns.map((point, index) => ({
            day: `Day ${index + 1}`,
            date: point.date,
            value: Math.round(point.portfolioValue),
            benchmark: Math.round(initialValue * (1 + (Math.random() - 0.5) * 0.02))
        }));
    } catch (error) {
        console.error('Failed to generate performance chart:', error);
        return [];
    }
}

/**
 * Calculate correlation matrix for portfolio holdings
 * @param {Array} holdings - Portfolio holdings
 * @param {number} days - Lookback period
 * @returns {Promise<Array>} Correlation matrix data
 */
export async function calculateCorrelationMatrix(holdings, days = 90) {
    if (!holdings || holdings.length < 2) {
        return [];
    }

    try {
        // Fetch historical data for all holdings
        const historicalData = await Promise.all(
            holdings.map(async (holding) => {
                const history = await getHistoricalPrices(holding.symbol, days, holding.market);
                return {
                    symbol: holding.symbol,
                    prices: history.map(h => h.close),
                    returns: calculateDailyReturns(history.map(h => h.close))
                };
            })
        );

        // Calculate correlations between all pairs
        const correlations = [];

        for (let i = 0; i < historicalData.length; i++) {
            for (let j = 0; j < historicalData.length; j++) {
                const asset1 = historicalData[i];
                const asset2 = historicalData[j];

                const correlation = i === j ? 1.0 : calculateCorrelation(asset1.returns, asset2.returns);

                correlations.push({
                    asset1: asset1.symbol,
                    asset2: asset2.symbol,
                    correlation: typeof correlation === 'number' ? correlation : 0,
                    row: i,
                    col: j
                });
            }
        }

        return correlations;
    } catch (error) {
        console.error('Failed to calculate correlation matrix:', error);
        return [];
    }
}

/**
 * Get portfolio summary statistics
 * @param {Object} portfolio - Portfolio object
 * @returns {Object} Summary stats
 */
export function getPortfolioSummary(portfolio) {
    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        return {
            totalHoldings: 0,
            totalValue: 0,
            totalCost: 0,
            totalGainLoss: 0,
            totalReturn: 0,
            bestPerformer: null,
            worstPerformer: null
        };
    }

    const best = portfolio.holdings.reduce((max, h) =>
        h.gainLossPercent > (max?.gainLossPercent || -Infinity) ? h : max, null);

    const worst = portfolio.holdings.reduce((min, h) =>
        h.gainLossPercent < (min?.gainLossPercent || Infinity) ? h : min, null);

    return {
        totalHoldings: portfolio.holdings.length,
        totalValue: portfolio.totalValue,
        totalCost: portfolio.totalCost,
        totalGainLoss: portfolio.totalGainLoss,
        totalReturn: portfolio.totalGainLossPercent,
        bestPerformer: best ? {
            symbol: best.symbol,
            return: best.gainLossPercent
        } : null,
        worstPerformer: worst ? {
            symbol: worst.symbol,
            return: worst.gainLossPercent
        } : null
    };
}
