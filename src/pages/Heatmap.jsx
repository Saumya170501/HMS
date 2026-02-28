import React, { useState, useEffect } from 'react';
import { Search, X, List, LayoutGrid } from 'lucide-react';
import HeatmapContainer from '../components/HeatmapContainer';

export default function Heatmap() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMarket, setMobileMarket] = useState('stocks');
    const [listView, setListView] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const highlightedSymbol = searchQuery.trim().toUpperCase();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="p-4 sm:p-6 md:p-8 h-[calc(100vh-64px)] animate-fadeIn flex flex-col">
            <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                            <LayoutGrid className="w-8 h-8 text-blue-500" />
                            Market Heatmap
                        </h1>
                        <p className="hidden md:block text-sm font-medium text-slate-500 dark:text-slate-400">
                            Dual-viewport market visualization and comparison.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 z-30">
                        {/* Mobile Market Toggle */}
                        {isMobile && (
                            <div className="flex bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
                                {['stocks', 'crypto', 'commodities'].map((market) => (
                                    <button
                                        key={market}
                                        onClick={() => setMobileMarket(market)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mobileMarket === market
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {market.charAt(0).toUpperCase() + market.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* List/Grid Toggle (Mobile) */}
                        {isMobile && (
                            <button
                                onClick={() => setListView(!listView)}
                                className="p-2.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md"
                                title={listView ? 'Grid View' : 'List View'}
                            >
                                {listView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                            </button>
                        )}

                        {/* Search-to-Zoom */}
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Highlight ticker"
                                className="w-full sm:w-64 pl-9 pr-8 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm backdrop-blur-md"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Heatmap Content */}
                <div className="flex-1 min-h-0 bento-card p-2 sm:p-4 group/heatmap border border-slate-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden flex flex-col">
                    {/* Decorative glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                        {isMobile ? (
                            /* Mobile: Single Viewport */
                            <div className="flex-1 w-full h-full min-h-0">
                                <HeatmapContainer
                                    paneId="mobile"
                                    title={mobileMarket.charAt(0).toUpperCase() + mobileMarket.slice(1)}
                                    highlightedSymbol={highlightedSymbol}
                                    mobileListView={listView}
                                    mobileLimit={15}
                                    defaultMarket={mobileMarket}
                                />
                            </div>
                        ) : (
                            /* Desktop: Dual Viewport */
                            <div className="flex-1 flex gap-4 w-full h-full min-h-0">
                                <div className="flex-1 min-w-0 h-full">
                                    <HeatmapContainer paneId="left" title="Left Viewport" highlightedSymbol={highlightedSymbol} />
                                </div>
                                <div className="w-px bg-slate-200/50 dark:bg-slate-700/50 shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                                <div className="flex-1 min-w-0 h-full">
                                    <HeatmapContainer paneId="right" title="Right Viewport" highlightedSymbol={highlightedSymbol} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

