import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Coins, Pickaxe, LayoutGrid, Star, Search, BarChart3, ArrowRight, Trash2 } from 'lucide-react';
import apiManager from '../services/apiManager';
import { useAuth } from '../context/AuthContext';
import { watchlistService } from '../services/watchlistService';
import { getSymbolFromId } from '../config/cryptoMapping';
import AssetIcon from '../components/AssetIcon';

export default function Watchlist() {
    const { currentUser } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [watchlistData, setWatchlistData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    const formatPrice = (price) => {
        if (!price) return '$0.00';
        return price < 1 ? `$${price.toFixed(4)}` : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    useEffect(() => {
        let unsubscribe = () => { };

        const initializeWatchlist = async () => {
            if (currentUser) {
                // Real-time subscription for logged-in users
                unsubscribe = watchlistService.subscribeToWatchlist(currentUser.uid, (list) => {
                    setWatchlist(list);
                    loadWatchlistData(list);
                });
            } else {
                // Fallback to localStorage for guests
                let stored = JSON.parse(localStorage.getItem('watchlist') || '[]');

                // Auto-migrate legacy CoinGecko IDs to standard Symbols
                let wasMigrated = false;
                stored = stored.map(item => {
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
                    localStorage.setItem('watchlist', JSON.stringify(stored));
                }

                setWatchlist(stored);
                loadWatchlistData(stored);
            }
        };

        initializeWatchlist();
        return () => unsubscribe();
    }, [currentUser]);

    const loadWatchlistData = async (list) => {
        setIsLoading(true);
        try {
            const [stocks, crypto, commodities] = await Promise.all([
                apiManager.getMarketData('stocks'),
                apiManager.getMarketData('crypto'),
                apiManager.getMarketData('commodities'),
            ]);

            const allAssets = [...stocks, ...crypto, ...commodities];

            const enriched = list.map(item => {
                // Try to find by symbol (case insensitive)
                let asset = allAssets.find(a => a.symbol.toUpperCase() === item.symbol?.toUpperCase());

                // Fallback: If it's crypto and we have an ID like 'bitcoin', map it back to symbol
                if (!asset && item.id) {
                    const symbolFromId = getSymbolFromId(item.id);
                    if (symbolFromId) {
                        asset = allAssets.find(a => a.symbol.toUpperCase() === symbolFromId.toUpperCase());
                    }
                }

                // Preserve the original list item's ID as firestoreId, 
                // because spreading ...asset will overwrite item.id with the API's id (e.g. 'bitcoin')
                return asset ? { ...item, ...asset, firestoreId: item.id } : { ...item, firestoreId: item.id };
            }).filter(item => item.price);

            setWatchlistData(enriched);
        } catch (error) {
            console.error('Failed to load watchlist data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromWatchlist = async (asset) => {
        if (currentUser) {
            try {
                if (asset.firestoreId) {
                    await watchlistService.removeByExactId(currentUser.uid, asset.firestoreId);
                } else {
                    const symbolOrId = asset.symbol || asset.id;
                    await watchlistService.removeFromWatchlist(currentUser.uid, symbolOrId);
                }
            } catch (error) {
                console.error("Failed to remove from watchlist:", error);
            }
        } else {
            const coinGeckoId = getCoinGeckoId(asset.symbol);
            const upperSymbol = asset.symbol?.toUpperCase();

            const updated = watchlist.filter(w => {
                const wUpper = w.symbol?.toUpperCase();
                const wIdUpper = w.id?.toUpperCase();

                const isMatch = wUpper === upperSymbol ||
                    (wIdUpper === upperSymbol) ||
                    (coinGeckoId && (wUpper === coinGeckoId.toUpperCase() || wIdUpper === coinGeckoId.toUpperCase()));

                return !isMatch;
            });
            localStorage.setItem('watchlist', JSON.stringify(updated));
            setWatchlist(updated);
            setWatchlistData(watchlistData.filter(w => w.symbol !== asset.symbol));
        }
    };

    const getMarketIcon = (market) => {
        switch (market) {
            case 'stocks': return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 'crypto': return <Coins className="w-5 h-5 text-purple-500" />;
            case 'commodities': return <Pickaxe className="w-5 h-5 text-amber-500" />;
            default: return <LayoutGrid className="w-5 h-5 text-slate-500" />;
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
                    <span className="text-slate-400 font-mono">Loading watchlist...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gradient-premium mb-2">My Watchlist</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {watchlistData.length} assets actively tracked
                        </p>
                    </div>
                </div>

                {/* Watchlist Grid */}
                {watchlistData.length > 0 ? (
                    <div className="bento-grid">
                        {(showAll ? watchlistData : watchlistData.slice(0, 12)).map((asset) => {
                            const isUp = asset.change >= 0;
                            const accentColor = isUp ? 'emerald' : 'red';

                            // Generate mini sparkline points
                            const sparkPoints = [];
                            let y = 50;
                            for (let i = 0; i < 20; i++) {
                                y = Math.max(10, Math.min(90, y + (Math.random() - (isUp ? 0.4 : 0.6)) * 15));
                                sparkPoints.push(`${(i / 19) * 140},${y}`);
                            }
                            const sparkPath = sparkPoints.join(' ');

                            return (
                                <div key={asset.symbol} className={`bento-card bento-col-span-1 md:col-span-2 p-5 flex flex-col justify-between group hover:border-${accentColor}-400 dark:hover:border-${accentColor}-500 hover:shadow-xl hover:shadow-${accentColor}-500/10`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <Link to={`/asset/${asset.market}/${asset.symbol}`} className="flex items-center gap-3">
                                            <AssetIcon
                                                symbol={asset.symbol}
                                                market={asset.market}
                                                size={40}
                                                className="group-hover:scale-110 transition-transform shadow-sm"
                                            />
                                            <div>
                                                <div className="font-mono font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase">{asset.symbol}</div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{asset.name}</div>
                                            </div>
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/asset/${asset.market}/${asset.symbol}`}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemove(asset);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Remove from watchlist"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mini Sparkline */}
                                    <div className="my-2 -mx-1 pointer-events-none">
                                        <svg width="100%" height="40" viewBox="0 0 148 100" preserveAspectRatio="none" className="h-10">
                                            <defs>
                                                <linearGradient id={`spark-grad-watch-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <polyline
                                                points={sparkPath}
                                                fill="none"
                                                stroke={isUp ? '#10b981' : '#ef4444'}
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <polygon
                                                points={`0,100 ${sparkPath} 140,100`}
                                                fill={`url(#spark-grad-watch-${asset.symbol})`}
                                            />
                                        </svg>
                                    </div>

                                    <div className="flex items-end justify-between mt-2">
                                        <div className="text-xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                                            {formatPrice(asset.price)}
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-bold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bento-card bento-col-span-full p-12 flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <Star className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your watchlist is empty</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                            Start tracking your favorite assets to see them appear here in real-time.
                        </p>
                        <Link
                            to="/markets"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
                        >
                            Explore Markets
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                )}

                {watchlistData.length > 5 && !showAll && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => setShowAll(true)}
                            className="inline-flex items-center px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all shadow-sm group"
                        >
                            View All Assets
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
