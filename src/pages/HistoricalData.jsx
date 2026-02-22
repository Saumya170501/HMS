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

// Asset Type Selector
const AssetTypeSelector = ({ value, onChange }) => (
    <div className="flex gap-2">
        {[
            { value: 'crypto', label: 'Crypto', icon: Coins, color: 'text-purple-500' },
            { value: 'stock', label: 'Stocks', icon: TrendingUp, color: 'text-blue-500' },
            { value: 'commodity', label: 'Commodities', icon: Pickaxe, color: 'text-amber-500' }
        ].map((type) => (
            <button
                key={type.value}
                onClick={() => onChange(type.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${value === type.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 border border-border'
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
    <div className="flex gap-1">
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
                className={`px-3 py-1.5 text-sm font-mono rounded transition-colors ${value === tf.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary border border-border'
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
    const [visibleRows, setVisibleRows] = useState(30);
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
        setVisibleRows(30);
    }, [selectedSymbol, timeframe, assetType]);

    // Get display data (exclude the extra day used for calculation)
    const displayData = React.useMemo(() => {
        if (priceData.length <= timeframe) return priceData;
        // Return only the requested number of days (exclude the extra day)
        return priceData.slice(-timeframe);
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-primary">Historical Data</h1>
                <p className="text-secondary text-sm font-mono">View historical price data for any asset</p>
            </div>

            {/* Controls */}
            <div className="bg-surface border border-border rounded-xl p-4 space-y-4 shadow-sm">
                {/* Asset Type Selection */}
                <div>
                    <label className="text-xs text-secondary uppercase tracking-wider mb-2 block">Asset Type</label>
                    <AssetTypeSelector value={assetType} onChange={setAssetType} />
                </div>

                {/* Asset Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-secondary uppercase tracking-wider mb-2 block">Select Asset</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-primary font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className={`p-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 min-w-[54px] h-[44px] relative z-30 active:scale-90 cursor-pointer touch-manipulation
                                    ${isWatchlisted
                                        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 shadow-sm shadow-yellow-500/10'
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-secondary hover:text-primary hover:border-slate-400'
                                    }`}
                                title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                            >
                                <Star className={`w-5 h-5 pointer-events-none transition-transform duration-300 ${isWatchlisted ? 'fill-yellow-500 scale-110' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-secondary uppercase tracking-wider mb-2 block">Timeframe</label>
                        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
                    </div>
                </div>
            </div>

            {/* Current Asset Info */}
            {selectedAsset && (
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold font-mono text-primary">{selectedAsset.symbol}</h2>
                                <p className="text-sm text-secondary">{selectedAsset.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-mono font-bold text-primary">
                                ${selectedAsset.price?.toLocaleString()}
                            </div>
                            <div className={`font-mono ${selectedAsset.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change?.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary">
                        Price History ({timeframe} days)
                    </h3>
                    {stats && (
                        <div className={`flex items-center gap-1 text-sm font-mono ${stats.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {stats.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{Math.abs(stats.change).toFixed(2)}%</span>
                        </div>
                    )}
                </div>

                <div className="h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center gap-2 h-full text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    ) : displayData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData}>
                                <defs>
                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={stats?.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={stats?.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => `$${val.toLocaleString()}`}
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
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="close"
                                    stroke={stats?.change >= 0 ? '#22c55e' : '#ef4444'}
                                    fillOpacity={1}
                                    fill="url(#priceGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-secondary">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-secondary uppercase tracking-wider mb-1">Period High</div>
                        <div className="text-lg font-mono font-bold text-green-600 dark:text-green-400">${stats.high.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-secondary uppercase tracking-wider mb-1">Period Low</div>
                        <div className="text-lg font-mono font-bold text-red-600 dark:text-red-400">${stats.low.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-secondary uppercase tracking-wider mb-1">Average</div>
                        <div className="text-lg font-mono font-bold text-primary">${stats.avg.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-secondary uppercase tracking-wider mb-1">Change</div>
                        <div className={`text-lg font-mono font-bold ${stats.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {priceData.length > 0 && (
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border">
                        <h3 className="font-semibold text-primary">Price Data ({displayData.length} days)</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-slate-100 dark:bg-slate-800/50 sticky top-0">
                                <tr>
                                    <th className="text-left px-4 py-2 text-xs text-secondary uppercase tracking-wider">Date</th>
                                    <th className="text-right px-4 py-2 text-xs text-secondary uppercase tracking-wider">Close Price</th>
                                    <th className="text-right px-4 py-2 text-xs text-secondary uppercase tracking-wider">Daily Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Use full priceData for daily change calc, but only show displayData rows */}
                                {(() => {
                                    const fullDataReversed = [...priceData].reverse();
                                    const displaySet = new Set(displayData.map(d => d.date));

                                    return fullDataReversed
                                        .filter(row => displaySet.has(row.date))
                                        .slice(0, visibleRows)
                                        .map((row, idx) => {
                                            // Find this row's index in full reversed data for prev price
                                            const fullIdx = fullDataReversed.findIndex(d => d.date === row.date);
                                            const prevClose = fullDataReversed[fullIdx + 1]?.close;
                                            const hasChange = prevClose !== undefined && prevClose !== null;
                                            const change = hasChange ? ((row.close - prevClose) / prevClose) * 100 : null;
                                            return (
                                                <tr key={row.date} className="border-t border-border hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-2 font-mono text-sm text-primary">{row.date}</td>
                                                    <td className="px-4 py-2 font-mono text-sm text-primary text-right">
                                                        ${row.close.toLocaleString()}
                                                    </td>
                                                    <td className={`px-4 py-2 font-mono text-sm text-right ${change === null
                                                        ? 'text-secondary'
                                                        : change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
                    {/* Show More Button */}
                    {priceData.length > visibleRows && (
                        <div className="p-3 border-t border-border bg-slate-50 dark:bg-slate-800/50 text-center">
                            <button
                                onClick={() => setVisibleRows(prev => Math.min(prev + 30, priceData.length))}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                Show More Rows ({Math.min(priceData.length - visibleRows, 30)} more)
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
