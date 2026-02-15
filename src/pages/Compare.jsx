import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Link as LinkIcon, Cpu, Sparkles, Scale, AlertTriangle } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import apiManager from '../services/apiManager';
import {
    fetchHistoricalPrices,
    calculateDailyReturns,
    calculateCorrelation,
    classifyCorrelation,
    analyzeCorrelationTrend,
    generateCorrelationInsight,
    whatIfAnalysis,
    generateWhatIfInsight,
    alignAndFillHistory
} from '../services/analysisService';

// Market Type Selector Button Group
const MarketTypeSelector = ({ value, onChange, label }) => (
    <div className="space-y-2">
        <label className="text-sm text-slate-400">{label}</label>
        <div className="flex gap-2">
            {[
                { value: 'crypto', label: 'Crypto' },
                { value: 'stocks', label: 'Stocks' },
                { value: 'commodities', label: 'Commodities' }
            ].map((type) => (
                <button
                    key={type.value}
                    onClick={() => onChange(type.value)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${value === type.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                >
                    {type.label}
                </button>
            ))}
        </div>
    </div>
);

// Asset Dropdown Selector
const AssetDropdown = ({ value, onChange, assets, label, disabled }) => (
    <div className="space-y-2">
        <label className="text-sm text-slate-400">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-slate-800 border border-dark-border rounded-lg px-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
            <option value="">Select an asset</option>
            {assets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} - {asset.name}
                </option>
            ))}
        </select>
    </div>
);

