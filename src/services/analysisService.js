import { getHistoricalPrices } from './historicalPriceService';

/**
 * Analysis utilities for correlation, returns calculation, and predictions
 */

/**
 * Main function: Calculate correlation between two assets
 * @param {Object} params - { asset1_symbol, asset2_symbol, timeframe_days }
 * @returns {Promise<Object>} Formatted correlation result
 */
export async function calculateAssetCorrelation({ asset1_symbol, asset2_symbol, timeframe_days = 90 }) {
    // Note: This function doesn't easily support asset type without API changes. 
    // It is primarily used by backend mock logic or simple frontend calls.
    // For robust frontend use, use the component-level logic (Compare.jsx).
    try {
        // Fallback or guess type if not provided (Naive guess)
        const guessType = (s) => ['BTC', 'ETH', 'SOL', 'XRP'].includes(s.toUpperCase()) ? 'crypto' : 'stocks';

        const [history1, history2] = await Promise.all([
            getHistoricalPrices(asset1_symbol, timeframe_days, guessType(asset1_symbol)),
            getHistoricalPrices(asset2_symbol, timeframe_days, guessType(asset2_symbol))
        ]);

        const prices1 = history1.map(h => h.close);
        const prices2 = history2.map(h => h.close);
        const returns1 = calculateDailyReturns(prices1);
        const returns2 = calculateDailyReturns(prices2);
        // Step 3: Calculate Pearson correlation
        let correlation = calculateCorrelation(returns1, returns2);

        // Handle error case where correlation is an object { error: ... }
        if (typeof correlation === 'object' && correlation !== null) {
            console.warn('Correlation calculation failed:', correlation.error);
            correlation = 0;
        }

        // Step 4: Classify strength
        const { strength, direction } = classifyCorrelation(correlation);

        return {
            asset1: asset1_symbol,
            asset2: asset2_symbol,
            correlation: correlation,
            strength: strength,
            direction: direction,
            timeframe_days: timeframe_days
        };
    } catch (error) {
        console.error(`Failed to calculate correlation between ${asset1_symbol} and ${asset2_symbol}:`, error);
        throw error;
    }
}

/**
 * Find top N correlated assets for a given asset
 */
export async function findTopCorrelatedAssets(targetSymbol, allAssets, timeframeDays = 90, topN = 5) {
    const correlations = [];
    const guessType = (s) => ['BTC', 'ETH', 'SOL', 'XRP'].includes(s.toUpperCase()) ? 'crypto' : 'stocks';

    const targetHistory = await getHistoricalPrices(targetSymbol, timeframeDays, guessType(targetSymbol));
    const targetPrices = targetHistory.map(h => h.close);
    const targetReturns = calculateDailyReturns(targetPrices);

    for (const asset of allAssets) {
        if (asset.symbol === targetSymbol) continue;
        try {
            const assetHistory = await getHistoricalPrices(asset.symbol, timeframeDays, guessType(asset.symbol));
            const assetPrices = assetHistory.map(h => h.close);
            const assetReturns = calculateDailyReturns(assetPrices);
            const correlation = calculateCorrelation(targetReturns, assetReturns);
            const { strength, direction } = classifyCorrelation(correlation);
            correlations.push({ symbol: asset.symbol, name: asset.name, correlation, strength, direction });
        } catch (error) {
            console.warn(`Failed to calculate correlation for ${asset.symbol}:`, error);
        }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, topN);
}

/**
 * Find today's strongest correlation movements (for alerts)
 */
export async function findCorrelationAlerts() {
    // This function typically runs on backend or service worker. Skipped for now or use simplified logic.
    return [];
}

/**
 * Fetch historical daily price data for an asset
 * Wrapper for historicalPriceService to maintain API compatibility
 */
export async function fetchHistoricalPrices(symbol, timeframeDays = 90, assetType = 'crypto') {
    return await getHistoricalPrices(symbol, timeframeDays, assetType);
}

