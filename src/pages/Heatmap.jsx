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
<<<<<<< HEAD
        <div className="p-3 sm:p-4 md:p-6 h-[calc(100vh-48px)] md:h-[calc(100vh-64px)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-primary">Market Heatmap</h1>
                    <p className="hidden md:block text-secondary text-sm font-mono">Dual-viewport visualization</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Mobile Market Toggle */}
                    {isMobile && (
                        <div className="flex bg-slate-200 dark:bg-slate-800/60 rounded-lg p-0.5 border border-border">
                            {['stocks', 'crypto', 'commodities'].map((market) => (
                                <button
                                    key={market}
                                    onClick={() => setMobileMarket(market)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mobileMarket === market
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-secondary hover:text-primary'
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
                            className="p-2 bg-slate-100 dark:bg-slate-800/60 border border-border rounded-lg text-secondary hover:text-primary transition-colors"
                            title={listView ? 'Grid View' : 'List View'}
                        >
                            {listView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                        </button>
                    )}

                    {/* Search-to-Zoom */}
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Highlight ticker"
                            className="w-full sm:w-56 pl-8 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800/60 border border-border rounded-lg text-sm text-primary placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Heatmap Content */}
            {isMobile ? (
                /* Mobile: Single Viewport */
                <div className="h-[calc(100%-80px)]">
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
                <div className="heatmap-dual flex gap-4 h-[calc(100%-60px)]">
                    <div className="heatmap-pane flex-1 min-w-0">
                        <HeatmapContainer paneId="left" title="Left Viewport" highlightedSymbol={highlightedSymbol} />
                    </div>
                    <div className="heatmap-divider w-px bg-dark-border" />
                    <div className="heatmap-pane flex-1 min-w-0">
                        <HeatmapContainer paneId="right" title="Right Viewport" highlightedSymbol={highlightedSymbol} />
                    </div>
=======
        <div className="p-4 md:p-6 h-auto md:h-[calc(100vh-64px)] overflow-y-auto md:overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-200">Market Heatmap</h1>
                    <p className="text-slate-500 text-xs md:text-sm font-mono">Dual-viewport visualization</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[calc(100%-60px)] pb-20 md:pb-0">
                {/* Left Pane */}
                <div className="w-full md:flex-1 min-w-0 h-[450px] md:h-full">
                    <HeatmapContainer paneId="left" title="Left Viewport" />
                </div>

                {/* Divider - Hidden on mobile */}
                <div className="hidden md:block w-px bg-dark-border" />

                {/* Right Pane */}
                <div className="w-full md:flex-1 min-w-0 h-[450px] md:h-full">
                    <HeatmapContainer paneId="right" title="Right Viewport" />
>>>>>>> b094702fd2785f0ea4cd17431efbb841318dc055
                </div>
            )}
        </div>
    );
}

