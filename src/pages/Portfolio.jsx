import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, DollarSign, Briefcase, RefreshCw, Trash2, Activity } from 'lucide-react';
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
                    <span className="text-slate-400 font-mono">Loading portfolio...</span>
                </div>
            </div>
        );
    }

    // Use livePortfolio for rendering if available, otherwise fallback to stored portfolio
    const displayPortfolio = livePortfolio || portfolio;
    const isEmpty = !displayPortfolio.holdings || displayPortfolio.holdings.length === 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-blue-500" />
                        My Portfolio
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-slate-500 text-sm font-mono">
                            {displayPortfolio.holdings.length} holdings
                        </p>
                        {isConnected && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-pulse">
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
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Save Current Prices
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Holding
                    </button>
                </div>
            </div>

            {isEmpty ? (
                // Empty State
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 text-center">
                    <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">Portfolio Empty</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Start tracking your investments by adding your first holding
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First Holding
                    </button>
                </div>
            ) : (
                <>
                    {/* Summary Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Value */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <DollarSign className="w-12 h-12 text-blue-500" />
                            </div>
                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Total Value</span>
                                <DollarSign className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-slate-200 font-mono relative z-10">
                                ${displayPortfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        {/* Total Cost */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Total Cost</span>
                                <DollarSign className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="text-2xl font-bold text-slate-200 font-mono">
                                ${displayPortfolio.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        {/* Total P/L */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Total P/L</span>
                                {displayPortfolio.totalGainLoss >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold font-mono ${displayPortfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {displayPortfolio.totalGainLoss >= 0 ? '+' : ''}${displayPortfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        {/* Total Return % */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Return</span>
                                {displayPortfolio.totalGainLossPercent >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                            </div>
                            <div className={`text-2xl font-bold font-mono ${displayPortfolio.totalGainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {displayPortfolio.totalGainLossPercent >= 0 ? '+' : ''}{displayPortfolio.totalGainLossPercent.toFixed(2)}%
                            </div>
                        </div>
                    </div>

                    {/* Holdings Table */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-800/50">
                                        <th className="text-left px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Asset</th>
                                        <th className="text-right px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Quantity</th>
                                        <th className="text-right px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Avg Cost</th>
                                        <th className="text-right px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Current Price</th>
                                        <th className="text-right px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Total Value</th>
                                        <th className="text-right px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">P/L</th>
                                        <th className="text-right px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Return</th>
                                        <th className="text-center px-6 py-4 text-xs text-slate-400 uppercase tracking-wider font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayPortfolio.holdings.map((holding) => (
                                        <tr key={holding.id} className={`border-b border-slate-700 last:border-0 hover:bg-slate-800/30 transition-colors ${holding.isLive ? 'bg-blue-500/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <Link to={`/asset/${holding.market}/${holding.symbol}`} className="flex items-center gap-3 group">
                                                    <AssetIcon
                                                        symbol={holding.symbol}
                                                        market={holding.market}
                                                        size={36}
                                                        className="group-hover:scale-110 transition-transform shadow-sm"
                                                    />
                                                    <div>
                                                        <div className="font-mono font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                            {holding.symbol}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{holding.name}</div>
                                                        <div className="text-xs text-slate-600 capitalize">{holding.market}</div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-200">
                                                {holding.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-200">
                                                ${holding.purchasePrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-200 transition-colors duration-300">
                                                ${holding.currentPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-200 font-semibold">
                                                ${holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono ${holding.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${holding.gainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleRemoveHolding(holding.id)}
                                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                                        title="Remove Holding"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Analytics Link */}
                    <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-blue-200 mb-1">View Detailed Analytics</h3>
                                <p className="text-sm text-blue-300/70">
                                    See Sharpe Ratio, Volatility, Beta, and correlation analysis for your portfolio
                                </p>
                            </div>
                            <Link
                                to="/analytics"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 font-medium"
                            >
                                Go to Analytics →
                            </Link>
                        </div>
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
    );
}