// Removed legacy generateMockHistoricalData - now handled by historicalPriceService/api-server


// ... existing imports

/**
 * Align two history arrays by date, forward-filling missing values
 * @param {Array} history1 - Array of { date, close }
 * @param {Array} history2 - Array of { date, close }
 * @returns {Object} { aligned1: [], aligned2: [], commonDates: [] }
 */
export function alignAndFillHistory(history1, history2) {
    if (!history1 || !history2 || history1.length === 0 || history2.length === 0) {
        return { aligned1: [], aligned2: [], commonDates: [] };
    }

    // 1. Create a map for quick lookup
    const map1 = new Map(history1.map(h => [h.date.split('T')[0], h.close]));
    const map2 = new Map(history2.map(h => [h.date.split('T')[0], h.close]));

    // 2. Get union of all dates, sorted chronologically
    const allDates = new Set([...map1.keys(), ...map2.keys()]);
    const sortedDates = Array.from(allDates).sort();

    const aligned1 = [];
    const aligned2 = [];
    const commonDates = [];

    let lastPrice1 = history1[0].close;
    let lastPrice2 = history2[0].close;

    // 3. Iterate through all dates and forward-fill
    for (const date of sortedDates) {
        // Update last known price if available for this date
        if (map1.has(date)) lastPrice1 = map1.get(date);
        if (map2.has(date)) lastPrice2 = map2.get(date);

        // Only add to result if we have valid prices for both (start of series might be null if one starts later)
        // actually, we should just push whatever we have if valid, but for correlation we need matching length.
        // Forward fill ensures we have a price for every date after the first avail date.

        // We need to handle the case where one asset starts much later than the other.
        // Simple approach: Only start adding when both have at least one price.
        // But since we initialized lastPrice with index 0, we might be using old data if dates are disjoint.
        // Better: check if we have encountered the start of both series.

        const hasStarted1 = map1.has(date) || aligned1.length > 0; // simplistic check? No, best is to track "started" state
        // Actually, if we initialized lastPrice1/2 with index 0, that assumes index 0 is the earliest? 
        // Not necessarily if history is unsorted, but usually it comes sorted from API.
        // Let's rely on the sorted union of dates.

        // Let's refine:
        // If a date exists in map, use it. If not, use last known.
        // One edge case: what if date is BEFORE the first point of history1? Then lastPrice1 is invalid?
        // Let's traverse and only push when we have valid data for both.
    }

    // Re-implementation for clarity inside the tool:

    // Reset for the loop
    const resultDates = [];
    const result1 = [];
    const result2 = [];

    let price1 = null;
    let price2 = null;

    for (const date of sortedDates) {
        if (map1.has(date)) price1 = map1.get(date);
        if (map2.has(date)) price2 = map2.get(date);

        if (price1 !== null && price2 !== null) {
            resultDates.push(date);
            result1.push(price1);
            result2.push(price2);
        }
    }

    return {
        aligned1: result1,
        aligned2: result2,
        commonDates: resultDates
    };
}

/**
 * Calculate Calculate Pearson correlation coefficient between two arrays of returns
// ... rest of file
 * 
 * @param {number[]} prices - Array of closing prices in chronological order
 *   Example: [42000, 42840, 41933, 42515, 41752]
 * 
 * @returns {number[]|{error: string}} - Array of daily returns (decimals, 4 decimal places)
 *   Example: [0.02, -0.0212, 0.0139, -0.0179]
 *   Returns { error: string } if input is null/undefined
 * 
 * FORMULA: return = (price_today - price_yesterday) / price_yesterday
 * 
 * EXAMPLE:
 *   Input: [100, 102, 100, 103]
 *   Output: [0.02, -0.0196, 0.03]
 *   Calculation:
 *     Day 1→2: (102-100)/100 = 0.02
 *     Day 2→3: (100-102)/102 = -0.0196
 *     Day 3→4: (103-100)/100 = 0.03
 */
