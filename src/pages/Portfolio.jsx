import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, DollarSign, Briefcase, RefreshCw, Trash2, Activity, Wallet, BarChart3, ArrowRight } from 'lucide-react';
import {
    getPortfolio,
    refreshPortfolioPrices,
    removeHolding,
    addHolding,
    calculatePortfolioMetrics
} from '../services/portfolioService';
import apiManager from '../services/apiManager';
import AddHoldingModal from '../components/AddHoldingModal';
import { useAuth } from '../context/AuthContext';
import AssetIcon from '../components/AssetIcon';
import useMarketStore from '../store';

export default function Portfolio() {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid;

    // Global WebSocket Data
    const marketData = useMarketStore(state => state.marketData);
    const isConnected = useMarketStore(state => state.isConnected);

    const [portfolio, setPortfolio] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAllHoldings, setShowAllHoldings] = useState(false);

    useEffect(() => {
        loadPortfolio();
    }, [currentUser]);

    const loadPortfolio = async () => {
        const data = await getPortfolio(userId);
        setPortfolio(data);
        setIsLoading(false);
    };

    // Derived Live Portfolio State
    const livePortfolio = useMemo(() => {
        if (!portfolio) return null;

        const updatedHoldings = portfolio.holdings.map(holding => {
            // Find live price from global store
            let livePrice = holding.currentPrice;
            const marketAssets = marketData[holding.market] || [];
            const liveAsset = marketAssets.find(a => a.symbol === holding.symbol);

            if (liveAsset && liveAsset.price) {
                livePrice = liveAsset.price;
            }

            // Recalculate metrics for this holding
            const totalValue = holding.quantity * livePrice;
            const gainLoss = totalValue - holding.totalCost;
            const gainLossPercent = holding.totalCost > 0 ? (gainLoss / holding.totalCost) * 100 : 0;

            return {
                ...holding,
                currentPrice: livePrice,
                totalValue,
                gainLoss,
                gainLossPercent,
                isLive: !!liveAsset // Flag to identify if using live data
            };
        });

        // Create a temporary portfolio object to calculate totals
        const tempPortfolio = { ...portfolio, holdings: updatedHoldings };
        calculatePortfolioMetrics(tempPortfolio);

        return tempPortfolio;

    }, [portfolio, marketData]);

    const handleRefreshPrices = async () => {
        setIsRefreshing(true);
        try {
            const updated = await refreshPortfolioPrices(apiManager, userId);
            setPortfolio(updated);
        } catch (error) {
            console.error('Failed to refresh prices:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRemoveHolding = async (holdingId) => {
        if (window.confirm('Are you sure you want to remove this holding?')) {
            const updated = await removeHolding(holdingId, userId);
            setPortfolio(updated);
        }
    };

    const handleAddHolding = async (holdingData) => {
        const updated = await addHolding(holdingData, userId);
        setPortfolio(updated);
        setShowAddModal(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 ">Loading portfolio...</span>
                </div>
            </div>
        );
    }

    // Use livePortfolio for rendering if available, otherwise fallback to stored portfolio
    const displayPortfolio = livePortfolio || portfolio;
    const isEmpty = !displayPortfolio.holdings || displayPortfolio.holdings.length === 0;

    // Progressive Disclosure Logic
    const INITIAL_DISPLAY_COUNT = 5;
    const displayedHoldings = showAllHoldings
        ? displayPortfolio.holdings
        : displayPortfolio.holdings.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMoreHoldings = displayPortfolio.holdings.length > INITIAL_DISPLAY_COUNT;

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-blue-500" />
                            My Portfolio
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {displayPortfolio ? displayPortfolio.holdings.length : 0} holdings
                            </p>
                            {isConnected && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                                    <Activity className="w-3 h-3" />
                                    Live Updates
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefreshPrices}
                            disabled={isRefreshing || isEmpty}
                            className="px-4 py-2 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl backdrop-blur-md transition-colors border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Save Prices
                        </button>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 flex items-center gap-2 font-bold"
                        >
                            <Plus className="w-5 h-5" />
                            Add Holding
                        </button>
                    </div>
                </div>

                {isEmpty ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bento-card border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 max-w-3xl mx-auto">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Briefcase className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Your portfolio is empty</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
                            Start tracking your investments by adding your first holding to unlock deep analytics, P/L tracking, and performance metrics.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 group"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Your First Holding
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary Dashboard - Bento Grid row */}
                        <div className="bento-grid">
                            <div className="bento-card bento-col-span-full bento-row-span-1 grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/50 dark:divide-slate-800/50 bg-white/40 dark:bg-slate-900/40">

                                {/* Total Value */}
                                <div className="p-6 flex flex-col justify-center relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <DollarSign className="w-24 h-24 text-blue-500" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 relative z-10">
                                        <DollarSign className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Value</span>
                                    </div>
                                    <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white relative z-10">
                                        ${displayPortfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Total Cost */}
                                <div className="p-6 flex flex-col justify-center group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Wallet className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</span>
                                    </div>
                                    <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white ">
                                        ${displayPortfolio.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Total P/L */}
                                <div className="p-6 flex flex-col justify-center group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        {displayPortfolio.totalGainLoss >= 0 ? (
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total P/L</span>
                                    </div>
                                    <div className={`text-2xl lg:text-3xl font-black ${displayPortfolio.totalGainLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {displayPortfolio.totalGainLoss >= 0 ? '+' : ''}${displayPortfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Total Return % */}
                                <div className="p-6 flex flex-col justify-center group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        {displayPortfolio.totalGainLossPercent >= 0 ? (
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Return</span>
                                    </div>
                                    <div className={`text-2xl lg:text-3xl font-black ${displayPortfolio.totalGainLossPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {displayPortfolio.totalGainLossPercent >= 0 ? '+' : ''}{displayPortfolio.totalGainLossPercent.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Holdings Grid */}
                        <div className="bento-grid">
                            {displayedHoldings.map((holding) => {
                                const isUp = holding.gainLossPercent >= 0;
                                const accentColor = isUp ? 'emerald' : 'red';

                                return (
                                    <div key={holding.id} className={`bento-card bento-col-span-1 border md:col-span-2 lg:col-span-2 p-5 flex flex-col justify-between group hover:border-${accentColor}-400 dark:hover:border-${accentColor}-500 hover:shadow-xl hover:shadow-${accentColor}-500/10 ${holding.isLive ? 'bg-blue-500/5 dark:bg-blue-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : ''}`}>

                                        <div className="flex items-start justify-between mb-4">
                                            <Link to={`/asset/${holding.market}/${holding.symbol}`} className="flex items-center gap-3 w-full">
                                                <AssetIcon
                                                    symbol={holding.symbol}
                                                    market={holding.market}
                                                    size={48}
                                                    className="group-hover:scale-110 transition-transform shadow-md rounded-xl"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-xl text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                                                            {holding.symbol}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                                        {holding.quantity} shares
                                                    </div>
                                                </div>

                                                {/* Edit/Remove overlay */}
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm rounded-lg flex items-center shadow-lg border border-slate-700/50 p-1">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); handleRemoveHolding(holding.id); }}
                                                        className="p-1.5 text-slate-300 hover:text-white hover:bg-red-500 rounded-md transition-colors group/btn relative"
                                                        title="Remove Holding"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-auto">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Value</div>
                                                <div className="font-bold text-lg text-slate-900 dark:text-white">
                                                    ${holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                                    ${holding.currentPrice.toFixed(2)} / sh
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Return</div>
                                                <div className={`font-bold text-lg mb-1 flex items-center justify-end ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                                    {isUp ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                                                </div>
                                                <div className={`text-xs font-bold rounded px-1.5 py-0.5 inline-block ${isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                    {isUp ? '+' : ''}${holding.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Show More / Show Less Button */}
                        {hasMoreHoldings && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setShowAllHoldings(!showAllHoldings)}
                                    className="px-6 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold transition-colors border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                                >
                                    {showAllHoldings ? 'Show Less' : `View All ${displayPortfolio.holdings.length} Assets`}
                                </button>
                            </div>
                        )}

                        {/* Analytics Link -> bento card style hint */}
                        <div className="mt-8">
                            <Link to="/analytics" className="bento-card bento-col-span-full p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white group hover:shadow-blue-500/25 cursor-pointer text-left">
                                <div className="mb-4 sm:mb-0">
                                    <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                                        <BarChart3 className="w-6 h-6" /> Detailed Analytics
                                    </h3>
                                    <p className="text-blue-100 font-medium">
                                        View Sharpe Ratio, Volatility, Beta, and correlation heatmaps for your specific portfolio allocation.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <span className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl transition-all shadow-lg text-sm uppercase tracking-wide">
                                        Launch Analytics
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </>
                )}

                {/* Add Holding Modal */}
                {showAddModal && (
                    <AddHoldingModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={handleAddHolding}
                    />
                )}
            </div>
        </div>
    );
}