// Two-Step Asset Selector Component
const TwoStepAssetSelector = ({
    marketType,
    onMarketTypeChange,
    assetSymbol,
    onAssetChange,
    assets,
    cardColor = 'blue'
}) => {
    const colorClasses = {
        blue: 'border-blue-500/30 bg-blue-900/10',
        amber: 'border-amber-500/30 bg-amber-900/10'
    };

    const selectedAsset = assets.find(a => a.symbol === assetSymbol);

    return (
        <div className={`bg-dark-surface border border-dark-border rounded-xl p-4 ${colorClasses[cardColor]}`}>
            <div className="space-y-4">
                {/* Step 1: Choose Market Type */}
                <MarketTypeSelector
                    value={marketType}
                    onChange={onMarketTypeChange}
                    label="Step 1: Choose Market"
                />

                {/* Step 2: Choose Asset from Market */}
                <AssetDropdown
                    value={assetSymbol}
                    onChange={onAssetChange}
                    assets={assets}
                    label="Step 2: Select Asset"
                    disabled={assets.length === 0}
                />

                {/* Selected Asset Preview */}
                {selectedAsset && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-lg text-slate-200">{selectedAsset.symbol}</span>
                            <span className={`font-mono ${selectedAsset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change?.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-sm text-slate-500">{selectedAsset.name}</div>
                        <div className="text-xl font-mono text-slate-200 mt-2">${selectedAsset.price?.toLocaleString()}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Metric Comparison Row
const MetricRow = ({ label, value1, value2, format = 'number' }) => {
    const formatValue = (val) => {
        if (val === null || val === undefined) return 'N/A';
        switch (format) {
            case 'currency':
                return `$${val.toLocaleString()}`;
            case 'percent':
                return `${val.toFixed(2)}%`;
            case 'marketCap':
                if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
                if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
                if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
                return `$${val.toLocaleString()}`;
            default:
                return val.toLocaleString();
        }
    };

    const isValue1Better = () => {
        if (label.includes('Change')) return value1 > value2;
        if (label.includes('Market Cap')) return value1 > value2;
        return false;
    };

    return (
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-dark-border last:border-0">
            <div className="text-slate-400 text-sm">{label}</div>
            <div className={`font-mono text-sm text-center ${value1 !== null && isValue1Better() ? 'text-green-400' : 'text-slate-200'}`}>
                {formatValue(value1)}
            </div>
            <div className={`font-mono text-sm text-center ${value2 !== null && !isValue1Better() && value2 !== value1 ? 'text-green-400' : 'text-slate-200'}`}>
                {formatValue(value2)}
            </div>
        </div>
    );
};

// Mini Correlation Badge (Low/Medium/High)
const MiniCorrelationBadge = ({ correlation }) => {
    const { strength, direction } = classifyCorrelation(correlation);

    const colorClasses = {
        high: direction === 'positive' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30',
        moderate: direction === 'positive' ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20',
        low: 'bg-slate-700/50 text-slate-400 border-slate-600'
    };

    const labels = {
        high: 'High',
        moderate: 'Medium',
        low: 'Low'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium uppercase tracking-wider border ${colorClasses[strength]}`}>
            {labels[strength]}
        </span>
    );
};

// Full Correlation Badge
const CorrelationBadge = ({ value }) => {
    const { strength, direction } = classifyCorrelation(value);

    const getColor = () => {
        if (strength === 'high') return direction === 'positive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
        if (strength === 'moderate') return direction === 'positive' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300';
        return 'bg-slate-700 text-slate-400';
    };

    const labels = { high: 'High', moderate: 'Moderate', low: 'Low' };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${getColor()}`}>
            <span className="text-2xl font-bold font-mono">{typeof value === 'number' ? value.toFixed(4) : '0.0000'}</span>
            <span className="text-xs uppercase tracking-wider">{labels[strength]} {direction === 'positive' ? 'Positive' : 'Negative'}</span>
        </div>
    );
};

// Trend Indicator
const TrendIndicator = ({ trend }) => {
    const config = {
        increasing: { Icon: TrendingUp, text: 'Strengthening', color: 'text-green-400' },
        decreasing: { Icon: TrendingDown, text: 'Weakening', color: 'text-red-400' },
        stable: { Icon: ArrowRight, text: 'Stable', color: 'text-slate-400' }
    };

    const { Icon, text, color } = config[trend] || config.stable;

    return (
        <div className={`flex items-center gap-2 ${color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
};

export default function Compare() {
    // Market types for each asset
    const [asset1MarketType, setAsset1MarketType] = useState('crypto');
    const [asset2MarketType, setAsset2MarketType] = useState('stocks');

    // Assets for each market type
    const [asset1MarketAssets, setAsset1MarketAssets] = useState([]);
    const [asset2MarketAssets, setAsset2MarketAssets] = useState([]);

    // Selected symbols
    const [asset1Symbol, setAsset1Symbol] = useState('');
    const [asset2Symbol, setAsset2Symbol] = useState('');

    // Selected asset objects
    const [asset1, setAsset1] = useState(null);
    const [asset2, setAsset2] = useState(null);

    // Chart and analysis state
    const [chartData, setChartData] = useState([]);
    const [chartTimeframe, setChartTimeframe] = useState('1M');
    const [correlationTimeframe, setCorrelationTimeframe] = useState('90');
    const [isLoading, setIsLoading] = useState(true);

    // Analysis state
    const [correlationData, setCorrelationData] = useState(null);
    const [whatIfMove, setWhatIfMove] = useState(5);
    const [whatIfResult, setWhatIfResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Load assets for Asset 1 market type
    useEffect(() => {
        async function loadAsset1Market() {
            try {
                const data = await apiManager.getMarketData(asset1MarketType);
                setAsset1MarketAssets(data.map(a => ({ ...a, market: asset1MarketType })));

                // Auto-select first asset if none selected
                if (data.length > 0 && !asset1Symbol) {
                    setAsset1Symbol(data[0].symbol);
                }
                // Reset selection if current symbol not in new market
                else if (asset1Symbol && !data.find(a => a.symbol === asset1Symbol)) {
                    setAsset1Symbol(data[0]?.symbol || '');
                }
            } catch (error) {
                console.error('Failed to load asset 1 market:', error);
            }
        }
        loadAsset1Market();
    }, [asset1MarketType]);

    // Load assets for Asset 2 market type
    useEffect(() => {
        async function loadAsset2Market() {
            setIsLoading(true);
            try {
                const data = await apiManager.getMarketData(asset2MarketType);
                setAsset2MarketAssets(data.map(a => ({ ...a, market: asset2MarketType })));

                // Auto-select first asset if none selected
                if (data.length > 0 && !asset2Symbol) {
                    setAsset2Symbol(data[0].symbol);
                }
                // Reset selection if current symbol not in new market
                else if (asset2Symbol && !data.find(a => a.symbol === asset2Symbol)) {
                    setAsset2Symbol(data[0]?.symbol || '');
                }
            } catch (error) {
                console.error('Failed to load asset 2 market:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadAsset2Market();
    }, [asset2MarketType]);

    // Update asset1 object when symbol changes
    useEffect(() => {
        if (asset1Symbol) {
            const found = asset1MarketAssets.find(a => a.symbol === asset1Symbol);
            setAsset1(found || null);
        } else {
            setAsset1(null);
        }
    }, [asset1Symbol, asset1MarketAssets]);

    // Update asset2 object when symbol changes
    useEffect(() => {
        if (asset2Symbol) {
            const found = asset2MarketAssets.find(a => a.symbol === asset2Symbol);
            setAsset2(found || null);
        } else {
            setAsset2(null);
        }
    }, [asset2Symbol, asset2MarketAssets]);

    // Perform correlation analysis when assets or correlation timeframe changes
    useEffect(() => {
        async function performAnalysis() {
            if (!asset1 || !asset2) {
                setCorrelationData(null);
                setWhatIfResult(null);
                return;
            }

            setIsAnalyzing(true);
            try {
                const days = parseInt(correlationTimeframe);

                // Fetch historical data
                const [history1, history2] = await Promise.all([
                    fetchHistoricalPrices(asset1.symbol, days, asset1.market),
                    fetchHistoricalPrices(asset2.symbol, days, asset2.market)
                ]);

                // Append LIVE price to history for most up-to-date analysis
                const today = new Date().toISOString().split('T')[0];

                // Helper to append live price if it's newer than the last historical point
                const appendLivePrice = (history, currentPrice) => {
                    const lastDate = history.length > 0 ? history[history.length - 1].date : '';
                    if (lastDate !== today && currentPrice) {
                        return [...history, {
                            date: today,
                            close: currentPrice,
                            open: currentPrice,
                            high: currentPrice,
                            low: currentPrice
                        }];
                    }
                    return history;
                };

                const fullHistory1 = appendLivePrice(history1, asset1.price);
                const fullHistory2 = appendLivePrice(history2, asset2.price);

                // ALIGN DATA BY DATE (fix for Crypto vs Stocks)
                const { aligned1, aligned2 } = alignAndFillHistory(fullHistory1, fullHistory2);

                // Calculate returns from aligned prices
                const returns1 = calculateDailyReturns(aligned1);
                const returns2 = calculateDailyReturns(aligned2);

                // Calculate correlation
                const correlation = calculateCorrelation(returns1, returns2);
                const classification = classifyCorrelation(correlation);

                // Analyze trend
                const trendAnalysis = analyzeCorrelationTrend(returns1, returns2);
                const insight = generateCorrelationInsight(
                    asset1.symbol,
                    asset2.symbol,
                    correlation,
                    trendAnalysis.trend,
                    days
                );

                setCorrelationData({
                    correlation,
                    classification,
                    trend: trendAnalysis.trend,
                    previousCorrelation: trendAnalysis.previous,
                    insight,
                    returns1,
                    returns2,
                    days,
                    history1: fullHistory1, // Use the extended history for charting
                    history2: fullHistory2
                });

                // Perform what-if analysis
                const whatIf = whatIfAnalysis(returns1, returns2, whatIfMove);
                const whatIfInsight = generateWhatIfInsight(asset1.symbol, asset2.symbol, whatIfMove, whatIf);
                setWhatIfResult({ ...whatIf, insight: whatIfInsight });

            } catch (error) {
                console.error('Analysis failed:', error);
            } finally {
                setIsAnalyzing(false);
            }
        }

        performAnalysis();
    }, [asset1, asset2, correlationTimeframe]);

    // Generate chart data when chart timeframe changes
    useEffect(() => {
        if (!correlationData || !asset1 || !asset2) return;

        const chartDays = chartTimeframe === '1W' ? 7 : chartTimeframe === '1M' ? 30 : chartTimeframe === '3M' ? 90 : 365;
        const { returns1, returns2, history1 } = correlationData;

        const chartPoints = [];
        let cumReturn1 = 0;
        let cumReturn2 = 0;

        const limit = Math.min(returns1.length, returns2.length, chartDays);
        const startIdx = Math.max(0, returns1.length - chartDays);

        for (let i = startIdx; i < returns1.length; i++) {
            cumReturn1 += returns1[i];
            cumReturn2 += returns2[i];
            chartPoints.push({
                date: history1[i + 1]?.date || `Day ${i + 1}`,
                [asset1.symbol]: (cumReturn1 * 100).toFixed(2),
                [asset2.symbol]: (cumReturn2 * 100).toFixed(2)
            });
        }
        setChartData(chartPoints);
    }, [correlationData, chartTimeframe, asset1, asset2]);

    // Update what-if when move percentage changes
    useEffect(() => {
        if (correlationData && correlationData.returns1 && correlationData.returns2) {
            const whatIf = whatIfAnalysis(correlationData.returns1, correlationData.returns2, whatIfMove);
            const whatIfInsight = generateWhatIfInsight(asset1?.symbol, asset2?.symbol, whatIfMove, whatIf);
            setWhatIfResult({ ...whatIf, insight: whatIfInsight });
        }
    }, [whatIfMove, correlationData, asset1, asset2]);

    if (isLoading && asset1MarketAssets.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 font-mono">Loading assets...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-primary">Compare Assets</h1>
                <p className="text-secondary text-sm font-mono">Select market type first, then choose an asset</p>
            </div>

            {/* Two-Step Asset Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Asset */}
                <TwoStepAssetSelector
                    marketType={asset1MarketType}
                    onMarketTypeChange={(type) => {
                        setAsset1MarketType(type);
                        setAsset1Symbol('');
                    }}
                    assetSymbol={asset1Symbol}
                    onAssetChange={setAsset1Symbol}
                    assets={asset1MarketAssets}
                    cardColor="blue"
                />

                {/* Second Asset */}
                <TwoStepAssetSelector
                    marketType={asset2MarketType}
                    onMarketTypeChange={(type) => {
                        setAsset2MarketType(type);
                        setAsset2Symbol('');
                    }}
                    assetSymbol={asset2Symbol}
                    onAssetChange={setAsset2Symbol}
                    assets={asset2MarketAssets}
                    cardColor="amber"
                />
            </div>

            {/* Performance Chart with Correlation Display */}
            {asset1 && asset2 && (
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-primary">Performance Comparison (%)</h3>
                        <div className="flex gap-2">
                            {['1W', '1M', '3M', '1Y'].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setChartTimeframe(tf)}
                                    className={`px-3 py-1 text-sm font-mono rounded transition-colors ${chartTimeframe === tf
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-80">
                        {isAnalyzing ? (
                            <div className="flex items-center justify-center h-full">
                                <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="var(--text-secondary)"
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            color: 'var(--text-primary)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        labelStyle={{ color: 'var(--text-secondary)' }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey={asset1.symbol}
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#color1)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={asset2.symbol}
                                        stroke="#f59e0b"
                                        fillOpacity={1}
                                        fill="url(#color2)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Correlation Display Under Chart */}
                    {correlationData && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {/* Correlation Value Display */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-secondary text-sm">Correlation:</span>
                                        <span className="font-mono font-bold text-xl text-primary">
                                            {typeof correlationData.correlation === 'number' ? correlationData.correlation.toFixed(4) : '0.0000'}
                                        </span>
                                        <span className="text-secondary text-sm">over {correlationData.days} days</span>
                                    </div>

                                    {/* Mini Badge */}
                                    <MiniCorrelationBadge correlation={correlationData.correlation} />
                                </div>

                                {/* Correlation Timeframe Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-secondary uppercase tracking-wider">Correlation Period:</span>
                                    <div className="flex gap-1">
                                        {[
                                            { value: '30', label: '30D' },
                                            { value: '60', label: '60D' },
                                            { value: '90', label: '90D' },
                                            { value: '180', label: '6M' },
                                            { value: '365', label: '1Y' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setCorrelationTimeframe(option.value)}
                                                className={`px-2 py-1 text-xs font-mono rounded transition-colors ${correlationTimeframe === option.value
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Relationship Analysis Section */}
            {asset1 && asset2 && correlationData && (
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Relationship Analysis
                        </h3>
                    </div>

                    <div className="p-6">
                        {/* Correlation Value and Trend */}
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <div>
                                <div className="text-xs text-secondary uppercase tracking-wider mb-2">Correlation Coefficient</div>
                                <CorrelationBadge value={correlationData.correlation} />
                            </div>

                            <div>
                                <div className="text-xs text-secondary uppercase tracking-wider mb-2">Trend</div>
                                <TrendIndicator trend={correlationData.trend} />
                            </div>

                            {correlationData.trend !== 'stable' && (
                                <div>
                                    <div className="text-xs text-secondary uppercase tracking-wider mb-2">Previous Period</div>
                                    <span className="font-mono text-secondary">
                                        {typeof correlationData.previousCorrelation === 'number' ? correlationData.previousCorrelation.toFixed(4) : 'N/A'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* AI Insight */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-3">
                                <Cpu className="w-6 h-6 text-purple-500" />
                                <div>
                                    <div className="text-xs text-secondary uppercase tracking-wider mb-1">AI Insight</div>
                                    <p className="text-primary leading-relaxed">{correlationData.insight}</p>
                                </div>
                            </div>
                        </div>

                        {/* Correlation Scale */}
                        <div className="mt-6">
                            <div className="text-xs text-secondary uppercase tracking-wider mb-2">Correlation Scale</div>
                            <div className="relative h-3 bg-gradient-to-r from-red-500 via-slate-300 dark:via-slate-600 to-green-500 rounded-full">
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-200 rounded-full border-2 border-slate-900 shadow-lg"
                                    style={{ left: `${(correlationData.correlation + 1) * 50}%`, transform: 'translate(-50%, -50%)' }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-secondary mt-1">
                                <span>-1 (Inverse)</span>
                                <span>0 (No relation)</span>
                                <span>+1 (Same direction)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* What-If Analysis Section */}
            {asset1 && asset2 && correlationData && (
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> "What-If" Prediction
                        </h3>
                    </div>

                    <div className="p-6">
                        {/* Question */}
                        <div className="mb-6">
                            <div className="text-primary mb-4">
                                If <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{asset1.symbol}</span> moves
                                <div className="inline-flex items-center mx-2">
                                    <select
                                        value={whatIfMove}
                                        onChange={(e) => setWhatIfMove(parseFloat(e.target.value))}
                                        className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-1 font-mono text-green-600 dark:text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={-10}>-10%</option>
                                        <option value={-5}>-5%</option>
                                        <option value={-3}>-3%</option>
                                        <option value={-1}>-1%</option>
                                        <option value={1}>+1%</option>
                                        <option value={3}>+3%</option>
                                        <option value={5}>+5%</option>
                                        <option value={10}>+10%</option>
                                    </select>
                                </div>
                                , what typically happens to <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{asset2.symbol}</span>?
                            </div>
                        </div>

                        {/* Answer */}
                        {whatIfResult && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center w-10 h-10">
                                        {whatIfResult.avgMove >= 0 ?
                                            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" /> :
                                            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="bg-white dark:bg-slate-900 rounded-lg px-4 py-2 border border-slate-200 dark:border-slate-800">
                                                <div className="text-xs text-secondary uppercase tracking-wider">Expected Move</div>
                                                <div className={`text-2xl font-mono font-bold ${whatIfResult.avgMove >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {whatIfResult.avgMove >= 0 ? '+' : ''}{typeof whatIfResult.avgMove === 'number' ? whatIfResult.avgMove.toFixed(2) : '0.00'}%
                                                </div>
                                            </div>

                                            {!whatIfResult.isEstimate && whatIfResult.count > 0 && (
                                                <>
                                                    <div className="bg-white dark:bg-slate-900 rounded-lg px-4 py-2 border border-slate-200 dark:border-slate-800">
                                                        <div className="text-xs text-secondary uppercase tracking-wider">Same Direction</div>
                                                        <div className="text-2xl font-mono font-bold text-primary">
                                                            {whatIfResult.probability}%
                                                        </div>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-900 rounded-lg px-4 py-2 border border-slate-200 dark:border-slate-800">
                                                        <div className="text-xs text-secondary uppercase tracking-wider">Sample Size</div>
                                                        <div className="text-2xl font-mono font-bold text-primary">
                                                            {whatIfResult.count}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-secondary text-sm leading-relaxed">{whatIfResult.insight}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="mt-4 text-xs text-secondary flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Based on historical data. Past performance does not guarantee future results.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Comparison Table */}
            {asset1 && asset2 && (
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border">
                        <h3 className="font-semibold text-primary">Key Metrics Comparison</h3>
                    </div>
                    <div className="p-4">
                        {/* Header Row */}
                        <div className="grid grid-cols-3 gap-4 pb-3 border-b border-border mb-2">
                            <div className="text-secondary text-sm font-medium">Metric</div>
                            <div className="text-center">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{asset1.symbol}</span>
                                <span className="text-xs text-secondary ml-1">({asset1MarketType})</span>
                            </div>
                            <div className="text-center">
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{asset2.symbol}</span>
                                <span className="text-xs text-secondary ml-1">({asset2MarketType})</span>
                            </div>
                        </div>

                        <MetricRow label="Current Price" value1={asset1.price} value2={asset2.price} format="currency" />
                        <MetricRow label="24h Change" value1={asset1.change} value2={asset2.change} format="percent" />
                        <MetricRow label="Market Cap" value1={asset1.marketCap} value2={asset2.marketCap} format="marketCap" />
                    </div>
                </div>
            )}

            {/* Empty State */}
            {(!asset1 || !asset2) && (
                <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-sm">
                    <Scale className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">Select Two Assets to Compare</h3>
                    <p className="text-secondary text-sm">
                        Choose market type, then select an asset from the dropdown to see correlation analysis
                    </p>
                </div>
            )}
        </div>
    );
}