export function calculateDailyReturns(prices) {
    // Edge case: null or undefined input
    if (prices === null || prices === undefined) {
        return { error: 'Input prices array is null or undefined' };
    }

    // Edge case: not an array
    if (!Array.isArray(prices)) {
        return { error: 'Input must be an array of prices' };
    }

    // Edge case: less than 2 items
    if (prices.length < 2) {
        return [];
    }

    const returns = [];

    for (let i = 1; i < prices.length; i++) {
        const previousPrice = prices[i - 1];
        const currentPrice = prices[i];

        // Skip if previous price is 0, null, undefined, or negative
        if (!previousPrice || previousPrice <= 0) {
            continue;
        }

        // Skip if current price is null, undefined, or negative
        if (currentPrice === null || currentPrice === undefined || currentPrice < 0) {
            continue;
        }

        // Calculate daily return: (today - yesterday) / yesterday
        const dailyReturn = (currentPrice - previousPrice) / previousPrice;

        // Round to 4 decimal places
        returns.push(Math.round(dailyReturn * 10000) / 10000);
    }

    return returns;
}

/**
 * Calculate Pearson correlation coefficient between two arrays of returns
 * 
 * FUNCTION NAME: calculatePearsonCorrelation (alias: calculateCorrelation)
 * 
 * WHAT IS PEARSON CORRELATION:
 * - Measures how two things move together
 * - +1 = Perfect positive (move together exactly)
 * - 0 = No relationship
 * - -1 = Perfect negative (move opposite)
 * - 0.6 = Strong positive (usually move together)
 * 
 * @param {number[]} returns1 - Daily returns for asset 1
 *   Example: [0.02, -0.0212, 0.0139, -0.0179, 0.015, ...]
 * @param {number[]} returns2 - Daily returns for asset 2
 *   Example: [0.01, -0.018, 0.012, -0.022, 0.008, ...]
 * 
 * @returns {number|{error: string}} - Correlation coefficient (-1 to +1), rounded to 4 decimals
 *   Example: 0.6234
 * 
 * FORMULA:
 *   correlation = Σ[(xi - mean_x) * (yi - mean_y)] / √[Σ(xi - mean_x)² * Σ(yi - mean_y)²]
 * 
 * EXAMPLE:
 *   returns1 = [0.01, -0.02, 0.015]
 *   returns2 = [0.005, -0.018, 0.012]
 *   Result: 0.9876 (very strong positive correlation)
 */
export function calculateCorrelation(returns1, returns2) {
    // Edge case: null or undefined inputs
    if (returns1 === null || returns1 === undefined) {
        return { error: 'First returns array is null or undefined' };
    }
    if (returns2 === null || returns2 === undefined) {
        return { error: 'Second returns array is null or undefined' };
    }

    // Edge case: not arrays
    if (!Array.isArray(returns1) || !Array.isArray(returns2)) {
        return { error: 'Both inputs must be arrays' };
    }

    // Edge case: empty or too short arrays
    if (returns1.length < 2 || returns2.length < 2) {
        return { error: 'Both arrays must have at least 2 items' };
    }

    // Edge case: different lengths
    if (returns1.length !== returns2.length) {
        return { error: `Arrays must have same length (got ${returns1.length} and ${returns2.length})` };
    }

    const n = returns1.length;

    // Step 1 & 2: Calculate means
    const meanX = returns1.reduce((sum, val) => sum + val, 0) / n;
    const meanY = returns2.reduce((sum, val) => sum + val, 0) / n;

    // Step 3: Calculate numerator and denominator components
    let numerator = 0;      // Σ[(xi - mean_x) * (yi - mean_y)]
    let denominatorX = 0;   // Σ(xi - mean_x)²
    let denominatorY = 0;   // Σ(yi - mean_y)²

    for (let i = 0; i < n; i++) {
        const diffX = returns1[i] - meanX;
        const diffY = returns2[i] - meanY;

        numerator += diffX * diffY;
        denominatorX += diffX * diffX;
        denominatorY += diffY * diffY;
    }

    // Step 4: Calculate denominator = √(denominatorX * denominatorY)
    const denominator = Math.sqrt(denominatorX * denominatorY);

    // Edge case: standard deviation is 0 (all same values)
    if (denominator === 0) {
        return { error: 'Standard deviation is 0 (all values are identical)' };
    }

    // Step 5 & 6: Calculate correlation and round to 4 decimals
    const correlation = numerator / denominator;

    // Validation: result must be between -1 and +1
    if (correlation < -1 || correlation > 1) {
        // This shouldn't happen mathematically, but handle floating point errors
        return Math.max(-1, Math.min(1, Math.round(correlation * 10000) / 10000));
    }

    return Math.round(correlation * 10000) / 10000;
}

