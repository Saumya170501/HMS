import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Coins, Pickaxe, LayoutGrid, Star, Search, BarChart3 } from 'lucide-react';
import apiManager from '../services/apiManager';
import { useAuth } from '../context/AuthContext';
import { watchlistService } from '../services/watchlistService';
import AssetIcon from '../components/AssetIcon';

export default function Watchlist() {
    const { currentUser } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [watchlistData, setWatchlistData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                const stored = JSON.parse(localStorage.getItem('watchlist') || '[]');
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
                const asset = allAssets.find(a => a.symbol === item.symbol);
                return asset ? { ...item, ...asset } : item;
            }).filter(item => item.price);

            setWatchlistData(enriched);
        } catch (error) {
            console.error('Failed to load watchlist data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromWatchlist = async (symbol) => {
        if (currentUser) {
            try {
                await watchlistService.removeFromWatchlist(currentUser.uid, symbol);
                // State updates via subscription
            } catch (error) {
                console.error("Failed to remove from watchlist:", error);
            }
        } else {
            const updated = watchlist.filter(w => w.symbol !== symbol);
            localStorage.setItem('watchlist', JSON.stringify(updated));
            setWatchlist(updated);
            setWatchlistData(watchlistData.filter(w => w.symbol !== symbol));
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
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Watchlist</h1>
                    <p className="text-secondary text-sm font-mono">{watchlistData.length} assets tracked</p>
                </div>
            </div>

            {/* Watchlist Table */}
            {watchlistData.length > 0 ? (
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/50">
                                <th className="text-left px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">Asset</th>
                                <th className="text-right px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">Price</th>
                                <th className="text-right px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">24h Change</th>
                                <th className="text-right px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">Market Cap</th>
                                <th className="text-center px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {watchlistData.map((asset) => (
                                <tr key={asset.symbol} className="border-b border-border last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <Link to={`/asset/${asset.market}/${asset.symbol}`} className="flex items-center gap-3 group">
                                            <AssetIcon
                                                symbol={asset.symbol}
                                                market={asset.market}
                                                size={32}
                                                className="group-hover:scale-110 transition-transform shadow-sm"
                                            />
                                            <div>
                                                <div className="font-mono font-bold text-primary group-hover:text-blue-500 transition-colors">{asset.symbol}</div>
                                                <div className="text-xs text-secondary">{asset.name}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono text-primary">
                                        ${asset.price?.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-4 text-right font-mono ${asset.change >= 0 ? 'text-green-600 dark:text-gain-bright' : 'text-red-600 dark:text-loss-bright'}`}>
                                        {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono text-secondary">
                                        {asset.marketCap >= 1e12
                                            ? `$${(asset.marketCap / 1e12).toFixed(2)}T`
                                            : asset.marketCap >= 1e9
                                                ? `$${(asset.marketCap / 1e9).toFixed(2)}B`
                                                : `$${(asset.marketCap / 1e6).toFixed(2)}M`
                                        }
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                to={`/asset/${asset.market}/${asset.symbol}`}
                                                className="p-2 text-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => removeFromWatchlist(asset.symbol)}
                                                className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Remove from Watchlist"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-sm">
                    <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">Your Watchlist is Empty</h3>
                    <p className="text-secondary text-sm mb-4">
                        Add assets to your watchlist to track them here
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Browse Assets</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
