import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVolatilityAlertsByMarket } from '../services/volatilityService';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRightLeft,
    TrendingUp,
    Zap,
    Link as LinkIcon,
    BarChart3,
    Coins,
    Droplet,
    CheckCircle2
} from 'lucide-react';

// AlertCard Component
const AlertCard = ({ alert }) => {
    const isHedge = alert.alert_type === 'HEDGE_OPPORTUNITY';
    const isDivergence = alert.alert_type === 'DIVERGENCE_WARNING';

    return (
        <div className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group/card ${isHedge
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20'
            : isDivergence
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20'
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50'
            }`}>
            {/* Hover Glow */}
            <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover/card:opacity-10 blur-xl transition-opacity duration-300 pointer-events-none ${isHedge ? 'bg-emerald-500' : isDivergence ? 'bg-amber-500' : 'bg-slate-500'
                }`} />

            <div className="relative z-10">
                {/* Alert Type Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 text-sm font-black tracking-tight ${isHedge ? 'text-emerald-600 dark:text-emerald-400' : isDivergence ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                        {isHedge ? <AlertCircle className="w-5 h-5" /> : isDivergence ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        <span>{isHedge ? 'HEDGE OPPORTUNITY' : isDivergence ? 'DIVERGENCE WARNING' : 'ALERT'}</span>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest ${alert.strength === 'strong'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        : alert.strength === 'moderate'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-600/50'
                        }`}>
                        {alert.strength}
                    </span>
                </div>

                {/* Asset Pair Display */}
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl mb-4 border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                    <div className="text-center w-24">
                        <div className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{alert.asset1}</div>
                        <div className={`flex items-center justify-center gap-1 text-sm font-bold mt-0.5 ${alert.asset1_change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {alert.asset1_change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {Math.abs(alert.asset1_change)}%
                        </div>
                    </div>
                    <div className="flex flex-col items-center px-1">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                            {alert.divergence.toFixed(1)}% DIV
                        </span>
                    </div>
                    <div className="text-center w-24">
                        <div className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{alert.asset2}</div>
                        <div className={`flex items-center justify-center gap-1 text-sm font-bold mt-0.5 ${alert.asset2_change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {alert.asset2_change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {Math.abs(alert.asset2_change)}%
                        </div>
                    </div>
                </div>

                {/* Correlation Info */}
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {alert.historical_correlation !== 'unknown'
                            ? `Corr: ${alert.historical_correlation}`
                            : 'Corr: N/A'
                        }
                    </span>
                    {isDivergence && (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> Unusual
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Market Section Component
const MarketSection = ({ title, icon: Icon, alerts, color, isLoading }) => {
    const [showAll, setShowAll] = useState(false);
    const INITIAL_COUNT = 3;
    const displayedAlerts = showAll ? alerts : alerts.slice(0, INITIAL_COUNT);
    const hasMore = alerts.length > INITIAL_COUNT;

    return (
        <div className="flex flex-col h-full bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-sm overflow-hidden group">
            <div className={`px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r ${color} backdrop-blur-md relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/10 dark:bg-black/10"></div>
                <h2 className="font-extrabold text-white flex items-center gap-3 text-lg relative z-10 tracking-tight">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span>{title}</span>
                    <span className="ml-auto text-[10px] text-white/90 bg-black/25 px-2.5 py-1 rounded-md tracking-widest border border-white/10 shadow-inner">
                        {alerts.length} ALERTS
                    </span>
                </h2>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1 py-12">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full blur-md bg-blue-500/20 animate-pulse"></div>
                            <svg className="animate-spin h-8 w-8 text-blue-500 relative z-10" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    </div>
                ) : alerts.length > 0 ? (
                    <div className="space-y-4">
                        {displayedAlerts.map((alert, idx) => (
                            <AlertCard key={idx} alert={alert} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-12 px-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                        </div>
                        <span className="text-base font-bold text-slate-700 dark:text-slate-300">No alerts triggered</span>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 font-medium">Market conditions stable</p>
                    </div>
                )}
            </div>

            {hasMore && !isLoading && (
                <div className="px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 text-center backdrop-blur-sm">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors uppercase tracking-widest"
                    >
                        {showAll ? 'Show Less' : `Show All (${alerts.length})`}
                    </button>
                </div>
            )}
        </div>
    );
};

// Summary Stats Component
const SummaryStats = ({ stockAlerts, cryptoAlerts, commodityAlerts }) => {
    const totalAlerts = stockAlerts.length + cryptoAlerts.length + commodityAlerts.length;
    const hedgeCount = [...stockAlerts, ...cryptoAlerts, ...commodityAlerts]
        .filter(a => a.alert_type === 'HEDGE_OPPORTUNITY').length;
    const divergenceCount = [...stockAlerts, ...cryptoAlerts, ...commodityAlerts]
        .filter(a => a.alert_type === 'DIVERGENCE_WARNING').length;
    const strongCount = [...stockAlerts, ...cryptoAlerts, ...commodityAlerts]
        .filter(a => a.strength === 'strong').length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bento-card p-5 outline outline-1 outline-blue-500/20 group">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-3">Total Alerts</div>
                <div className="flex items-end justify-between">
                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalAlerts}</div>
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                </div>
            </div>
            <div className="bento-card p-5 outline outline-1 outline-emerald-500/20 group">
                <div className="text-xs text-emerald-600 dark:text-emerald-500 uppercase font-bold tracking-widest mb-3">Hedge Opps</div>
                <div className="flex items-end justify-between">
                    <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{hedgeCount}</div>
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <AlertCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>
            </div>
            <div className="bento-card p-5 outline outline-1 outline-amber-500/20 group">
                <div className="text-xs text-amber-600 dark:text-amber-500 uppercase font-bold tracking-widest mb-3">Divergences</div>
                <div className="flex items-end justify-between">
                    <div className="text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">{divergenceCount}</div>
                    <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
            </div>
            <div className="bento-card p-5 outline outline-1 outline-red-500/20 group">
                <div className="text-xs text-red-600 dark:text-red-500 uppercase font-bold tracking-widest mb-3">Strong Signals</div>
                <div className="flex items-end justify-between">
                    <div className="text-4xl font-black text-red-600 dark:text-red-400 tracking-tighter">{strongCount}</div>
                    <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                        <Zap className="w-6 h-6 text-red-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function VolatilityAlerts() {
    const [stockAlerts, setStockAlerts] = useState([]);
    const [cryptoAlerts, setCryptoAlerts] = useState([]);
    const [commodityAlerts, setCommodityAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        async function fetchAlerts() {
            setIsLoading(true);
            try {
                const grouped = await getVolatilityAlertsByMarket();
                setStockAlerts(grouped.stocks || []);
                setCryptoAlerts(grouped.crypto || []);
                setCommodityAlerts(grouped.commodities || []);
                setLastUpdate(new Date());
            } catch (error) {
                console.error('Failed to fetch volatility alerts:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAlerts();

        // Refresh every 60 seconds
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                            <Zap className="w-8 h-8 text-amber-500 fill-amber-500/20" />
                            Volatility Alerts
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Real-time divergence detection & correlation tracking across markets.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 z-30">
                        {lastUpdate && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                Updated: {lastUpdate.toLocaleTimeString()}
                            </div>
                        )}
                        <Link
                            to="/compare"
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center gap-2 font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5"
                        >
                            <LinkIcon className="w-4 h-4" />
                            <span>Deep Compare</span>
                        </Link>
                    </div>
                </div>

                {/* Summary Stats */}
                <SummaryStats
                    stockAlerts={stockAlerts}
                    cryptoAlerts={cryptoAlerts}
                    commodityAlerts={commodityAlerts}
                />

                {/* Legend */}
                <div className="flex flex-wrap gap-6 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 border-r border-slate-200/50 dark:border-slate-700/50 pr-6">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                            <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block uppercase tracking-wide">Hedge Opportunity</span>
                            <span className="text-xs font-medium text-slate-500">Low correlation assets moving conversely</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block uppercase tracking-wide">Divergence Warning</span>
                            <span className="text-xs font-medium text-slate-500">High correlation assets unusually diverging</span>
                        </div>
                    </div>
                </div>

                {/* Market Sections - 3 Columns Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-stretch">
                    {/* Column 1: US Stocks */}
                    <MarketSection
                        title="US Stocks"
                        icon={BarChart3}
                        alerts={stockAlerts}
                        color="from-blue-600 to-indigo-600 dark:from-blue-500/90 dark:to-indigo-500/90"
                        isLoading={isLoading}
                    />

                    {/* Column 2: Cryptocurrency */}
                    <MarketSection
                        title="Cryptocurrency"
                        icon={Coins}
                        alerts={cryptoAlerts}
                        color="from-orange-500 to-amber-500 dark:from-orange-500/90 dark:to-amber-500/90"
                        isLoading={isLoading}
                    />

                    {/* Column 3: Commodities */}
                    <MarketSection
                        title="Commodities"
                        icon={Droplet}
                        alerts={commodityAlerts}
                        color="from-teal-600 to-emerald-600 dark:from-teal-500/90 dark:to-emerald-500/90"
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