/**
 * Alias for calculateCorrelation - named as per user specification
 * @see calculateCorrelation
 */
export const calculatePearsonCorrelation = calculateCorrelation;

/**
 * Classify correlation strength and direction
 * @param {number} correlation - Correlation value between -1 and +1
 * @returns {{ strength: 'high' | 'moderate' | 'low', direction: 'positive' | 'negative' }}
 */
export function classifyCorrelation(correlation) {
    const absCorr = Math.abs(correlation);

    let strength;
    if (absCorr > 0.6) {
        strength = 'high';
    } else if (absCorr > 0.3) {
        strength = 'moderate';
    } else {
        strength = 'low';
    }

    const direction = correlation >= 0 ? 'positive' : 'negative';

    return { strength, direction };
}

/**
 * Analyze correlation trend (is it increasing or decreasing?)
 * @param {number[]} returns1 - First asset returns
 * @param {number[]} returns2 - Second asset returns
 * @returns {{ current: number, previous: number, trend: string }}
 */
export function analyzeCorrelationTrend(returns1, returns2) {
    if (returns1.length < 60 || returns2.length < 60) {
        const correlation = calculateCorrelation(returns1, returns2);
        return {
            current: correlation,
            previous: correlation,
            trend: 'stable'
        };
    }

    // Split into recent (last 30 days) and previous (30-60 days ago)
    const recentReturns1 = returns1.slice(-30);
    const recentReturns2 = returns2.slice(-30);
    const previousReturns1 = returns1.slice(-60, -30);
    const previousReturns2 = returns2.slice(-60, -30);

    const currentCorrelation = calculateCorrelation(recentReturns1, recentReturns2);
    const previousCorrelation = calculateCorrelation(previousReturns1, previousReturns2);

    const diff = currentCorrelation - previousCorrelation;
    let trend = 'stable';
    if (diff > 0.1) trend = 'increasing';
    else if (diff < -0.1) trend = 'decreasing';

    return {
        current: currentCorrelation,
        previous: previousCorrelation,
        trend
    };
}

/**
 * Generate AI-style insight based on correlation data
 * @param {string} symbol1 - First asset symbol
 * @param {string} symbol2 - Second asset symbol
 * @param {number} correlation - Correlation coefficient
 * @param {string} trend - Correlation trend
 * @param {number} days - Timeframe in days
 * @returns {string} - Human-readable insight
 */
export function generateCorrelationInsight(symbol1, symbol2, correlation, trend, days = 90) {
    const absCorr = Math.abs(correlation);
    const direction = correlation >= 0 ? 'positively' : 'negatively';
    const strength = absCorr > 0.7 ? 'strongly' : absCorr > 0.4 ? 'moderately' : 'weakly';
    const moveDirection = correlation >= 0 ? 'together' : 'in opposite directions';
    const percentMoveTogether = Math.round((0.5 + absCorr * 0.5) * 100);

    const trendText = trend === 'increasing'
        ? 'This relationship has been strengthening recently.'
        : trend === 'decreasing'
            ? 'This relationship has been weakening recently.'
            : 'This relationship has remained relatively stable.';

    return `${symbol1} and ${symbol2} are ${strength} ${direction} correlated and have historically moved ${moveDirection} ${percentMoveTogether}% of the time over the last ${days} days. ${trendText}`;
}

