import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, PieChart, TrendingUp, ArrowUpRight, Briefcase } from 'lucide-react';
import useSettingsStore from '../hooks/useSettingsStore';
import useThemeStore from '../hooks/useThemeStore';
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
    const { isDarkMode } = useThemeStore();

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
                    <span className="text-slate-400 ">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-96 p-6">
                <Briefcase className="w-16 h-16 text-secondary mb-4" />
                <h2 className="text-2xl font-bold text-primary mb-2">Build Your Portfolio</h2>
                <p className="text-secondary text-center max-w-md mb-6">
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
        <div className="min-h-screen p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                            <PieChart className="w-8 h-8 text-purple-600 dark:text-purple-500" />
                            Advanced Analytics
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Deep dive into your portfolio performance and correlation metrics.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 z-30">
                        {/* Time Range Selector */}
                        <div className="flex flex-wrap gap-1 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm w-fit shadow-sm">
                            {['7d', '30d', '90d', 'YTD'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-105'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Export Button */}
                        <div className="relative group">
                            <button className="px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2 font-bold shadow-sm backdrop-blur-md hover:shadow-md">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block">
                                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between"
                                    >
                                        <span>CSV Format</span>
                                        <span className="text-xs bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 ">.csv</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 transition-colors border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between"
                                    >
                                        <span>JSON Format</span>
                                        <span className="text-xs bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 ">.json</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bento-grid">
                    {/* Main Performance Chart */}
                    <div className="bento-card bento-col-span-full lg:col-span-8 bento-row-span-3 p-6 flex flex-col group">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold flex items-center text-slate-900 dark:text-white gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-500" /> Portfolio Performance
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                    Growth trajectory over the selected {timeRange} timeframe.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Return</div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${metrics.totalReturn >= 0
                                    ? 'text-emerald-600 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    : 'text-red-600 bg-red-50/50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                    }`}>
                                    <ArrowUpRight className="w-5 h-5" />
                                    <span className="text-xl font-black">
                                        {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[400px]">
                            {performanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke={isDarkMode ? '#ffffff' : '#0f172a'} />
                                        <XAxis
                                            dataKey="day"
                                            stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                                            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                                            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                backdropFilter: 'blur(8px)',
                                                borderColor: 'var(--border)',
                                                borderRadius: '12px',
                                                fontFamily: 'inherit',
                                                color: '#fff',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                            itemStyle={{ color: '#fff', fontWeight: 600 }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#9333ea"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="benchmark"
                                            stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                                            strokeDasharray="5 5"
                                            fill="none"
                                            strokeWidth={2}
                                            opacity={0.5}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 font-bold">
                                    No historical data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Risk Analysis Overview */}
                    <div className="bento-card bento-col-span-full lg:col-span-4 bento-row-span-2 p-6 flex flex-col group">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Risk Analysis
                        </h3>
                        <div className="space-y-6 flex-1 flex flex-col justify-center">
                            {/* Sharpe Ratio */}
                            <div className="group/stat">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sharpe Ratio</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white ">{metrics.sharpeRatio.toFixed(2)}</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/stat:brightness-110"
                                        style={{ width: `${Math.min((metrics.sharpeRatio / 3) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">&gt; 1.0 is considered good risk-adjusted return.</p>
                            </div>

                            {/* Volatility */}
                            <div className="group/stat">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Volatility (30d)</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white ">{metrics.volatility.toFixed(1)}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover/stat:brightness-110"
                                        style={{ width: `${Math.min(metrics.volatility * 2, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Beta */}
                            <div className="group/stat">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Beta</span>
                                    <span className="text-xl font-black text-slate-900 dark:text-white ">{metrics.beta.toFixed(2)}</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover/stat:brightness-110"
                                        style={{ width: `${Math.min((metrics.beta / 2) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Relative volatility vs SPY benchmark.</p>
                            </div>
                        </div>
                    </div>

                    {/* Correlation Matrix Heatmap */}
                    <div className="bento-card bento-col-span-full lg:col-span-4 bento-row-span-1 p-6 flex flex-col group">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                            <PieChart className="w-5 h-5 text-blue-500" /> Matrix Lookback
                        </h3>
                        <div className="flex-1 flex flex-col justify-center items-center">
                            {correlationData.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2 w-full max-w-[200px]">
                                    {correlationData.slice(0, 16).map((corr, i) => {
                                        const opacity = Math.abs(corr.correlation);
                                        // Use red for negative correlation, purple for positive
                                        const colorBase = corr.correlation >= 0 ? '147, 51, 234' : '239, 68, 68';
                                        return (
                                            <div
                                                key={i}
                                                className="aspect-square rounded-lg shadow-sm transition-transform hover:scale-110 cursor-help"
                                                style={{
                                                    backgroundColor: `rgba(${colorBase}, ${Math.max(opacity, 0.1)})`
                                                }}
                                                title={`${corr.asset1} ↔ ${corr.asset2}: ${corr.correlation.toFixed(2)}`}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center">
                                    Add more holdings to see real-time correlations.
                                </div>
                            )}
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-6 text-center tracking-wider uppercase">
                                Asset Correlation Density
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
