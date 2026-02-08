import React, { useState } from 'react';
import { Download, PieChart, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import useSettingsStore from '../hooks/useSettingsStore';
import useMarketStore from '../store';
import { exportData } from '../services/exportUtility';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Analytics() {
    const marketData = useMarketStore(state => state.marketData);
    const correlationLookback = useSettingsStore(state => state.settings.correlationLookback);

    // Map numerical lookback to string format
    const getLookbackString = (days) => {
        if (days <= 7) return '7d';
        if (days <= 30) return '30d';
        if (days <= 90) return '90d';
        return 'YTD';
    };

    const [timeRange, setTimeRange] = useState(getLookbackString(correlationLookback));

    // Mock performance data generation
    const generatePerformanceData = () => {
        const points = [];
        let value = 10000;
        for (let i = 30; i >= 0; i--) {
            value = value * (1 + (Math.random() - 0.45) * 0.05);
            points.push({
                day: `Day ${30 - i}`,
                value: Math.round(value),
                benchmark: Math.round(value * (1 + (Math.random() - 0.5) * 0.02))
            });
        }
        return points;
    };

    const performanceData = generatePerformanceData();

    const handleExport = (format) => {
        const allAssets = [
            ...marketData.stocks,
            ...marketData.crypto,
            ...marketData.commodities
        ];
        // Get settings
        const { exportMetadata } = useSettingsStore.getState().settings;
        exportData(allAssets, 'market_analytics', format, exportMetadata);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                        Advanced Analytics
                    </h1>
                    <p className="text-secondary text-sm font-mono mt-1">Portfolio tracking & correlation analysis</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex items-center border border-slate-200 dark:border-slate-700">
                        {['7d', '30d', '90d', 'YTD'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-secondary hover:text-primary'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-primary rounded-lg transition-colors border border-border flex items-center gap-2 font-medium">
                            <Download className="w-4 h-4" />
                            Export Data
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-20">
                            <button
                                onClick={() => handleExport('csv')}
                                className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                            >
                                <span>CSV Format</span>
                                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-secondary">.csv</span>
                            </button>
                            <button
                                onClick={() => handleExport('json')}
                                className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-t border-border flex items-center justify-between"
                            >
                                <span>JSON Format</span>
                                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-secondary">.json</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-primary">Portfolio Performance</h3>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="font-mono font-bold">+12.5%</span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        borderColor: 'var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    labelStyle={{ color: 'var(--text-secondary)' }}
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
                                    stroke="var(--text-secondary)"
                                    strokeDasharray="5 5"
                                    fill="none"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-6">
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Risk Analysis
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-secondary">Sharpe Ratio</span>
                                    <span className="text-primary font-mono">1.85</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-secondary">Volatility (30d)</span>
                                    <span className="text-primary font-mono">14.2%</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-[45%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-secondary">Beta</span>
                                    <span className="text-primary font-mono">0.92</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[55%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Correlation Heatmap Preview */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-primary mb-4">Correlation Matrix</h3>
                        <div className="grid grid-cols-4 gap-1">
                            {Array.from({ length: 16 }).map((_, i) => {
                                const opacity = Math.random();
                                return (
                                    <div
                                        key={i}
                                        className="aspect-square rounded"
                                        style={{
                                            backgroundColor: `rgba(139, 92, 246, ${opacity})`
                                        }}
                                        title={`Correlation: ${(opacity * 2 - 1).toFixed(2)}`}
                                    />
                                );
                            })}
                        </div>
                        <p className="text-xs text-secondary mt-3 text-center">
                            Strong correlations detected between Tech & Crypto sectors
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
