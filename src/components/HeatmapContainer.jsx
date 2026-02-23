import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Star, Check, BarChart3, TrendingUp, Link as LinkIcon } from 'lucide-react';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import useMarketStore from '../store';
import useThemeStore from '../hooks/useThemeStore';
import { getCoinGeckoId } from '../config/cryptoMapping';
import ConnectionIndicator from './ConnectionIndicator';
import MarketSelector from './MarketSelector';
import apiManager from '../services/apiManager';
import { findTopCorrelatedAssets, classifyCorrelation } from '../services/analysisService';
import { useAuth } from '../context/AuthContext';
import { watchlistService } from '../services/watchlistService';

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
    if (!price) return '$0.00';
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(2)}`;
}

/**
 * Get color based on percentage change
 */
function getChangeColor(change, isDark = true) {
    if (isDark) {
        if (change > 3) return '#22c55e';
        if (change > 0) return '#4ade80';
        if (change < -3) return '#ef4444';
        if (change < 0) return '#f87171';
        return '#64748b';
    } else {
        // Light mode: deeper, more saturated colors for contrast
        if (change > 3) return '#15803d';   // green-700
        if (change > 0) return '#16a34a';   // green-600
        if (change < -3) return '#b91c1c';  // red-700
        if (change < 0) return '#dc2626';   // red-600
        return '#94a3b8';                    // slate-400
    }
}

/**
 * Get text color that contrasts with background
 */
function getTextColor(change, isDark = true) {
    return '#ffffff'; // Always white — works on both deep greens/reds (light) and bright greens/reds (dark)
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
        if (strength === 'high') return direction === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        if (strength === 'moderate') return direction === 'positive' ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300';
        return 'text-secondary';
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
            className="bg-surface border border-border rounded-xl shadow-2xl p-4 min-w-[280px] animate-fadeIn"
            style={style}
            onClick={(e) => e.stopPropagation()} // Prevent bubbling to parent container
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔗</span>
                    <span className="font-mono font-bold text-primary">{asset.symbol}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="text-secondary hover:text-primary p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Most Correlated Assets</div>

            <div className="space-y-2">
                {correlations.length > 0 ? correlations.map((corr, idx) => (
                    <div key={corr.symbol} className="flex items-center justify-between py-1.5 px-2 bg-slate-100 dark:bg-slate-800/50 rounded">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-secondary w-4">{idx + 1}.</span>
                            <span className="font-mono text-sm text-primary">{corr.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`font-mono text-sm font-bold ${getStrengthColor(corr.strength, corr.direction)}`}>
                                {typeof corr.correlation === 'number' ? corr.correlation.toFixed(2) : '0.00'}
                            </span>
                            <span className="text-xs text-secondary capitalize">{corr.strength}</span>
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
 * Context Menu Component (Portal)
 */
const ContextMenu = ({ asset, position, isWatchlisted, onClose, onToggleWatchlist, onViewDetails, onCompare, onHistorical, onCorrelation }) => {
    const menuRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!asset) return null;

    // Smart positioning — measure menu, flip if near edges
    const MENU_WIDTH = 220;
    const MENU_HEIGHT = 260; // approximate
    const MARGIN = 12;

    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Horizontal: prefer right of click, flip left if too close to right edge
    let left = position.x + MARGIN;
    if (left + MENU_WIDTH > viewW - MARGIN) {
        left = position.x - MENU_WIDTH - MARGIN;
    }
    left = Math.max(MARGIN, Math.min(left, viewW - MENU_WIDTH - MARGIN));

    // Vertical: prefer below click, flip above if too close to bottom
    let top = position.y + MARGIN;
    if (top + MENU_HEIGHT > viewH - MARGIN) {
        top = position.y - MENU_HEIGHT - MARGIN;
    }
    top = Math.max(MARGIN, Math.min(top, viewH - MENU_HEIGHT - MARGIN));

    const style = {
        left,
        top,
        position: 'fixed',
        zIndex: 9999,
    };

    return createPortal(
        <div
            ref={menuRef}
            className="bg-surface border border-border rounded-lg shadow-2xl py-2 min-w-[220px] animate-fadeIn"
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-2 border-b border-border">
                <div className="font-mono font-bold text-primary text-sm">{asset.symbol}</div>
                <div className="text-xs text-secondary">{asset.name}</div>
            </div>

            <div className="py-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleWatchlist(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                    {isWatchlisted ?
                        <><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span>Remove from Watchlist</span></> :
                        <><Star className="w-4 h-4 text-yellow-400" /><span>Add to Watchlist</span></>
                    }
                </button>

                <div className="border-t border-border my-1"></div>

                <button
                    onClick={(e) => { e.stopPropagation(); onCompare(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                    <LinkIcon className="w-4 h-4 text-blue-400" />
                    <span>Compare with...</span>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onHistorical(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>View Historical Data</span>
                </button>

                <div className="border-t border-border my-1"></div>

                <button
                    onClick={(e) => { e.stopPropagation(); onCorrelation(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                    <span className="text-lg leading-none">🔗</span>
                    <span>View Correlations</span>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onViewDetails(); onClose(); }}
                    className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                    <BarChart3 className="w-4 h-4 text-secondary" />
                    <span>More Details</span>
                </button>
            </div>
        </div>,
        document.body
    );
};

/**
 * Custom Tooltip for Heatmap (with Sparkline)
 */
const HeatmapTooltip = ({ node }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchSparkline = async () => {
            // Mock or real fetch depending on performance needs
            // Use 7 days of daily data for a quick sparkline
            try {
                // Determine type based on symbol for now (since node doesn't explicitly store api type sometimes)
                // Assuming type is inferable or global state has selectedMarket.
                // For simplicity, hack: try inferring type or pass it down via node data if extended.
                // Assuming 'crypto', 'stocks', etc.
                // But node.data doesn't have type easily.
                // Let's rely on apiManager's smart routing capability if implemented, or guess.

                // However, without type, getHistoricalData requires type.
                // Let's pass type via node.data in prepareData function below.
                const type = node.data.type || 'stocks';
                if (node.data.isOther) {
                    setLoading(false);
                    return;
                }
                const data = await apiManager.getHistoricalData(node.data.symbol, type, 7);
                if (mounted && data) {
                    // Reverse because API might return newest first, we want oldest first for chart
                    setHistory(data.slice().reverse());
                }
            } catch (e) {
                console.error("Sparkline fetch error", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (node) fetchSparkline();
        return () => { mounted = false; };
    }, [node]);

    if (!node || !node.data) return null;

    const changeColor = node.data.change >= 0 ? '#4ade80' : '#f87171';

    // Calculate simple High/Low from history or fallback
    const high = history.length > 0 ? Math.max(...history.map(d => d.high || d.close)) : node.data.price;
    const low = history.length > 0 ? Math.min(...history.map(d => d.low || d.close)) : node.data.price;


    return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-xl min-w-[200px] pointer-events-none z-50">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="font-bold text-primary">{node.data.symbol}</div>
                    <div className="text-xs text-secondary max-w-[120px] truncate">{node.data.name}</div>
                </div>
                <div className="text-right">
                    <div className="font-mono font-bold text-primary">{node.data.isOther ? 'Aggregated' : formatPrice(node.data.price)}</div>
                    <div className={`text-xs font-bold ${node.data.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {node.data.change > 0 ? '+' : ''}{node.data.change}%
                    </div>
                </div>
            </div>

            {node.data.isOther ? (
                <div className="text-[10px] text-secondary border-t border-border pt-2 mt-2">
                    This block represents {node.data.count} additional assets in this market. Performance shown is a market-cap weighted average.
                </div>
            ) : (
                <>
                    <div className="flex justify-between text-[10px] text-secondary mb-2 border-b border-border pb-1">
                        <span>H: {formatPrice(high)}</span>
                        <span>L: {formatPrice(low)}</span>
                    </div>

                    <div className="h-16 w-full mt-2">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-600">Loading...</div>
                        ) : history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id={`color${node.data.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={changeColor} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={changeColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="close"
                                        stroke={changeColor}
                                        fill={`url(#color${node.data.symbol})`}
                                        strokeWidth={2}
                                        isAnimationActive={false} // Performance
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-600">No Data</div>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-600 text-center mt-1">7-Day Trend</div>
                </>
            )}
        </div>
    );
};


