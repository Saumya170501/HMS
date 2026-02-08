import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiManager } from '../services/apiManager';
import { getDashboardVolatilityAlerts } from '../services/volatilityService';
import useMarketStore from '../store';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    Zap,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRightLeft,
    CheckCircle2,
    Wallet,
    TrendingUp,
    TrendingDown,
    Coins,
    Droplet,
    BarChart3,
    Map
} from 'lucide-react';

// Mini sparkline component
const Sparkline = ({ data, color }) => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="inline-block">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
            />
        </svg>
    );
};

// Stats Card Component
const StatsCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="glass-card rounded-xl p-6 card-hover group animate-fadeIn transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg hover-scale">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${change >= 0
                ? 'bg-green-500/10 text-green-600 dark:text-gain-bright border border-green-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-loss-bright border border-red-500/20'
                }`}>
                {change >= 0 ? '+' : ''}{change}%
            </div>
        </div>
        <div className="text-2xl font-bold text-primary font-mono tracking-tight">{value}</div>
        <div className="text-sm text-secondary mt-2 font-medium">{title}</div>
    </div>
);

// Market Mover Row
const MoverRow = ({ asset, rank }) => (
    <Link
        to={`/asset/${asset.market || 'stocks'}/${asset.symbol}`}
        className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
    >
        <span className="w-6 h-6 flex items-center justify-center text-xs font-mono text-secondary bg-slate-200 dark:bg-slate-800 rounded">
            {rank}
        </span>
        <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-primary">{asset.symbol}</div>
            <div className="text-xs text-secondary truncate">{asset.name}</div>
        </div>
        <div className="text-right">
            <div className="font-mono text-sm text-primary">${asset.price?.toLocaleString()}</div>
            <div className={`text-xs font-mono ${asset.change >= 0 ? 'text-green-600 dark:text-gain-bright' : 'text-red-600 dark:text-loss-bright'}`}>
                {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
            </div>
        </div>
    </Link>
);

// Volatility Alert Card
const VolatilityAlertCard = ({ alert }) => {
    const isHedge = alert.alert_type === 'HEDGE_OPPORTUNITY';
    const isDivergence = alert.alert_type === 'DIVERGENCE_WARNING';

    return (
        <div className={`p-4 rounded-lg border transition-all ${isHedge
            ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500/30'
            : isDivergence
                ? 'bg-amber-50/50 dark:bg-amber-500/10 border-amber-500/30'
                : 'bg-surface/50 border-border'
            }`}>
            {/* Alert Type Badge */}
            <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${isHedge ? 'text-emerald-600 dark:text-emerald-400' : isDivergence ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                    {isHedge ? <AlertCircle className="w-4 h-4" /> : isDivergence ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    <span>{isHedge ? 'Hedge Opp' : isDivergence ? 'Divergence' : 'Alert'}</span>
                </div>
                {alert.strength === 'strong' && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-bold uppercase">
                        <Zap className="w-3 h-3" /> Strong
                    </span>
                )}
            </div>

            {/* Asset Pair */}
            <div className="flex items-center justify-between my-3 px-2">
                <div className="text-center">
                    <div className="font-bold text-primary">{alert.asset1}</div>
                    <div className={`text-xs font-medium flex items-center justify-center gap-0.5 ${alert.asset1_change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {alert.asset1_change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(alert.asset1_change)}%
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <ArrowRightLeft className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] text-secondary font-medium mt-0.5">VS</span>
                </div>
                <div className="text-center">
                    <div className="font-bold text-primary">{alert.asset2}</div>
                    <div className={`text-xs font-medium flex items-center justify-center gap-0.5 ${alert.asset2_change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {alert.asset2_change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(alert.asset2_change)}%
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="text-[10px] text-secondary bg-slate-100 dark:bg-slate-900/40 rounded px-2 py-1.5 border border-border flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isDivergence ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {alert.historical_correlation !== 'unknown'
                    ? `Historical corr: ${alert.historical_correlation}`
                    : 'Unusual correlation detected'
                }
            </div>
        </div>
    );
};

// Volatility Alerts Widget
const VolatilityAlertsWidget = ({ alerts, isLoading }) => (
    <div className="glass-card rounded-xl overflow-hidden col-span-full">
        <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-amber-50 min-h-[50px] dark:from-amber-500/10 via-red-500/10 to-purple-500/10">
            <h3 className="font-semibold text-primary flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                TODAY'S VOLATILITY ALERTS
                <span className="text-xs text-slate-500 font-normal ml-2">(Real-time)</span>
            </h3>
        </div>
        <div className="p-4">
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : alerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.slice(0, 6).map((alert, idx) => (
                        <VolatilityAlertCard key={idx} alert={alert} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-600/50" />
                    <span className="text-sm font-medium">No significant volatility alerts detected today</span>
                    <p className="text-xs text-slate-600 mt-1">Markets are moving in sync</p>
                </div>
            )}

            <Link
                to="/volatility"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors group"
            >
                <span className="font-medium">Analyze Correlations</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
        </div>
    </div>
);

import useSettingsStore from '../hooks/useSettingsStore';

// ... imports

export default function Dashboard() {
    const [volatilityAlerts, setVolatilityAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

    // Get settings
    const refreshInterval = useSettingsStore(state => state.settings.refreshInterval);

    // Get real-time data from store
    const marketData = useMarketStore(state => state.marketData);
    const isConnected = useMarketStore(state => state.isConnected);

    useEffect(() => {
        // Initial fetch if store is empty
        if (marketData.stocks.length === 0) {
            fetchData();
        } else {
            setIsLoading(false);
        }

        async function fetchData() {
            try {
                const [stocks, crypto, commodities] = await Promise.all([
                    apiManager.getMarketData('stocks'),
                    apiManager.getMarketData('crypto'),
                    apiManager.getMarketData('commodities'),
                ]);
                // We don't set local state anymore, we rely on the store
                // But for initial load we can force update the store if WS isn't ready
                useMarketStore.getState().updateMarketData({
                    stocks, crypto, commodities
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    // Fetch volatility alerts separately
    useEffect(() => {
        async function fetchAlerts() {
            setIsLoadingAlerts(true);
            try {
                const alerts = await getDashboardVolatilityAlerts();
                setVolatilityAlerts(alerts);
            } catch (error) {
                console.error('Failed to fetch volatility alerts:', error);
            } finally {
                setIsLoadingAlerts(false);
            }
        }
        fetchAlerts();

        // Refresh alerts based on settings
        const intervalMs = refreshInterval * 1000;
        const interval = setInterval(fetchAlerts, intervalMs);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    // Calculate summary stats using store data
    const getTotalMarketCap = () => {
        const total = [...marketData.stocks, ...marketData.crypto, ...marketData.commodities]
            .reduce((sum, a) => sum + (a.marketCap || 0), 0);
        return `$${(total / 1e12).toFixed(2)}T`;
    };

    const getAverageChange = (data) => {
        if (!data || data.length === 0) return 0;
        return data.reduce((sum, a) => sum + (a.change || 0), 0) / data.length;
    };

    if (isLoading && !isConnected) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 font-mono">Connecting to market feed...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
                    <p className="text-secondary text-sm font-medium mt-1">Market Overview • 15-min delayed</p>
                </div>
                <Link
                    to="/heatmap"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover-scale"
                >
                    <Map className="w-4 h-4" />
                    <span className="font-medium">Open Heatmap</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Market Cap"
                    value={getTotalMarketCap()}
                    change={getAverageChange([...marketData.stocks, ...marketData.crypto]).toFixed(2)}
                    icon={Wallet}
                />
                <StatsCard
                    title="Stocks Avg"
                    value={`${getAverageChange(marketData.stocks).toFixed(2)}%`}
                    change={getAverageChange(marketData.stocks).toFixed(2)}
                    icon={TrendingUp}
                />
                <StatsCard
                    title="Crypto Avg"
                    value={`${getAverageChange(marketData.crypto).toFixed(2)}%`}
                    change={getAverageChange(marketData.crypto).toFixed(2)}
                    icon={Coins}
                />
                <StatsCard
                    title="Commodities Avg"
                    value={`${getAverageChange(marketData.commodities).toFixed(2)}%`}
                    change={getAverageChange(marketData.commodities).toFixed(2)}
                    icon={Droplet}
                />
            </div>

            {/* Volatility Alerts Widget - Replaces Top Gainers/Losers/Most Active */}
            <VolatilityAlertsWidget alerts={volatilityAlerts} isLoading={isLoadingAlerts} />

            {/* Market Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stocks */}
                <div className="glass-card rounded-xl overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            US Stocks
                        </h3>
                        <Link to="/heatmap" className="text-xs text-blue-400 hover:text-blue-300">
                            View All →
                        </Link>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {marketData.stocks.slice(0, 6).map((asset, i) => (
                            <MoverRow key={asset.symbol} asset={{ ...asset, market: 'stocks' }} rank={i + 1} />
                        ))}
                    </div>
                </div>

                {/* Crypto */}
                <div className="glass-card rounded-xl overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <Coins className="w-5 h-5 text-amber-500" />
                            Cryptocurrency
                        </h3>
                        <Link to="/heatmap" className="text-xs text-blue-400 hover:text-blue-300">
                            View All →
                        </Link>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {marketData.crypto.slice(0, 6).map((asset, i) => (
                            <MoverRow key={asset.symbol} asset={{ ...asset, market: 'crypto' }} rank={i + 1} />
                        ))}
                    </div>
                </div>

                {/* Commodities */}
                <div className="glass-card rounded-xl overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-emerald-500" />
                            Commodities
                        </h3>
                        <Link to="/heatmap" className="text-xs text-blue-400 hover:text-blue-300">
                            View All →
                        </Link>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                        {marketData.commodities.slice(0, 6).map((asset, i) => (
                            <MoverRow key={asset.symbol} asset={{ ...asset, market: 'commodities' }} rank={i + 1} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
