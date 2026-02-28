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
    ArrowRightLeft,
    Coins,
    Pickaxe
} from 'lucide-react';
import useMarketStore from '../store';
import { apiManager } from '../services/apiManager';
import AssetIcon from '../components/AssetIcon';

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

    const formatPrice = (price) => {
        if (!price) return '$0.00';
        return price < 1 ? `$${price.toFixed(4)}` : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatMarketCap = (marketCap) => {
        if (!marketCap) return '$0.00';
        if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
        if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
        if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
        return `$${marketCap.toLocaleString()}`;
    };

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-[#0B0F19] dark:to-slate-900 p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Global Markets
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Real-time tracking of crypto, equity, and commodity flows.
                        </p>
                    </div>
                    <div className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                            {time} EST
                        </span>
                    </div>
                </div>

                {/* THE BENTO GRID */}
                <div className="bento-grid">

                    {/* 1. Heatmap Hero (Massive Focal Point) */}
                    <div className="bento-card bento-col-span-full xl:col-span-5 bento-row-span-3 p-8 flex flex-col justify-between group">
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none transition-all duration-700 group-hover:bg-blue-500/30"></div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                                <Globe className="w-4 h-4" /> Live Market Pulse
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
                                Immersive<br />Heatmap
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mb-8">
                                Experience a complete visual breakdown of Crypto, Equities, and Commodities simultaneously. Identify macro momentum instantly.
                            </p>
                            <Link to="/heatmap" className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1">
                                Launch Heatmap
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </div>
                        {/* Decorative Chart Graphic */}
                        <div className="absolute right-0 bottom-0 w-1/2 h-2/3 opacity-20 pointer-events-none bg-gradient-to-tl from-slate-900 to-transparent mask-image-b-to-t"></div>
                    </div>

                    {/* 2. Top Movers Module (Tall Right Column) */}
                    <div className="bento-card bento-col-span-full md:col-span-4 xl:col-span-3 bento-row-span-4 flex flex-col min-h-[635px]">
                        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-md">
                            <h3 className="text-xl font-bold flex items-center text-slate-900 dark:text-white">
                                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                                Top Movers
                            </h3>
                            <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
                                {['crypto', 'stocks', 'commodities'].map(market => (
                                    <button
                                        key={market}
                                        onClick={() => setSelectedTrendingMarket(market)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${selectedTrendingMarket === market
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {market}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {trendingAssets.slice(0, 6).map((asset) => (
                                    <Link key={asset.symbol} to={`/asset/${selectedTrendingMarket}/${asset.symbol}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <AssetIcon symbol={asset.symbol} market={selectedTrendingMarket} size={40} className="group-hover:scale-110 transition-transform shadow-sm" />
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-500 transition-colors uppercase">{asset.symbol}</div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[120px]">{asset.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900 dark:text-white">{formatPrice(asset.price)}</div>
                                            <div className={`text-sm font-bold flex items-center justify-end mt-1 ${asset.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Market Stat Summary Cards (Horizontal spanning) */}
                    <div className="bento-card bento-col-span-full xl:col-span-5 bento-row-span-1 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/50 dark:divide-slate-800/50 bg-white/40 dark:bg-slate-900/40">
                        {[
                            { title: 'Global Crypto', data: marketOverview.crypto, icon: Coins, color: 'text-purple-500' },
                            { title: 'US Equities', data: marketOverview.stocks, icon: TrendingUp, color: 'text-blue-500' },
                            { title: 'Commodities', data: marketOverview.commodities, icon: Pickaxe, color: 'text-amber-500' }
                        ].map((stat, i) => (
                            <div key={i} className="p-6 flex flex-col justify-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                <div className="flex items-center gap-3 mb-3">
                                    <stat.icon className={`w-5 h-5 ${stat.color} group-hover:scale-125 transition-transform`} />
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.title}</span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                    {formatMarketCap(stat.data.total)}
                                </div>
                                <div className={`text-sm font-bold flex items-center ${stat.data.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stat.data.change >= 0 ? '↑' : '↓'} {Math.abs(stat.data.change).toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 4. Quick Actions / Nav */}
                    <Link to="/compare" className="bento-card bento-col-span-2 bento-row-span-1 p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-500 to-purple-600 text-white group hover:shadow-indigo-500/25">
                        <ArrowRightLeft className="w-8 h-8 opacity-80 group-hover:scale-110 group-hover:rotate-12 transition-all" />
                        <div>
                            <h3 className="text-xl font-bold mb-1">Compare</h3>
                            <p className="text-sm text-white/80 font-medium">Side-by-side analysis &rarr;</p>
                        </div>
                    </Link>

                    <Link to="/watchlist" className="bento-card bento-col-span-2 bento-row-span-1 p-6 flex flex-col justify-between bg-gradient-to-br from-orange-500 to-pink-600 text-white group hover:shadow-orange-500/25">
                        <Search className="w-8 h-8 opacity-80 group-hover:scale-110 transition-all" />
                        <div>
                            <h3 className="text-xl font-bold mb-1">Watchlist</h3>
                            <p className="text-sm text-white/80 font-medium">Track your favorites &rarr;</p>
                        </div>
                    </Link>

                    {/* 5. Educational Snippet */}
                    <div className="bento-card bento-col-span-full md:col-span-4 xl:col-span-4 bento-row-span-1 p-6 flex items-center gap-6 bg-slate-900 text-white dark:bg-slate-800 border-none group">
                        <div className="p-4 bg-blue-500/20 rounded-2xl shrink-0 group-hover:bg-blue-500/30 transition-colors">
                            <Lightbulb className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Pro Tip: Heatmap Reading</h3>
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
                                <span className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></span> Positive flow</span>
                                <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-sm mr-2"></span> Negative flow</span>
                                <span className="flex items-center"><span className="w-6 h-3 bg-slate-500 rounded-sm mr-2"></span> Market Cap Size</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
