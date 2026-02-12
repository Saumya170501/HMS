import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Zap,
    Droplet,
    Wallet,
    Globe,
    BarChart3,
    Search,
    Lightbulb,
    ArrowRight,
    ChevronRight,
    Activity,
    ArrowRightLeft
} from 'lucide-react';
import useMarketStore from '../store';
import { apiManager } from '../services/apiManager';

export default function Dashboard() {
    const navigate = useNavigate();
    const marketData = useMarketStore(state => state.marketData);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTrendingMarket, setSelectedTrendingMarket] = useState('stocks');
    const [trendingAssets, setTrendingAssets] = useState([]);
    const [marketOverview, setMarketOverview] = useState({
        stocks: { total: 0, change: 0 },
        crypto: { total: 0, change: 0 },
        commodities: { total: 0, change: 0 }
    });

    useEffect(() => {
        calculateMarketOverview();
        calculateTrending();
    }, [marketData, selectedTrendingMarket]);

    const calculateMarketOverview = () => {
        const stocks = marketData.stocks || [];
        const crypto = marketData.crypto || [];
        const commodities = marketData.commodities || [];

        const stocksTotal = stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
        const stocksChange = stocks.length > 0
            ? stocks.reduce((sum, s) => sum + (s.change || 0), 0) / stocks.length
            : 0;

        const cryptoTotal = crypto.reduce((sum, c) => sum + (c.marketCap || 0), 0);
        const cryptoChange = crypto.length > 0
            ? crypto.reduce((sum, c) => sum + (c.change || 0), 0) / crypto.length
            : 0;

        const commoditiesTotal = commodities.reduce((sum, c) => sum + (c.marketCap || 0), 0);
        const commoditiesChange = commodities.length > 0
            ? commodities.reduce((sum, c) => sum + (c.change || 0), 0) / commodities.length
            : 0;

        setMarketOverview({
            stocks: { total: stocksTotal, change: stocksChange },
            crypto: { total: cryptoTotal, change: cryptoChange },
            commodities: { total: commoditiesTotal, change: commoditiesChange }
        });
    };

    const calculateTrending = () => {
        // Get assets from the selected market only
        let assets = [];
        switch (selectedTrendingMarket) {
            case 'stocks':
                assets = (marketData.stocks || []).map(s => ({ ...s, market: 'stocks' }));
                break;
            case 'crypto':
                assets = (marketData.crypto || []).map(c => ({ ...c, market: 'crypto' }));
                break;
            case 'commodities':
                assets = (marketData.commodities || []).map(c => ({ ...c, market: 'commodities' }));
                break;
            default:
                assets = [];
        }

        const sorted = assets
            .filter(a => a.change !== undefined)
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 6);

        setTrendingAssets(sorted);
    };

    const formatMarketCap = (value) => {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toFixed(0)}`;
    };

    const categories = [
        {
            id: 'heatmap',
            title: 'Market Heatmap',
            icon: BarChart3,
            description: 'View all markets (Stocks, Crypto, Commodities)',
            actionText: 'View heatmap',
            color: 'from-blue-500 to-purple-500',
            route: '/heatmap'
        },
        {
            id: 'compare',
            title: 'Compare Assets',
            icon: ArrowRightLeft,
            description: 'Side-by-side asset comparison',
            actionText: 'Compare now',
            color: 'from-green-500 to-emerald-500',
            route: '/compare'
        },
        {
            id: 'watchlist',
            title: 'My Watchlist',
            icon: Search,
            description: 'Your custom tracked assets',
            actionText: 'View watchlist',
            color: 'from-orange-500 to-red-500',
            route: '/watchlist'
        }
    ];

    const getCurrentTime = () => {
        const now = new Date();
        const estTime = now.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const date = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        return { time: estTime, date };
    };

    const { time, date } = getCurrentTime();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
            <div className="max-w-[1920px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            MarketVue PRO
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-900/5 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold text-slate-900 dark:text-slate-100">Time: {time} EST</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Market Overview Cards */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Market Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Stocks */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Stocks</span>
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {formatMarketCap(marketOverview.stocks.total)}
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${marketOverview.stocks.change >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {marketOverview.stocks.change >= 0 ? '↑' : '↓'} {Math.abs(marketOverview.stocks.change).toFixed(2)}%
                            </div>
                        </div>

                        {/* Crypto */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Crypto</span>
                                <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {formatMarketCap(marketOverview.crypto.total)}
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${marketOverview.crypto.change >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {marketOverview.crypto.change >= 0 ? '↑' : '↓'} {Math.abs(marketOverview.crypto.change).toFixed(2)}%
                            </div>
                        </div>

                        {/* Commodities */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Commodity</span>
                                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {formatMarketCap(marketOverview.commodities.total)}
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${marketOverview.commodities.change >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {marketOverview.commodities.change >= 0 ? '↑' : '↓'} {Math.abs(marketOverview.commodities.change).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            "Which Markets Are Hot?"
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Select a category to explore
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => navigate(category.route)}
                                    className="group relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:scale-105 text-left"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />

                                    <div className="relative">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                                {category.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                            {category.description}
                                        </p>
                                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                                            {category.actionText} <ChevronRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Educational Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500 rounded-xl">
                            <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                                How to Read the Heatmap
                            </h3>
                            <div className="flex flex-wrap gap-6 text-sm text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                                    <span><strong>Green</strong> = Stock up</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                                    <span><strong>Red</strong> = Stock down</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-4 bg-slate-400 rounded"></div>
                                    <span><strong>Size</strong> = Market cap</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Trending */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            Top Trending (Last 24 Hours)
                        </h2>
                    </div>

                    {/* Market Selection Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setSelectedTrendingMarket('stocks')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${selectedTrendingMarket === 'stocks'
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            📈 Stocks
                        </button>
                        <button
                            onClick={() => setSelectedTrendingMarket('crypto')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${selectedTrendingMarket === 'crypto'
                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            💰 Crypto
                        </button>
                        <button
                            onClick={() => setSelectedTrendingMarket('commodities')}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${selectedTrendingMarket === 'commodities'
                                ? 'bg-amber-600 text-white shadow-lg scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            ⚡ Commodities
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {trendingAssets.map((asset, index) => {
                            const marketColors = {
                                stocks: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                                crypto: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                                commodities: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            };
                            const marketLabels = {
                                stocks: 'Stock',
                                crypto: 'Crypto',
                                commodities: 'Commodity'
                            };

                            return (
                                <Link
                                    key={`${asset.symbol}-${index}`}
                                    to={`/asset/${asset.market}/${asset.symbol}`}
                                    className="group p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            #{index + 1}
                                        </span>
                                        {asset.change >= 0 ? (
                                            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                        {asset.symbol}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                        ${asset.price?.toFixed(2) || '0.00'}
                                    </div>
                                    <div className={`text-xs px-2 py-0.5 rounded-full border mb-2 inline-block ${marketColors[asset.market]}`}>
                                        {marketLabels[asset.market]}
                                    </div>
                                    <div className={`text-sm font-semibold ${asset.change >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {asset.change >= 0 ? '↑' : '↓'}{Math.abs(asset.change).toFixed(2)}%
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/portfolio"
                        className="group bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                        <Wallet className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Portfolio</h3>
                        <p className="text-sm opacity-90 mb-3">Track your investments</p>
                        <div className="flex items-center text-sm font-semibold group-hover:translate-x-2 transition-transform">
                            View Portfolio <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </Link>

                    <Link
                        to="/analytics"
                        className="group bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                        <BarChart3 className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Analytics</h3>
                        <p className="text-sm opacity-90 mb-3">Advanced insights</p>
                        <div className="flex items-center text-sm font-semibold group-hover:translate-x-2 transition-transform">
                            View Analytics <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </Link>

                    <Link
                        to="/alerts"
                        className="group bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                        <Zap className="w-8 h-8 mb-3 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Alerts</h3>
                        <p className="text-sm opacity-90 mb-3">Price notifications</p>
                        <div className="flex items-center text-sm font-semibold group-hover:translate-x-2 transition-transform">
                            Manage Alerts <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </Link>
                </div>

            </div>
        </div>
    );
}
