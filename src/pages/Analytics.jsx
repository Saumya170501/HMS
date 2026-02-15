import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, PieChart, TrendingUp, ArrowUpRight, Briefcase } from 'lucide-react';
import useSettingsStore from '../hooks/useSettingsStore';
import { exportData } from '../services/exportUtility';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getPortfolio } from '../services/portfolioService';
import {
    calculatePortfolioReturns,
    calculateSharpeRatio,
    calculateVolatility,
    calculateBeta,
    generatePerformanceChart,
    calculateCorrelationMatrix
} from '../services/portfolioAnalytics';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid;
    const correlationLookback = useSettingsStore(state => state.settings.correlationLookback);

    const getLookbackString = (days) => {
        if (days <= 7) return '7d';
        if (days <= 30) return '30d';
        if (days <= 90) return '90d';
        return 'YTD';
    };

    const [timeRange, setTimeRange] = useState(getLookbackString(correlationLookback));
    const [portfolio, setPortfolio] = useState(null);
    const [performanceData, setPerformanceData] = useState([]);
    const [metrics, setMetrics] = useState({
        sharpeRatio: 0,
        volatility: 0,
        beta: 1.0,
        totalReturn: 0
    });
    const [correlationData, setCorrelationData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPortfolioAnalytics();
    }, [timeRange, currentUser]);

    const loadPortfolioAnalytics = async () => {
        setIsLoading(true);
        const portfolioData = await getPortfolio(userId);
        setPortfolio(portfolioData);

        if (!portfolioData.holdings || portfolioData.holdings.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 180;
            const returns = await calculatePortfolioReturns(portfolioData.holdings, days);
            const chartData = await generatePerformanceChart(portfolioData.holdings, days);
            setPerformanceData(chartData);

            if (returns.length > 0) {
                const sharpe = calculateSharpeRatio(returns);
                const vol = calculateVolatility(returns);
                const beta = await calculateBeta(returns, 'SPY', days);

                setMetrics({
                    sharpeRatio: sharpe,
                    volatility: vol,
                    beta: beta,
                    totalReturn: portfolioData.totalGainLossPercent
                });
            }

            if (portfolioData.holdings.length >= 2) {
                const correlations = await calculateCorrelationMatrix(portfolioData.holdings, days);
                setCorrelationData(correlations);
            }
        } catch (error) {
            console.error('Failed to load portfolio analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = (format) => {
        if (portfolio && portfolio.holdings) {
            const { exportMetadata } = useSettingsStore.getState().settings;
            exportData(portfolio.holdings, 'portfolio_analytics', format, exportMetadata);
        }
    };

    const isEmpty = !portfolio || !portfolio.holdings || portfolio.holdings.length === 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 font-mono">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-96 p-6">
                <Briefcase className="w-16 h-16 text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Build Your Portfolio</h2>
                <p className="text-slate-400 text-center max-w-md mb-6">
                    Add holdings to your portfolio to see detailed analytics including Sharpe Ratio, Volatility, Beta, and correlation analysis.
                </p>
                <Link
                    to="/portfolio"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 font-medium flex items-center gap-2"
                >
                    <Briefcase className="w-5 h-5" />
                    Go to Portfolio Page
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-purple-500" />
                        Advanced Analytics
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">Portfolio tracking & correlation analysis</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 rounded-lg p-1 flex items-center border border-slate-700">
                        {['7d', '30d', '90d', 'YTD'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 flex items-center gap-2 font-medium">
                            <Download className="w-4 h-4" />
                            Export Data
                        </button>
                        <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-20">
                            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-between"
                                >
                                    <span>CSV Format</span>
                                    <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">.csv</span>
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 transition-colors border-t border-slate-700 flex items-center justify-between"
                                >
                                    <span>JSON Format</span>
                                    <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">.json</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-200">Portfolio Performance</h3>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${metrics.totalReturn >= 0
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                            }`}>
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="font-mono font-bold">
                                {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        {performanceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#64748b"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderColor: '#334155',
                                            borderRadius: '8px',
                                            color: '#e2e8f0'
                                        }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="benchmark"
                                        stroke="#64748b"
                                        strokeDasharray="5 5"
                                        fill="none"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600">
                                No historical data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Risk Analysis
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Sharpe Ratio</span>
                                    <span className="text-slate-200 font-mono">{metrics.sharpeRatio.toFixed(2)}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${Math.min((metrics.sharpeRatio / 3) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Volatility (30d)</span>
                                    <span className="text-slate-200 font-mono">{metrics.volatility.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500"
                                        style={{ width: `${Math.min(metrics.volatility * 2, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">Beta</span>
                                    <span className="text-slate-200 font-mono">{metrics.beta.toFixed(2)}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${Math.min((metrics.beta / 2) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Correlation Heatmap Preview */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-slate-200 mb-4">Correlation Matrix</h3>
                        {correlationData.length > 0 ? (
                            <div className="grid grid-cols-4 gap-1">
                                {correlationData.slice(0, 16).map((corr, i) => {
                                    const opacity = Math.abs(corr.correlation);
                                    return (
                                        <div
                                            key={i}
                                            className="aspect-square rounded"
                                            style={{
                                                backgroundColor: `rgba(139, 92, 246, ${opacity})`
                                            }}
                                            title={`${corr.asset1} ↔ ${corr.asset2}: ${corr.correlation.toFixed(2)}`}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-600 text-center">
                                Add more holdings to see correlations
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Correlation strength between portfolio assets
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
