import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, TrendingDown, Coins, Pickaxe, LayoutGrid,
    AlertTriangle, RefreshCw, Star
} from 'lucide-react';
import { getHistoricalPrices } from '../services/historicalPriceService';
import apiManager from '../services/apiManager';
import { useAuth } from '../context/AuthContext';
import * as userDataService from '../services/userDataService';
import { watchlistService } from '../services/watchlistService';
import { withFormattedDates } from '../utils/chartUtils';

// Asset Type Selector
const AssetTypeSelector = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-2">
        {[
            { value: 'crypto', label: 'Crypto', icon: Coins, color: 'text-purple-500' },
            { value: 'stock', label: 'Stocks', icon: TrendingUp, color: 'text-blue-500' },
            { value: 'commodity', label: 'Commodities', icon: Pickaxe, color: 'text-amber-500' }
        ].map((type) => (
            <button
                key={type.value}
                onClick={() => onChange(type.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${value === type.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-105'
                    }`}
            >
                <type.icon className={`w-4 h-4 ${value === type.value ? 'text-white' : type.color}`} />
                <span>{type.label}</span>
            </button>
        ))}
    </div>
);

// Timeframe Selector
const TimeframeSelector = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm w-fit inline-flex shadow-sm">
        {[
            { value: 7, label: '1W' },
            { value: 30, label: '1M' },
            { value: 90, label: '3M' },
            { value: 180, label: '6M' },
            { value: 365, label: '1Y' }
        ].map((tf) => (
            <button
                key={tf.value}
                onClick={() => onChange(tf.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${value === tf.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
            >
                {tf.label}
            </button>
        ))}
    </div>
);

export default function HistoricalData() {
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const userId = currentUser?.uid;

    // Initialize state from localStorage if available
    const [assetType, setAssetType] = useState(() => {
        const urlMarket = searchParams.get('market');
        if (urlMarket) {
            // Normalize 'stock' vs 'stocks' and 'commodity' vs 'commodities'
            if (urlMarket === 'stocks') return 'stock';
            if (urlMarket === 'commodities') return 'commodity';
            return urlMarket;
        }
        return localStorage.getItem('hms_historical_assetType') || 'crypto';
    });
    const [selectedSymbol, setSelectedSymbol] = useState(() => {
        return searchParams.get('symbol') || localStorage.getItem('hms_historical_symbol') || 'BTC';
    });
    const [timeframe, setTimeframe] = useState(() => {
        const saved = localStorage.getItem('hms_historical_timeframe');
        return saved ? parseInt(saved) : 90;
    });
    const [priceData, setPriceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [visibleRows, setVisibleRows] = useState(10);
    const [isWatchlisted, setIsWatchlisted] = useState(false);

    // Load preferences from Firestore when user logs in
    useEffect(() => {
        if (userId) {
            userDataService.getPreferences(userId).then(prefs => {
                // ONLY apply preferences if there are NO query parameters
                const hasUrlParams = searchParams.get('symbol') || searchParams.get('market');
                if (!hasUrlParams) {
                    if (prefs?.historicalAssetType) setAssetType(prefs.historicalAssetType);
                    if (prefs?.historicalSymbol) setSelectedSymbol(prefs.historicalSymbol);
                    if (prefs?.historicalTimeframe) setTimeframe(prefs.historicalTimeframe);
                }
            });
        }
    }, [userId, searchParams]);

    // Save preferences whenever they change
    useEffect(() => {
        localStorage.setItem('hms_historical_assetType', assetType);
        if (userId) {
            userDataService.getPreferences(userId).then(prefs => {
                userDataService.savePreferences(userId, { ...prefs, historicalAssetType: assetType });
            });
        }
    }, [assetType]);

    useEffect(() => {
        localStorage.setItem('hms_historical_symbol', selectedSymbol);
        if (userId) {
            userDataService.getPreferences(userId).then(prefs => {
                userDataService.savePreferences(userId, { ...prefs, historicalSymbol: selectedSymbol });
            });
        }
    }, [selectedSymbol]);

    useEffect(() => {
        localStorage.setItem('hms_historical_timeframe', timeframe.toString());
        if (userId) {
            userDataService.getPreferences(userId).then(prefs => {
                userDataService.savePreferences(userId, { ...prefs, historicalTimeframe: timeframe });
            });
        }
    }, [timeframe]);

    // Check if current asset is watchlisted
    useEffect(() => {
        let isMounted = true;
        const checkWatchlist = async () => {
            if (!selectedSymbol) return;

            // Normalize symbol to uppercase for consistent Firestore/localStorage lookups
            const normalizedSymbol = selectedSymbol.toUpperCase();

            try {
                if (currentUser) {
                    const inWatchlist = await watchlistService.isInWatchlist(currentUser.uid, normalizedSymbol);
                    if (isMounted) setIsWatchlisted(inWatchlist);
                } else {
                    const stored = JSON.parse(localStorage.getItem('watchlist') || '[]');
                    if (isMounted) setIsWatchlisted(stored.some(item => item.symbol.toUpperCase() === normalizedSymbol));
                }
            } catch (err) {
                console.error('Error checking watchlist status:', err);
            }
        };
        checkWatchlist();
        return () => { isMounted = false; };
    }, [selectedSymbol, currentUser]);

    const handleToggleWatchlist = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!selectedSymbol) return;

        const normalizedSymbol = selectedSymbol.toUpperCase();
        console.log(`Starting toggle for ${normalizedSymbol}. Current state: ${isWatchlisted}`);

        const foundAsset = availableAssets.find(a => a.symbol.toUpperCase() === normalizedSymbol);
        const assetToToggle = foundAsset || {
            symbol: normalizedSymbol,
            name: normalizedSymbol,
            market: assetType === 'stock' ? 'stocks' : assetType === 'commodity' ? 'commodities' : 'crypto'
        };

        // Ensure market is correct
        if (!assetToToggle.market) {
            assetToToggle.market = assetType === 'stock' ? 'stocks' : assetType === 'commodity' ? 'commodities' : 'crypto';
        }

        try {
            if (currentUser) {
                if (isWatchlisted) {
                    await watchlistService.removeFromWatchlist(currentUser.uid, normalizedSymbol);
                    console.log('Removed from Firestore watchlist');
                } else {
                    await watchlistService.addToWatchlist(currentUser.uid, assetToToggle);
                    console.log('Added to Firestore watchlist');
                }
            } else {
                const stored = JSON.parse(localStorage.getItem('watchlist') || '[]');
                let updated;
                if (isWatchlisted) {
                    updated = stored.filter(item => item.symbol.toUpperCase() !== normalizedSymbol);
                } else {
                    updated = [...stored, assetToToggle];
                }
                localStorage.setItem('watchlist', JSON.stringify(updated));
                console.log('Updated localStorage watchlist');
            }

            // Toggle local state immediately for snappy UI
            setIsWatchlisted(prev => !prev);
        } catch (error) {
            console.error("Failed to toggle watchlist:", error);
        }
    };

    // Load available assets based on type
    useEffect(() => {
        async function loadAssets() {
            try {
                const marketMap = { crypto: 'crypto', stock: 'stocks', commodity: 'commodities' };
                const data = await apiManager.getMarketData(marketMap[assetType]);
                console.log(`Loaded ${data.length} ${assetType} assets:`, data.slice(0, 3));
                setAvailableAssets(data);

                // Select first asset if current selection isn't in new list
                // BUT skip this check if we have a URL symbol, trust it exists in that market
                if (!searchParams.get('symbol') && data.length > 0 && !data.find(a => a.symbol === selectedSymbol)) {
                    console.log(`⚠️ Symbol ${selectedSymbol} not found, defaulting to ${data[0].symbol}`);
                    setSelectedSymbol(data[0].symbol);
                }
            } catch (err) {
                console.error('Failed to load assets:', err);
            }
        }
        loadAssets();
    }, [assetType]);

    // Fetch historical data when selection changes
    // Fetch 1 extra day to calculate daily change for the oldest displayed day
    useEffect(() => {
        async function fetchData() {
            if (!selectedSymbol) return;

            setIsLoading(true);
            setError(null);

            try {
                // Fetch 1 extra day for calculating daily change on oldest displayed day
                const result = await getHistoricalPrices(selectedSymbol, timeframe + 1, assetType);

                if (result.error) {
                    setError(result.error);
                    setPriceData([]);
                } else {
                    setPriceData(result);
                }
            } catch (err) {
                setError('Failed to fetch historical data');
                setPriceData([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [selectedSymbol, timeframe, assetType]);

    // Reset visible rows when data changes
    useEffect(() => {
        setVisibleRows(10);
    }, [selectedSymbol, timeframe, assetType]);

    // Get display data (exclude the extra day used for calculation)
    const displayData = React.useMemo(() => {
        const raw = priceData.length <= timeframe ? priceData : priceData.slice(-timeframe);
        const tfLabel = timeframe <= 7 ? '1W' : timeframe <= 30 ? '1M' : timeframe <= 90 ? '3M' : '1Y';
        return withFormattedDates(raw, 'date', tfLabel);
    }, [priceData, timeframe]);

    // Calculate statistics based on displayed data
    const stats = React.useMemo(() => {
        if (displayData.length < 2) return null;

        const closes = displayData.map(d => d.close);
        const high = Math.max(...closes);
        const low = Math.min(...closes);
        const first = closes[0];
        const last = closes[closes.length - 1];
        const change = ((last - first) / first) * 100;
        const avg = closes.reduce((a, b) => a + b, 0) / closes.length;

        return { high, low, first, last, change, avg };
    }, [displayData]);

    const selectedAsset = availableAssets.find(a => a.symbol.toUpperCase() === selectedSymbol.toUpperCase());

    return (
        <div className="h-screen flex flex-col p-4 sm:p-6 md:p-8 animate-fadeIn overflow-hidden">
            <div className="max-w-[1920px] w-full mx-auto flex-1 flex flex-col space-y-4 min-h-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                            <LayoutGrid className="w-8 h-8 text-blue-500" /> Historical Data
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Deep dive into historical price trends and key statistics.
                        </p>
                    </div>
                </div>

                <div className="bento-grid flex-1 min-h-0 overflow-hidden">
                    {/* Controls - Full width */}
                    <div className="bento-card bento-col-span-full xl:col-span-12 bento-row-span-1 p-4 sm:p-6 z-20 overflow-visible">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            {/* Asset Type */}
                            <div className="lg:col-span-4">
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2 block">1. Asset Type</label>
                                <AssetTypeSelector value={assetType} onChange={setAssetType} />
                            </div>

                            {/* Asset Selection */}
                            <div className="lg:col-span-4">
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2 block">2. Select Asset</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedSymbol}
                                        onChange={(e) => setSelectedSymbol(e.target.value)}
                                        className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all cursor-pointer backdrop-blur-sm shadow-sm"
                                    >
                                        {availableAssets.map((asset) => (
                                            <option key={asset.symbol} value={asset.symbol}>
                                                {asset.symbol} - {asset.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleToggleWatchlist}
                                        aria-label={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                                        className={`p-3 rounded-xl border transition-all flex items-center justify-center min-w-[54px] h-[46px] shadow-sm backdrop-blur-sm
                                            ${isWatchlisted
                                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20'
                                                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'
                                            }`}
                                        title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                                    >
                                        <Star className={`w-5 h-5 transition-transform duration-300 ${isWatchlisted ? 'fill-amber-500 scale-110' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Timeframe */}
                            <div className="lg:col-span-4">
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2 block">3. Timeframe</label>
                                <TimeframeSelector value={timeframe} onChange={setTimeframe} />
                            </div>
                        </div>
                    </div>

                    {/* Chart & Summary - Main Feature */}
                    <div className="bento-card bento-col-span-full xl:col-span-8 bento-row-span-3 p-4 sm:p-6 flex flex-col group min-h-0">
                        {/* Current Asset Info (Integrated into chart header) */}
                        {selectedAsset ? (
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                                        <span className="text-xl font-black text-slate-900 dark:text-white">
                                            {selectedAsset.symbol.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedAsset.symbol}</h2>
                                            {stats && (
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm border ${stats.change >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                                                    {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedAsset.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Price</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        ${selectedAsset.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
                                <TrendingUp className="w-6 h-6 text-blue-500" /> Price History ({timeframe} days)
                            </div>
                        )}

                        <div className="flex-1 min-h-0 mt-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center gap-2 h-full text-red-400 p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-bold">{error}</span>
                                </div>
                            ) : displayData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={stats?.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={stats?.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis
                                            dataKey="formattedDate"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                                            interval="preserveStartEnd"
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(val) => `$${val.toLocaleString()}`}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                backdropFilter: 'blur(8px)',
                                                borderColor: 'var(--border)',
                                                borderRadius: '12px',
                                                fontFamily: 'inherit',
                                                color: '#fff',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                            formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="close"
                                            stroke={stats?.change >= 0 ? '#10b981' : '#ef4444'}
                                            fillOpacity={1}
                                            fill="url(#priceGradient)"
                                            strokeWidth={3}
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 font-medium">
                                    No data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column: Statistics */}
                    <div className="bento-col-span-full xl:col-span-4 bento-row-span-1 grid grid-cols-2 gap-2 sm:gap-4">
                        {stats ? (
                            <>
                                <div className="bento-card p-5 group hover:scale-[1.02] transition-transform flex flex-col justify-center">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Period High</div>
                                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 break-words">${stats.high.toLocaleString()}</div>
                                </div>
                                <div className="bento-card p-5 group hover:scale-[1.02] transition-transform flex flex-col justify-center">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Period Low</div>
                                    <div className="text-xl font-black text-red-600 dark:text-red-400 break-words">${stats.low.toLocaleString()}</div>
                                </div>
                                <div className="bento-card p-5 group hover:scale-[1.02] transition-transform flex flex-col justify-center">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Average</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white break-words">${stats.avg.toLocaleString()}</div>
                                </div>
                                <div className="bento-card p-5 group hover:scale-[1.02] transition-transform flex flex-col justify-center">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Net Change</div>
                                    <div className={`text-xl font-black break-words ${stats.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2 bento-card p-6 flex flex-col items-center justify-center text-center text-slate-500">
                                <AlertTriangle className="w-8 h-8 mb-3 opacity-50" />
                                <p className="font-medium">Statistics unavailable</p>
                            </div>
                        )}
                    </div>

                    {/* Right column: Data Table */}
                    <div className="bento-card bento-col-span-full xl:col-span-4 bento-row-span-2 p-0 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-purple-500" /> Source Data ({displayData.length} records)
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/30 dark:bg-slate-900/30">
                            {priceData.length > 0 ? (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[350px] text-sm">
                                        <thead className="bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 shadow-sm backdrop-blur-xl">
                                            <tr>
                                                <th className="text-left py-3 px-5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">Date</th>
                                                <th className="text-right py-3 px-5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">Close</th>
                                                <th className="text-right py-3 px-5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">Change</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                            {(() => {
                                                const fullDataReversed = [...priceData].reverse();
                                                const displaySet = new Set(displayData.map(d => d.date));

                                                return fullDataReversed
                                                    .filter(row => displaySet.has(row.date))
                                                    .slice(0, visibleRows)
                                                    .map((row, idx) => {
                                                        const fullIdx = fullDataReversed.findIndex(d => d.date === row.date);
                                                        const prevClose = fullDataReversed[fullIdx + 1]?.close;
                                                        const hasChange = prevClose !== undefined && prevClose !== null;
                                                        const change = hasChange ? ((row.close - prevClose) / prevClose) * 100 : null;
                                                        return (
                                                            <tr key={row.date} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                                <td className="py-3 px-5 font-bold text-slate-700 dark:text-slate-300 text-xs">{row.date}</td>
                                                                <td className="py-3 px-5 font-black text-slate-900 dark:text-white text-right ">
                                                                    ${row.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                                                </td>
                                                                <td className={`py-3 px-5 font-bold text-right text-xs ${change === null
                                                                    ? 'text-slate-400'
                                                                    : change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                    {change !== null
                                                                        ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
                                                                        : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500 font-bold">No data available to display.</div>
                            )}
                        </div>
                        {priceData.length > visibleRows && (
                            <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-center shrink-0">
                                <button
                                    onClick={() => setVisibleRows(prev => Math.min(prev + 10, priceData.length))}
                                    className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1.5 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    Show More Records ({Math.min(priceData.length - visibleRows, 10)} more)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
