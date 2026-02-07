import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';
import apiManager from '../services/apiManager';

export default function AssetDetail() {
    const { market, symbol } = useParams();
    const [asset, setAsset] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [timeframe, setTimeframe] = useState('1M');
    const [isLoading, setIsLoading] = useState(true);
    const [isWatchlisted, setIsWatchlisted] = useState(false);

    useEffect(() => {
        async function loadAsset() {
            setIsLoading(true);
            try {
                const data = await apiManager.getMarketData(market);
                const found = data.find(a => a.symbol === symbol);
                setAsset(found);

                // Check watchlist
                const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
                setIsWatchlisted(watchlist.some(w => w.symbol === symbol));

                // Generate chart data
                generateChartData(found, timeframe);
            } catch (error) {
                console.error('Failed to load asset:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadAsset();
    }, [market, symbol, timeframe]);

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

    const toggleWatchlist = () => {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

        if (isWatchlisted) {
            const updated = watchlist.filter(w => w.symbol !== symbol);
            localStorage.setItem('watchlist', JSON.stringify(updated));
            setIsWatchlisted(false);
        } else {
            watchlist.push({ symbol, market, name: asset?.name });
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            setIsWatchlisted(true);
        }
    };

    const getMarketIcon = () => {
        switch (market) {
            case 'stocks': return '📈';
            case 'crypto': return '₿';
            case 'commodities': return '🛢️';
            default: return '📊';
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
                    <span className="text-slate-400 font-mono">Loading {symbol}...</span>
                </div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="p-6">
                <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
                    <span className="text-4xl mb-4 block">❓</span>
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
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                        {getMarketIcon()}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-primary">{asset.symbol}</h1>
                            <span className="text-xs uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 text-secondary rounded font-medium">
                                {market}
                            </span>
                        </div>
                        <p className="text-secondary">{asset.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleWatchlist}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isWatchlisted
                            ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span>{isWatchlisted ? '⭐' : '☆'}</span>
                        <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
                    </button>
                    <Link
                        to="/compare"
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <span>⚖️</span>
                        <span>Compare</span>
                    </Link>
                </div>
            </div>

            {/* Price Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-secondary mb-1">Current Price</div>
                    <div className="text-3xl font-bold font-mono text-primary">
                        ${asset.price?.toLocaleString()}
                    </div>
                    <div className={`flex items-center gap-2 mt-2 ${asset.change >= 0 ? 'text-green-600 dark:text-gain-bright' : 'text-red-600 dark:text-loss-bright'}`}>
                        <span className="text-lg">{asset.change >= 0 ? '↑' : '↓'}</span>
                        <span className="font-mono">{asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%</span>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-secondary mb-1">Market Cap</div>
                    <div className="text-xl font-mono text-primary">
                        {asset.marketCap >= 1e12
                            ? `$${(asset.marketCap / 1e12).toFixed(2)}T`
                            : asset.marketCap >= 1e9
                                ? `$${(asset.marketCap / 1e9).toFixed(2)}B`
                                : `$${(asset.marketCap / 1e6).toFixed(2)}M`
                        }
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-secondary mb-1">24h High</div>
                    <div className="text-xl font-mono text-green-600 dark:text-gain-bright">
                        ${(asset.price * 1.02).toFixed(2)}
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-secondary mb-1">24h Low</div>
                    <div className="text-xl font-mono text-red-600 dark:text-loss-bright">
                        ${(asset.price * 0.98).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary">Price Chart</h3>
                    <div className="flex gap-2">
                        {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1 text-sm font-mono rounded transition-colors ${timeframe === tf
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-secondary uppercase tracking-wider mb-1">Volume (24h)</div>
                    <div className="text-lg font-mono text-primary">$4.2B</div>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-secondary uppercase tracking-wider mb-1">Open</div>
                    <div className="text-lg font-mono text-primary">${(asset.price * 0.995).toFixed(2)}</div>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-secondary uppercase tracking-wider mb-1">Prev Close</div>
                    <div className="text-lg font-mono text-primary">${(asset.price * 0.99).toFixed(2)}</div>
                </div>
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-secondary uppercase tracking-wider mb-1">52W Range</div>
                    <div className="text-lg font-mono text-primary">${(asset.price * 0.7).toFixed(0)} - ${(asset.price * 1.3).toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
}
