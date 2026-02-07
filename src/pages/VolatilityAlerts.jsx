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
        <div className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${isHedge
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/30'
            : isDivergence
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'
            }`}>
            {/* Alert Type Badge */}
            <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 text-sm font-semibold ${isHedge ? 'text-emerald-500 dark:text-emerald-400' : isDivergence ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'
                    }`}>
                    {isHedge ? <AlertCircle className="w-5 h-5" /> : isDivergence ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    <span className="tracking-tight">{isHedge ? 'HEDGE OPPORTUNITY' : isDivergence ? 'DIVERGENCE WARNING' : 'ALERT'}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${alert.strength === 'strong'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                    : alert.strength === 'moderate'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-secondary border border-border'
                    }`}>
                    {alert.strength}
                </span>
            </div>

            {/* Asset Pair Display */}
            <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg mb-3 border border-slate-200 dark:border-slate-800/50">
                <div className="text-center w-24">
                    <div className="font-bold text-lg text-primary">{alert.asset1}</div>
                    <div className={`flex items-center justify-center gap-1 text-sm font-medium ${alert.asset1_change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {alert.asset1_change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(alert.asset1_change)}%
                    </div>
                </div>
                <div className="flex flex-col items-center px-2">
                    <ArrowRightLeft className="w-5 h-5 text-secondary mb-1" />
                    <span className="text-xs text-secondary font-medium">
                        {alert.divergence.toFixed(1)}% div
                    </span>
                </div>
                <div className="text-center w-24">
                    <div className="font-bold text-lg text-primary">{alert.asset2}</div>
                    <div className={`flex items-center justify-center gap-1 text-sm font-medium ${alert.asset2_change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {alert.asset2_change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(alert.asset2_change)}%
                    </div>
                </div>
            </div>

            {/* Correlation Info */}
            <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-secondary">
                    {alert.historical_correlation !== 'unknown'
                        ? `Historical corr: ${alert.historical_correlation}`
                        : 'Correlation: N/A'
                    }
                </span>
                {isDivergence && (
                    <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Unusual
                    </span>
                )}
            </div>
        </div>
    );
};

// Market Section Component
const MarketSection = ({ title, icon: Icon, alerts, color, isLoading }) => (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className={`px-4 py-3 border-b border-border bg-gradient-to-r ${color}`}>
            <h2 className="font-semibold text-white dark:text-slate-200 flex items-center gap-2">
                <Icon className="w-5 h-5 text-white/90 dark:text-slate-100/80" />
                <span>{title}</span>
                <span className="ml-auto text-xs text-white/80 dark:text-slate-200/60 font-mono bg-black/20 px-2 py-0.5 rounded">
                    {alerts.length} alerts
                </span>
            </h2>
        </div>
        <div className="p-4">
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : alerts.length > 0 ? (
                <div className="space-y-3">
                    {alerts.map((alert, idx) => (
                        <AlertCard key={idx} alert={alert} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-secondary">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-400/50" />
                    <span className="text-sm font-medium">No alerts triggered</span>
                    <p className="text-xs text-secondary mt-1">Market moving normally</p>
                </div>
            )}
        </div>
    </div>
);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/30 transition-colors shadow-sm">
                <div className="text-xs text-secondary uppercase tracking-wider font-semibold mb-2">Total Alerts</div>
                <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-primary">{totalAlerts}</div>
                    <TrendingUp className="w-5 h-5 text-blue-500/50 mb-1" />
                </div>
            </div>
            <div className="bg-surface border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-sm">
                <div className="text-xs text-emerald-500/80 uppercase tracking-wider font-semibold mb-2">Hedge Opps</div>
                <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">{hedgeCount}</div>
                    <AlertCircle className="w-5 h-5 text-emerald-500/50 mb-1" />
                </div>
            </div>
            <div className="bg-surface border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-sm">
                <div className="text-xs text-amber-500/80 uppercase tracking-wider font-semibold mb-2">Divergences</div>
                <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-amber-500 dark:text-amber-400">{divergenceCount}</div>
                    <AlertTriangle className="w-5 h-5 text-amber-500/50 mb-1" />
                </div>
            </div>
            <div className="bg-surface border border-red-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-red-500/40 transition-colors shadow-sm">
                <div className="text-xs text-red-500/80 uppercase tracking-wider font-semibold mb-2">Strong Signals</div>
                <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-red-500 dark:text-red-400">{strongCount}</div>
                    <Zap className="w-5 h-5 text-red-500/50 mb-1" />
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
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
                        <Zap className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                        Volatility Alerts
                    </h1>
                    <p className="text-secondary text-sm mt-1">
                        Real-time divergence detection & correlation tracking
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {lastUpdate && (
                        <div className="flex items-center gap-2 text-xs text-secondary bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                    )}
                    <Link
                        to="/compare"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-indigo-900/20"
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
            <div className="flex flex-wrap gap-6 p-4 bg-surface rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                        <AlertCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-primary block">Hedge Opportunity</span>
                        <span className="text-xs text-secondary">Low correlation assets moving opposite</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-primary block">Divergence Warning</span>
                        <span className="text-xs text-secondary">High correlation assets unusually diverging</span>
                    </div>
                </div>
            </div>

            {/* Market Sections - 3 Columns Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: US Stocks */}
                <MarketSection
                    title="US Stocks"
                    icon={BarChart3}
                    alerts={stockAlerts}
                    color="from-blue-600/90 to-indigo-600/90"
                    isLoading={isLoading}
                />

                {/* Column 2: Cryptocurrency */}
                <MarketSection
                    title="Cryptocurrency"
                    icon={Coins}
                    alerts={cryptoAlerts}
                    color="from-orange-500/90 to-amber-500/90"
                    isLoading={isLoading}
                />

                {/* Column 3: Commodities */}
                <MarketSection
                    title="Commodities"
                    icon={Droplet}
                    alerts={commodityAlerts}
                    color="from-emerald-500/90 to-teal-500/90"
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