/**
 * Custom node component for treemap with click handler
 */
const CustomNode = ({ node, onNodeClick, onNodeContextMenu, isWatchlisted, isHighlighted }) => {
    const { data } = node;
    if (!data || data.id === 'root') return null;

    const theme = useThemeStore((state) => state.theme);
    const isDark = theme === 'dark';
    const bgColor = getChangeColor(data.change || 0, isDark);
    const textColor = getTextColor(data.change || 0, isDark);
    const changePrefix = data.change > 0 ? '+' : '';

    const handleClick = (e) => {
        e.stopPropagation();
        if (data.isOther) return; // Disable click for "Other" node
        if (onNodeClick) {
            // Use actual mouse click position for precise menu placement
            onNodeClick(data, {
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (data.isOther) return; // Disable context menu for "Other" node
        if (onNodeContextMenu) {
            onNodeContextMenu(data, {
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    return (
        <g
            transform={`translate(${node.x}, ${node.y})`}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            style={{ cursor: 'pointer' }}
        >
            {/* Highlight glow layer (behind the main rect) */}
            {isHighlighted && (
                <rect
                    x={-3}
                    y={-3}
                    width={node.width + 6}
                    height={node.height + 6}
                    rx={6}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    opacity={0.9}
                    className="animate-pulse"
                />
            )}
            <rect
                width={node.width}
                height={node.height}
                fill={isHighlighted ? '#0e7490' : bgColor}
                rx={4}
                className="treemap-block color-transition hover:brightness-110"
                style={{
                    stroke: isHighlighted ? '#22d3ee' : '#0f172a',
                    strokeWidth: isHighlighted ? 2.5 : 2,
                    filter: isHighlighted ? 'brightness(1.3) drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' : 'none',
                }}
            />
            {/* LARGE BOXES: Show Symbol + Change + Price */}
            {node.width > 50 && node.height > 40 && (
                <>
                    <text
                        x={node.width / 2}
                        y={node.height / 2 - (node.height > 60 ? 12 : 8)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontSize={Math.min(node.width / 5, node.height / 3.5, 16)}
                        fontWeight="bold"
                        fontFamily="'JetBrains Mono', monospace"
                    >
                        {data.isOther ? "Other" : data.symbol}
                    </text>
                    <text
                        x={node.width / 2}
                        y={node.height / 2 + (node.height > 60 ? 8 : 10)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontSize={Math.min(node.width / 6, node.height / 4, 14)}
                        fontFamily="'JetBrains Mono', monospace"
                    >
                        {data.isOther ? `+${data.count}` : `${changePrefix}${(data.change || 0).toFixed(2)}%`}
                    </text>
                    {node.height > 65 && node.width > 70 && (
                        <text
                            x={node.width / 2}
                            y={node.height / 2 + 25}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={textColor}
                            fontSize={Math.min(node.width / 9, 10)}
                            opacity={0.8}
                            fontFamily="'JetBrains Mono', monospace"
                        >
                            {formatPrice(data.price || 0)}
                        </text>
                    )}
                </>
            )}
            {/* MEDIUM BOXES: Show Symbol Only */}
            {((node.width <= 50 || node.height <= 40)) && node.width > 20 && node.height > 15 && (
                <text
                    x={node.width / 2}
                    y={node.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor}
                    fontSize={Math.min(node.width / 4, node.height / 2, 10)}
                    fontWeight="bold"
                    fontFamily="'JetBrains Mono', monospace"
                >
                    {data.isOther ? "Other" : data.symbol}
                </text>
            )}

            {/* Watchlist Star Indicator */}
            {node.width > 40 && node.height > 40 && isWatchlisted && (
                <g transform={`translate(${node.width - 16}, 16)`}>
                    <circle r="10" fill="rgba(0,0,0,0.45)" />
                    {/* Filled star path centered at 0,0 (12px viewbox) */}
                    <path
                        d="M0,-7 L1.76,-2.43 L6.66,-2.43 L2.94,0.93 L4.25,5.66 L0,2.97 L-4.25,5.66 L-2.94,0.93 L-6.66,-2.43 L-1.76,-2.43 Z"
                        fill="#fbbf24"
                    />
                </g>
            )}
        </g>
    );
};

/**
 * HeatmapContainer - Main visualization component with click-to-correlate
 */
export default function HeatmapContainer({ paneId, title, highlightedSymbol = '', mobileListView = false, mobileLimit = null, defaultMarket = null }) {
    const navigate = useNavigate();
    const globalMarketData = useMarketStore(state => state.marketData);
    const globalIsConnected = useMarketStore(state => state.isConnected);
    const { currentUser } = useAuth();

    const [marketData, setMarketData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Correlation popup state
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [correlations, setCorrelations] = useState([]);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [isLoadingCorrelations, setIsLoadingCorrelations] = useState(false);

    // Context menu state
    const [contextMenuAsset, setContextMenuAsset] = useState(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    // Watchlist state
    const [watchlist, setWatchlist] = useState([]);

    const pane = useMarketStore((state) => {
        if (paneId === 'mobile') return state.leftPane;
        return paneId === 'left' ? state.leftPane : state.rightPane;
    });
    const setPaneMarket = useMarketStore((state) => state.setPaneMarket);

    // Guard against undefined pane
    if (!pane) {
        return (
            <div className="flex items-center justify-center h-full bg-dark-surface border border-dark-border rounded-xl">
                <div className="text-slate-500">Initializing...</div>
            </div>
        );
    }

    const selectedMarket = defaultMarket || pane.selectedMarket;

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

    // Load watchlist with subscription
    useEffect(() => {
        let unsubscribe = () => { };

        if (currentUser) {
            unsubscribe = watchlistService.subscribeToWatchlist(currentUser.uid, (list) => {
                setWatchlist(list);
            });
        } else {
            const stored = JSON.parse(localStorage.getItem('watchlist') || '[]');
            setWatchlist(stored);
        }

        return () => unsubscribe();
    }, [currentUser]);

    // Watchlist utility functions
    const isInWatchlist = useCallback((symbol) => {
        if (!symbol) return false;
        const upper = symbol.toUpperCase();
        const coinGeckoId = getCoinGeckoId(symbol);

        return watchlist.some(w =>
            w.symbol.toUpperCase() === upper ||
            (w.id && w.id.toUpperCase() === upper) ||
            (coinGeckoId && w.id && w.id.toLowerCase() === coinGeckoId.toLowerCase())
        );
    }, [watchlist]);

    const toggleWatchlist = useCallback(async (asset) => {
        const inWatchlist = isInWatchlist(asset.symbol);

        if (currentUser) {
            try {
                if (inWatchlist) {
                    await watchlistService.removeFromWatchlist(currentUser.uid, asset.symbol);
                } else {
                    await watchlistService.addToWatchlist(currentUser.uid, {
                        symbol: asset.symbol.toUpperCase(),
                        market: selectedMarket,
                        name: asset.name
                    });
                }
            } catch (error) {
                console.error("Watchlist operation failed:", error);
            }
        } else {
            // Fallback for guests
            let updated;
            const coinGeckoId = getCoinGeckoId(asset.symbol);
            const upperSymbol = asset.symbol.toUpperCase();

            if (inWatchlist) {
                updated = watchlist.filter(w => {
                    const wUpper = w.symbol?.toUpperCase();
                    const wIdUpper = w.id?.toUpperCase();

                    const isMatch = wUpper === upperSymbol ||
                        (wIdUpper === upperSymbol) ||
                        (coinGeckoId && (wUpper === coinGeckoId.toUpperCase() || wIdUpper === coinGeckoId.toUpperCase()));

                    return !isMatch;
                });
            } else {
                updated = [...watchlist, {
                    symbol: asset.symbol,
                    market: selectedMarket,
                    name: asset.name
                }];
            }
            localStorage.setItem('watchlist', JSON.stringify(updated));
            setWatchlist(updated);
        }
    }, [watchlist, selectedMarket, isInWatchlist, currentUser]);

    // Handle context menu
    const handleNodeContextMenu = useCallback((assetData, position) => {
        setContextMenuAsset(assetData);
        setContextMenuPosition(position);
        setSelectedAsset(null); // Close correlation popup if open
    }, []);

    // Handle node click - Now opens Context Menu with all options
    const handleNodeClick = useCallback(async (assetData, position) => {
        // Updated behavior: Open the enhanced context menu on click
        setContextMenuAsset(assetData);
        setContextMenuPosition(position);
        setSelectedAsset(null); // Close other popups
    }, []);

    // Function to run when "View Correlations" is clicked in Context Menu
    const handleShowCorrelations = useCallback(async (assetData) => {
        setSelectedAsset(assetData);
        setPopupPosition(contextMenuPosition); // Reuse position or adjust
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
    }, [marketData, contextMenuPosition]);


    // Handle view asset details from context menu
    const handleViewDetails = useCallback(() => {
        if (contextMenuAsset) {
            navigate(`/asset/${selectedMarket}/${contextMenuAsset.symbol}`);
        }
    }, [contextMenuAsset, selectedMarket, navigate]);

    const handleCompare = useCallback(() => {
        if (contextMenuAsset) {
            navigate(`/compare?asset1=${contextMenuAsset.symbol}&market=${selectedMarket}`);
        }
    }, [contextMenuAsset, selectedMarket, navigate]);

    const handleHistorical = useCallback(() => {
        if (contextMenuAsset) {
            // Assuming Historical page takes query params or defaults
            navigate(`/historical?symbol=${contextMenuAsset.symbol}&market=${selectedMarket}`);
        }
    }, [contextMenuAsset, selectedMarket, navigate]);


    // Transform data for Nivo Treemap
    const treemapData = useMemo(() => {
        if (!marketData || marketData.length === 0) {
            return { id: 'root', children: [] };
        }

        const isMobile = window.innerWidth < 768;
        const MAX_MAJOR = isMobile ? 8 : 14; // Less assets on mobile to avoid tiny boxes
        let data = marketData;

        const majorAssets = data.slice(0, MAX_MAJOR).map((asset) => ({
            id: asset.id || asset.symbol.toLowerCase(),
            symbol: asset.symbol,
            name: asset.name,
            value: asset.marketCap || 1000000000,
            price: asset.price,
            change: asset.change,
            type: selectedMarket
        }));

        if (data.length > MAX_MAJOR) {
            const others = data.slice(MAX_MAJOR);
            const totalOtherCap = others.reduce((sum, a) => sum + (a.marketCap || 0), 0);

            // Weighted average change for "Other" block
            const weightedChange = totalOtherCap > 0
                ? others.reduce((sum, a) => sum + ((a.change || 0) * (a.marketCap || 0)), 0) / totalOtherCap
                : others.reduce((sum, a) => sum + (a.change || 0), 0) / others.length;

            majorAssets.push({
                id: 'other-assets',
                symbol: 'OTHER',
                name: 'Other Assets',
                value: totalOtherCap || 500000000,
                change: parseFloat(weightedChange.toFixed(2)),
                isOther: true,
                count: others.length,
                type: selectedMarket
            });
        }

        return {
            id: 'root',
            children: majorAssets,
        };
    }, [marketData, selectedMarket]);

    const handleMarketChange = (market) => {
        setPaneMarket(paneId, market);
        setIsLoading(true);
        setSelectedAsset(null);
    };

    const marketLabels = {
        crypto: 'Cryptocurrency',
        stocks: 'US Stocks',
        commodities: 'Commodities',
    };

    // Custom node with click handler + highlight
    const NodeWithClick = useCallback((props) => (
        <CustomNode
            {...props}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            isWatchlisted={props.node.data && isInWatchlist(props.node.data.symbol)}
            isHighlighted={highlightedSymbol && props.node.data && props.node.data.symbol === highlightedSymbol}
        />
    ), [handleNodeClick, handleNodeContextMenu, isInWatchlist, highlightedSymbol]);

    return (
        <div className="flex flex-col h-full bg-surface rounded-xl border border-border overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-transparent">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <h2 className="text-sm sm:text-lg font-semibold text-primary truncate">{title}</h2>
                    <ConnectionIndicator isConnected={globalIsConnected} isLive={isLive} />
                </div>
                <MarketSelector value={selectedMarket} onChange={handleMarketChange} />
            </div>

            {/* Market Label */}
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-transparent border-b border-border flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm text-secondary font-mono truncate">
                        {marketLabels[selectedMarket]}
                    </span>
                    {!isLive && selectedMarket === 'stocks' && (
                        <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                            ⏸️ After Hours
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-xs text-secondary">Click asset for options</span>
                    {lastUpdate && (
                        <span className="text-[10px] sm:text-xs text-secondary font-mono">
                            {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Treemap */}
            <div
                className={`flex-1 p-1 sm:p-2 relative ${!isLive && selectedMarket === 'stocks' ? 'grayscale-mode' : ''}`}
                style={{ minHeight: window.innerWidth < 640 ? '250px' : '400px' }}
                onClick={() => { setSelectedAsset(null); setContextMenuAsset(null); }} // Close popups
            >
                {isLoading ? (
                    <div className="h-full p-2 flex flex-col gap-2">
                        {/* Skeleton heatmap grid */}
                        <div className="flex gap-2 flex-1">
                            <div className="bg-slate-800/60 rounded-lg flex-[3] animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="bg-slate-800/40 rounded-lg flex-[2] animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="bg-slate-800/50 rounded-lg flex-[2] animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                        <div className="flex gap-2 flex-1">
                            <div className="bg-slate-800/40 rounded-lg flex-[2] animate-pulse" style={{ animationDelay: '100ms' }} />
                            <div className="bg-slate-800/60 rounded-lg flex-[4] animate-pulse" style={{ animationDelay: '250ms' }} />
                            <div className="bg-slate-800/30 rounded-lg flex-[1] animate-pulse" style={{ animationDelay: '400ms' }} />
                        </div>
                        <div className="flex gap-2 flex-[0.8]">
                            <div className="bg-slate-800/50 rounded-lg flex-[1] animate-pulse" style={{ animationDelay: '200ms' }} />
                            <div className="bg-slate-800/40 rounded-lg flex-[1] animate-pulse" style={{ animationDelay: '350ms' }} />
                            <div className="bg-slate-800/60 rounded-lg flex-[2] animate-pulse" style={{ animationDelay: '100ms' }} />
                            <div className="bg-slate-800/30 rounded-lg flex-[1] animate-pulse" style={{ animationDelay: '450ms' }} />
                        </div>
                        <div className="flex items-center justify-center pt-1">
                            <span className="text-xs text-slate-600 font-mono animate-pulse">Loading {selectedMarket} data…</span>
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
                            tooltip={HeatmapTooltip} // Added custom tooltip
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

                        {/* Context Menu (Enhanced) */}
                        {contextMenuAsset && (
                            <ContextMenu
                                asset={contextMenuAsset}
                                position={contextMenuPosition}
                                isWatchlisted={isInWatchlist(contextMenuAsset.symbol)}
                                onClose={() => setContextMenuAsset(null)}
                                onToggleWatchlist={() => toggleWatchlist(contextMenuAsset)}
                                onViewDetails={handleViewDetails}
                                onCompare={handleCompare}
                                onHistorical={handleHistorical}
                                onCorrelation={() => handleShowCorrelations(contextMenuAsset)}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-secondary">
                        <div className="text-center">
                            <div className="text-2xl mb-2">📡</div>
                            <span className="font-mono text-sm">No data available</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            {marketData.length > 0 && (
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-t border-border bg-transparent">
                    <div className="flex justify-between text-[10px] sm:text-xs font-mono text-secondary">
                        <span>{marketData.length} assets</span>
                        <span>
                            {formatMarketCap(marketData.reduce((sum, a) => sum + (a.marketCap || 0), 0))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

