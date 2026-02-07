import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveTreeMap } from '@nivo/treemap';
import useMarketStore from '../store';
import ConnectionIndicator from './ConnectionIndicator';
import MarketSelector from './MarketSelector';
import apiManager from '../services/apiManager';
import { findTopCorrelatedAssets, classifyCorrelation } from '../services/analysisService';

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
function formatMarketCap(value) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value}`;
}

/**
 * Format price with appropriate decimals
 */
function formatPrice(price) {
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(2)}`;
}

/**
 * Get color based on percentage change
 */
function getChangeColor(change) {
    if (change > 3) return '#22c55e';
    if (change > 0) return '#4ade80';
    if (change < -3) return '#ef4444';
    if (change < 0) return '#f87171';
    return '#64748b';
}

/**
 * Get text color that contrasts with background
 */
function getTextColor(change) {
    if (Math.abs(change) > 1.5) return '#ffffff';
    return '#e2e8f0';
}

/**
 * Correlation Popup Component (Portal)
 */
const CorrelationPopup = ({ asset, correlations, onClose, position }) => {
    const popupRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!asset || !correlations) return null;

    const getStrengthColor = (strength, direction) => {
        if (strength === 'high') return direction === 'positive' ? 'text-green-400' : 'text-red-400';
        if (strength === 'moderate') return direction === 'positive' ? 'text-green-300' : 'text-red-300';
        return 'text-slate-400';
    };

    // Smart positioning to prevent overflow
    const style = {
        left: position.x,
        top: position.y,
        position: 'fixed',
        transform: 'translateX(-50%)', // Center horizontally relative to x
        zIndex: 9999, // Ensure it's on top of everything
    };

    // Adjust vertical position if too close to bottom
    const isNearBottom = position.y > window.innerHeight - 300;
    if (isNearBottom) {
        style.top = 'auto'; // Reset top
        style.bottom = window.innerHeight - position.y + 10; // Position above the click
    }

    return createPortal(
        <div
            ref={popupRef}
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 min-w-[280px] animate-fadeIn"
            style={style}
            onClick={(e) => e.stopPropagation()} // Prevent bubbling to parent container
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔗</span>
                    <span className="font-mono font-bold text-slate-200">{asset.symbol}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800 rounded transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Most Correlated Assets</div>

            <div className="space-y-2">
                {correlations.length > 0 ? correlations.map((corr, idx) => (
                    <div key={corr.symbol} className="flex items-center justify-between py-1.5 px-2 bg-slate-800/50 rounded">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 w-4">{idx + 1}.</span>
                            <span className="font-mono text-sm text-slate-200">{corr.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-mono text-sm font-bold ${getStrengthColor(corr.strength, corr.direction)}`}>
                                {corr.correlation.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">{corr.strength}</span>
                        </div>
                    </div>
                )) : (
                    <div className="text-sm text-slate-500 text-center py-4 flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Loading analysis...</span>
                    </div>
                )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700 text-[10px] text-slate-600 text-center">
                Based on 90-day correlation
            </div>
        </div>,
        document.body
    );
};

/**
 * Custom node component for treemap with click handler
 */
const CustomNode = ({ node, onNodeClick }) => {
    const { data } = node;
    if (!data || data.id === 'root') return null;

    const bgColor = getChangeColor(data.change || 0);
    const textColor = getTextColor(data.change || 0);
    const changePrefix = data.change > 0 ? '+' : '';

    const handleClick = (e) => {
        e.stopPropagation(); // Stop event from bubbling to container
        if (onNodeClick) {
            // Get viewport-relative coordinates
            const rect = e.target.getBoundingClientRect();
            // Calculate center-bottom of the node
            onNodeClick(data, {
                x: rect.left + rect.width / 2,
                y: rect.bottom + 8 // 8px offset
            });
        }
    };

    return (
        <g transform={`translate(${node.x}, ${node.y})`} onClick={handleClick} style={{ cursor: 'pointer' }}>
            <rect
                width={node.width}
                height={node.height}
                fill={bgColor}
                rx={4}
                className="treemap-block color-transition hover:brightness-110"
                style={{
                    stroke: '#0f172a',
                    strokeWidth: 2,
                }}
            />
            {node.width > 60 && node.height > 50 && (
                <>
                    <text
                        x={node.width / 2}
                        y={node.height / 2 - 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontSize={Math.min(node.width / 5, 16)}
                        fontWeight="bold"
                        fontFamily="'JetBrains Mono', monospace"
                    >
                        {data.symbol}
                    </text>
                    <text
                        x={node.width / 2}
                        y={node.height / 2 + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontSize={Math.min(node.width / 6, 14)}
                        fontFamily="'JetBrains Mono', monospace"
                    >
                        {changePrefix}{(data.change || 0).toFixed(2)}%
                    </text>
                    {node.height > 70 && node.width > 80 && (
                        <text
                            x={node.width / 2}
                            y={node.height / 2 + 26}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={textColor}
                            fontSize={Math.min(node.width / 8, 11)}
                            opacity={0.8}
                            fontFamily="'JetBrains Mono', monospace"
                        >
                            {formatPrice(data.price || 0)}
                        </text>
                    )}
                </>
            )}
            {node.width > 30 && node.width <= 60 && node.height > 25 && (
                <text
                    x={node.width / 2}
                    y={node.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor}
                    fontSize={10}
                    fontWeight="bold"
                    fontFamily="'JetBrains Mono', monospace"
                >
                    {data.symbol}
                </text>
            )}
        </g>
    );
};

/**
 * HeatmapContainer - Main visualization component with click-to-correlate
 */
export default function HeatmapContainer({ paneId, title }) {
    const globalMarketData = useMarketStore(state => state.marketData);
    const globalIsConnected = useMarketStore(state => state.isConnected);

    const [marketData, setMarketData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Correlation popup state
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [correlations, setCorrelations] = useState([]);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [isLoadingCorrelations, setIsLoadingCorrelations] = useState(false);

    const pane = useMarketStore((state) =>
        paneId === 'left' ? state.leftPane : state.rightPane
    );
    const setPaneMarket = useMarketStore((state) => state.setPaneMarket);

    const selectedMarket = pane.selectedMarket;

    // Sync with global store data
    useEffect(() => {
        const dataArray = globalMarketData[selectedMarket];
        if (dataArray && dataArray.length > 0) {
            setMarketData(dataArray);
            setIsLoading(false);
            setLastUpdate(new Date());
            setIsLive(apiManager.isMarketOpen(selectedMarket));
        } else if (dataArray && dataArray.length === 0) {
            // Data exists but is empty
            setMarketData([]);
            setIsLoading(false);
        } else {
            // Fallback: fetch initial data if store is empty
            const fetchInitialData = async () => {
                try {
                    const data = await apiManager.getMarketData(selectedMarket);
                    if (data) {
                        setMarketData(data);
                        setIsLoading(false);
                        setLastUpdate(new Date());
                        setIsLive(apiManager.isMarketOpen(selectedMarket));
                    }
                } catch (error) {
                    console.error(`Failed to fetch ${selectedMarket} data:`, error);
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [globalMarketData, selectedMarket]);

    // Handle node click - fetch correlations
    const handleNodeClick = useCallback(async (assetData, position) => {
        // Toggle if same asset clicked
        if (selectedAsset?.symbol === assetData.symbol) {
            setSelectedAsset(null);
            return;
        }

        setSelectedAsset(assetData);
        // Position now comes directly from ClientRect (viewport relative), no clamping needed
        setPopupPosition(position);
        setCorrelations([]);
        setIsLoadingCorrelations(true);

        try {
            const allAssets = marketData.map(a => ({ symbol: a.symbol, name: a.name }));
            const topCorr = await findTopCorrelatedAssets(assetData.symbol, allAssets, 90, 5);
            setCorrelations(topCorr);
        } catch (error) {
            console.error('Failed to fetch correlations:', error);
        } finally {
            setIsLoadingCorrelations(false);
        }
    }, [selectedAsset, marketData]);

    // Transform data for Nivo Treemap
    const treemapData = useMemo(() => {
        if (!marketData || marketData.length === 0) {
            return { id: 'root', children: [] };
        }

        return {
            id: 'root',
            children: marketData.map((asset) => ({
                id: asset.id || asset.symbol.toLowerCase(),
                symbol: asset.symbol,
                name: asset.name,
                value: asset.marketCap || 1000000000,
                price: asset.price,
                change: asset.change,
            })),
        };
    }, [marketData]);

    const handleMarketChange = (market) => {
        setPaneMarket(paneId, market);
        setIsLoading(true);
        setSelectedAsset(null);
    };

    const marketLabels = {
        crypto: '🚀 Cryptocurrency',
        stocks: '📊 US Stocks',
        commodities: '⚡ Commodities',
    };

    // Custom node with click handler
    const NodeWithClick = useCallback((props) => (
        <CustomNode {...props} onNodeClick={handleNodeClick} />
    ), [handleNodeClick]);

    return (
        <div className="flex flex-col h-full bg-dark-surface rounded-xl border border-dark-border overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
                    <ConnectionIndicator isConnected={globalIsConnected} isLive={isLive} />
                </div>
                <MarketSelector value={selectedMarket} onChange={handleMarketChange} />
            </div>

            {/* Market Label */}
            <div className="px-4 py-2 bg-slate-800/30 border-b border-dark-border flex items-center justify-between">
                <div>
                    <span className="text-sm text-slate-400 font-mono">
                        {marketLabels[selectedMarket]}
                    </span>
                    {!isLive && selectedMarket === 'stocks' && (
                        <span className="ml-2 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                            ⏸️ After Hours
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600">Click asset for correlations</span>
                    {lastUpdate && (
                        <span className="text-xs text-slate-600 font-mono">
                            {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Treemap */}
            <div
                className={`flex-1 p-2 relative ${!isLive && selectedMarket === 'stocks' ? 'grayscale-mode' : ''}`}
                style={{ minHeight: '400px' }}
                onClick={() => setSelectedAsset(null)} // Close popup when clicking on background
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="font-mono text-sm">Loading {selectedMarket} data...</span>
                        </div>
                    </div>
                ) : marketData.length > 0 ? (
                    <>
                        <ResponsiveTreeMap
                            data={treemapData}
                            identity="id"
                            value="value"
                            valueFormat=" >-.2s"
                            tile="squarify"
                            leavesOnly={true}
                            innerPadding={3}
                            outerPadding={3}
                            borderWidth={0}
                            enableLabel={false}
                            nodeComponent={NodeWithClick}
                            colors={(node) => getChangeColor(node.data.change || 0)}
                            animate={true}
                            motionConfig="gentle"
                        />

                        {/* Correlation Popup is now rendered via Portal in its component */}
                        {selectedAsset && (
                            <CorrelationPopup
                                asset={selectedAsset}
                                correlations={correlations}
                                onClose={() => setSelectedAsset(null)}
                                position={popupPosition}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <div className="text-center">
                            <div className="text-2xl mb-2">📡</div>
                            <span className="font-mono text-sm">No data available</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            {marketData.length > 0 && (
                <div className="px-4 py-2 border-t border-dark-border bg-slate-800/30">
                    <div className="flex justify-between text-xs font-mono text-slate-500">
                        <span>{marketData.length} assets • 15-min delayed</span>
                        <span>
                            Total: {formatMarketCap(marketData.reduce((sum, a) => sum + (a.marketCap || 0), 0))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