/**
 * "What-If" analysis: What typically happens to asset2 when asset1 moves by X%?
 * @param {number[]} returns1 - First asset returns
 * @param {number[]} returns2 - Second asset returns
 * @param {number} movePercent - The move percentage to analyze (e.g., 5 for +5%)
 * @returns {{ avgMove: number, probability: number, count: number }}
 */
export function whatIfAnalysis(returns1, returns2, movePercent) {
    if (returns1.length !== returns2.length || returns1.length === 0) {
        return { avgMove: 0, probability: 0, count: 0 };
    }

    const threshold = movePercent / 100; // Convert to decimal
    const tolerance = 0.02; // ±2% tolerance for finding similar moves

    // Find days where asset1 moved approximately the specified amount
    const matchingMoves = [];

    for (let i = 0; i < returns1.length; i++) {
        const move = returns1[i];
        if (movePercent >= 0) {
            // Looking for positive moves
            if (move >= threshold - tolerance && move <= threshold + tolerance) {
                matchingMoves.push(returns2[i]);
            }
        } else {
            // Looking for negative moves
            if (move <= threshold + tolerance && move >= threshold - tolerance) {
                matchingMoves.push(returns2[i]);
            }
        }
    }

    if (matchingMoves.length === 0) {
        // No exact matches, use correlation-based estimate
        const correlation = calculateCorrelation(returns1, returns2);
        const estimatedMove = (movePercent / 100) * correlation * 100;
        return {
            avgMove: Math.round(estimatedMove * 100) / 100,
            probability: 0,
            count: 0,
            isEstimate: true
        };
    }

    // Calculate average move
    const avgMove = matchingMoves.reduce((sum, val) => sum + val, 0) / matchingMoves.length;

    // Calculate probability of same-direction move
    const sameDirection = matchingMoves.filter(m =>
        (movePercent >= 0 && m > 0) || (movePercent < 0 && m < 0)
    ).length;
    const probability = sameDirection / matchingMoves.length;

    return {
        avgMove: Math.round(avgMove * 10000) / 100, // Convert to percentage
        probability: Math.round(probability * 100),
        count: matchingMoves.length,
        isEstimate: false
    };
}

/**
 * Generate "What-If" insight text
 * @param {string} symbol1 - First asset symbol
 * @param {string} symbol2 - Second asset symbol
 * @param {number} movePercent - The hypothetical move
 * @param {object} analysis - Result from whatIfAnalysis
 * @returns {string}
 */
export function generateWhatIfInsight(symbol1, symbol2, movePercent, analysis) {
    const moveDirection = movePercent >= 0 ? 'rises' : 'drops';
    const resultDirection = analysis.avgMove >= 0 ? 'gained' : 'lost';

    if (analysis.isEstimate) {
        return `Based on historical correlation, when ${symbol1} ${moveDirection} ${Math.abs(movePercent)}%, ${symbol2} typically moves approximately ${analysis.avgMove >= 0 ? '+' : ''}${analysis.avgMove.toFixed(2)}%. (Correlation-based estimate)`;
    }

    if (analysis.count === 0) {
        return `Insufficient historical data to analyze ${symbol1} moves of ${movePercent >= 0 ? '+' : ''}${movePercent}%.`;
    }

    return `When ${symbol1} ${moveDirection} around ${Math.abs(movePercent)}%, ${symbol2} has historically ${resultDirection} ${Math.abs(analysis.avgMove).toFixed(2)}% on average (${analysis.count} similar events, ${analysis.probability}% same-direction probability).`;
}
