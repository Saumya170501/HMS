import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Coins, Pickaxe, LayoutGrid, HelpCircle, Star, Scale } from 'lucide-react';
import apiManager from '../services/apiManager';
import useMarketStore from '../store';
import { useAuth } from '../context/AuthContext';
import { watchlistService } from '../services/watchlistService';
import { getCoinGeckoId, getSymbolFromId } from '../config/cryptoMapping';

export default function AssetDetail() {
    const { market, symbol } = useParams();
    const { currentUser } = useAuth();
    const userId = currentUser?.uid;
    const [asset, setAsset] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [timeframe, setTimeframe] = useState('1M');
    const [isLoading, setIsLoading] = useState(true);
    const [isWatchlisted, setIsWatchlisted] = useState(false);

    // Subscribe to live market data from WebSocket store
    const marketData = useMarketStore(state => state.marketData);

    // Keep asset price/change in sync with live WebSocket data
    useEffect(() => {
        if (!asset || !marketData[market]) return;
        const liveAsset = marketData[market].find(a => a.symbol === symbol);
        if (liveAsset && (liveAsset.price !== asset.price || liveAsset.change !== asset.change)) {
            setAsset(prev => ({ ...prev, price: liveAsset.price, change: liveAsset.change }));
        }
    }, [marketData, market, symbol]);

    useEffect(() => {
        async function loadAsset() {
            setIsLoading(true);
            try {
                const data = await apiManager.getMarketData(market);
                const found = data.find(a => a.symbol === symbol);
                setAsset(found);

                // Check watchlist (case-insensitive and ID-aware)
                if (userId) {
                    const inWatchlist = await watchlistService.isInWatchlist(userId, symbol);
                    setIsWatchlisted(inWatchlist);
                } else {
                    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

                    // Auto-migrate legacy CoinGecko IDs to standard Symbols
                    let wasMigrated = false;
                    watchlist = watchlist.map(item => {
                        const idAsSymbol = getSymbolFromId(item.id);
                        const symbolAsSymbol = getSymbolFromId(item.symbol);
                        const mappedSymbol = idAsSymbol || symbolAsSymbol;

                        if (mappedSymbol && mappedSymbol !== item.symbol) {
                            wasMigrated = true;
                            return { ...item, symbol: mappedSymbol, id: mappedSymbol };
                        }
                        return item;
                    });

                    if (wasMigrated) {
                        localStorage.setItem('watchlist', JSON.stringify(watchlist));
                    }

                    const coinGeckoId = getCoinGeckoId(symbol);
                    const upperSymbol = symbol.toUpperCase();
                    const match = watchlist.find(w => {
                        const wUpper = w.symbol?.toUpperCase();
                        const wIdUpper = w.id?.toUpperCase();
                        return wUpper === upperSymbol ||
                            (wIdUpper === upperSymbol) ||
                            (coinGeckoId && (wUpper === coinGeckoId.toUpperCase() || wIdUpper === coinGeckoId.toUpperCase()));
                    });
                    setIsWatchlisted(match ? match.id || match.symbol : false);
                }

                // Generate chart data
                generateChartData(found, timeframe);
            } catch (error) {
                console.error('Failed to load asset:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadAsset();
    }, [market, symbol, timeframe, currentUser]);

    const generateChartData = (assetData, tf) => {
        if (!assetData) return;

        const days = tf === '1D' ? 1 : tf === '1W' ? 7 : tf === '1M' ? 30 : tf === '3M' ? 90 : 365;
        const data = [];
        let price = assetData.price;

        const intervals = tf === '1D' ? 24 : days;

        for (let i = intervals; i >= 0; i--) {
            const date = new Date();
            if (tf === '1D') {
                date.setHours(date.getHours() - i);
            } else {
                date.setDate(date.getDate() - i);
            }

            // Random walk
            price = price * (1 + (Math.random() - 0.5) * 0.02);

            data.push({
                time: tf === '1D'
                    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                price: parseFloat(price.toFixed(2)),
                volume: Math.floor(Math.random() * 1000000),
            });
        }

        setChartData(data);
    };

    const toggleWatchlist = async () => {
        if (userId) {
            try {
                if (isWatchlisted) {
                    await watchlistService.removeByExactId(userId, typeof isWatchlisted === 'string' ? isWatchlisted : symbol);
                } else {
                    await watchlistService.addToWatchlist(userId, { symbol, market, name: asset?.name });
                }
                setIsWatchlisted(isWatchlisted ? false : symbol.toUpperCase());
            } catch (error) {
                console.error('Watchlist operation failed:', error);
            }
        } else {
            const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
            const coinGeckoId = getCoinGeckoId(symbol);
            const upperSymbol = symbol.toUpperCase();

            if (isWatchlisted) {
                const updated = watchlist.filter(w => {
                    const wUpper = w.symbol?.toUpperCase();
                    const wIdUpper = w.id?.toUpperCase();

                    const isMatch = wUpper === upperSymbol ||
                        (wIdUpper === upperSymbol) ||
                        (coinGeckoId && (wUpper === coinGeckoId.toUpperCase() || wIdUpper === coinGeckoId.toUpperCase()));

                    return !isMatch;
                });
                localStorage.setItem('watchlist', JSON.stringify(updated));
                setIsWatchlisted(false);
            } else {
                watchlist.push({ symbol, market, name: asset?.name });
                localStorage.setItem('watchlist', JSON.stringify(watchlist));
                setIsWatchlisted(symbol.toUpperCase());
            }
        }
    };

    const getMarketIcon = () => {
        switch (market) {
            case 'stocks': return <TrendingUp className="w-8 h-8 text-white" />;
            case 'crypto': return <Coins className="w-8 h-8 text-white" />;
            case 'commodities': return <Pickaxe className="w-8 h-8 text-white" />;
            default: return <LayoutGrid className="w-8 h-8 text-white" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 ">Loading {symbol}...</span>
                </div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="p-6">
                <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
                    <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Asset Not Found</h3>
                    <p className="text-slate-500 text-sm mb-4">
                        Could not find {symbol} in {market}
                    </p>
                    <Link to="/" className="text-blue-400 hover:text-blue-300">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            {getMarketIcon()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{asset.symbol}</h1>
                                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-lg tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                                    {market}
                                </span>
                            </div>
                            <p className="text-base font-medium text-slate-500 dark:text-slate-400">{asset.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={toggleWatchlist}
                            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm ${isWatchlisted
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-700'
                                }`}
                        >
                            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                            <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
                        </button>
                        <Link
                            to="/compare"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 font-bold transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5"
                        >
                            <Scale className="w-4 h-4" />
                            <span>Compare</span>
                        </Link>
                    </div>
                </div>

                <div className="bento-grid">
                    {/* Top Row Cards */}
                    <div className="bento-card bento-col-span-full md:col-span-6 xl:col-span-3 p-6 flex flex-col justify-center group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-16 h-16" />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-2 relative z-10">Current Price</div>
                        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter relative z-10">
                            ${asset.price?.toLocaleString()}
                        </div>
                        <div className={`flex items-center gap-2 mt-3 text-sm font-bold relative z-10 ${asset.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {asset.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="">{asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%</span>
                        </div>
                    </div>

                    <div className="bento-card bento-col-span-full md:col-span-6 xl:col-span-3 p-6 flex flex-col justify-center group">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-2">Market Cap</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter ">
                            {asset.marketCap >= 1e12
                                ? `$${(asset.marketCap / 1e12).toFixed(2)}T`
                                : asset.marketCap >= 1e9
                                    ? `$${(asset.marketCap / 1e9).toFixed(2)}B`
                                    : `$${(asset.marketCap / 1e6).toFixed(2)}M`
                            }
                        </div>
                    </div>

                    <div className="bento-card bento-col-span-full md:col-span-6 xl:col-span-3 p-6 flex flex-col justify-center group">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-2">24h High</div>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter ">
                            ${(asset.price * 1.02).toFixed(2)}
                        </div>
                    </div>

                    <div className="bento-card bento-col-span-full md:col-span-6 xl:col-span-3 p-6 flex flex-col justify-center group">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-2">24h Low</div>
                        <div className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tighter ">
                            ${(asset.price * 0.98).toFixed(2)}
                        </div>
                    </div>

                    {/* Chart Main Section */}
                    <div className="bento-card bento-col-span-full lg:col-span-8 bento-row-span-2 p-6 flex flex-col group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Price Chart
                            </h3>
                            <div className="flex flex-wrap gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === tf
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={asset.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={asset.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="var(--text-secondary)"
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                        domain={['auto', 'auto']}
                                        tickFormatter={(val) => `$${val}`}
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
                                        formatter={(value) => [`$${value}`, 'Price']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke={asset.change >= 0 ? '#22c55e' : '#ef4444'}
                                        fillOpacity={1}
                                        fill="url(#priceGradient)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Sidebar */}
                <div className="bento-card bento-col-span-full lg:col-span-4 bento-row-span-2 p-6 flex flex-col group">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                        <LayoutGrid className="w-5 h-5 text-purple-500" />
                        Quick Stats
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-around">
                        <div className="group/stat bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1.5 flex justify-between">
                                <span>Volume (24h)</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white ">$4.2B</div>
                        </div>
                        <div className="group/stat bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1.5 flex justify-between">
                                <span>Open</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white ">${(asset.price * 0.995).toFixed(2)}</div>
                        </div>
                        <div className="group/stat bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1.5 flex justify-between">
                                <span>Prev Close</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white ">${(asset.price * 0.99).toFixed(2)}</div>
                        </div>
                        <div className="group/stat bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1.5 flex justify-between">
                                <span>52W Range</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white ">${(asset.price * 0.7).toFixed(0)} - ${(asset.price * 1.3).toFixed(0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
