import React, { useState, useEffect, useRef } from 'react';
import apiManager from '../services/apiManager';
import { TrendingUp, Coins, Pickaxe, LayoutGrid } from 'lucide-react';

// ... (imports)

export default function SearchBar({ onSelect, placeholder = "Search assets..." }) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [category, setCategory] = useState('all'); // 'all', 'stocks', 'crypto', 'commodities'
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Pass category to apiManager
                const searchResults = await apiManager.search(query, category);
                setResults(searchResults.slice(0, 10));
                setIsOpen(true);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, category]); // Re-run when category changes

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };



    const handleSelect = (asset) => {
        if (onSelect) {
            onSelect(asset);
        }
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const getMarketIcon = (market) => {
        switch (market?.toLowerCase()) {
            case 'crypto': return <Coins className="w-4 h-4 text-orange-500" />;
            case 'forex': return <TrendingUp className="w-4 h-4 text-blue-500" />;
            case 'commodities': return <Pickaxe className="w-4 h-4 text-yellow-500" />;
            default: return <TrendingUp className="w-4 h-4 text-green-500" />;
        }
    };

    const getMarketColor = (market) => {
        switch (market?.toLowerCase()) {
            case 'crypto': return 'text-orange-400';
            case 'forex': return 'text-blue-400';
            case 'commodities': return 'text-yellow-400';
            default: return 'text-green-400';
        }
    };

    const categories = [
        { id: 'all', label: 'All', icon: LayoutGrid },
        { id: 'stocks', label: 'Stocks', icon: TrendingUp },
        { id: 'crypto', label: 'Crypto', icon: Coins },
        { id: 'commodities', label: 'Cmdty', icon: Pickaxe },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative flex flex-col gap-2">
                {/* Search Input Group */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            setIsFocused(true);
                            if (query.length >= 2) setIsOpen(true);
                        }}
                        placeholder={`Search ${category === 'all' ? 'markets' : category}...`}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-border rounded-lg px-4 py-2.5 pl-10 pr-24 text-sm text-primary placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        {isLoading ? (
                            <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Category Tabs (Desktop) */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <div className="hidden md:flex bg-slate-200/70 dark:bg-slate-700/50 rounded-md p-1 gap-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`p-1.5 rounded-md transition-all ${category === cat.id
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-secondary hover:text-primary hover:bg-slate-300/50 dark:hover:bg-slate-600/50'}`}
                                    title={cat.label}
                                >
                                    <cat.icon className="w-3.5 h-3.5" />
                                </button>
                            ))}
                        </div>
                        {/* Mobile Category Indicator */}
                        <div className="md:hidden">
                            {categories.map(cat => cat.id === category && (
                                <cat.icon key={cat.id} className="w-4 h-4 text-slate-400" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Category Scroll (Absolute overlay on mobile) */}
                {(isFocused || query.length > 0) && (
                    <div className="md:hidden absolute top-full left-0 right-0 mt-2 z-40 bg-surface border border-border rounded-lg shadow-lg p-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${category === cat.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-secondary border border-border'
                                        }`}
                                >
                                    <cat.icon className="w-3 h-3" />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-slate-100 dark:bg-slate-900/50 border-b border-border text-[10px] font-semibold text-secondary uppercase tracking-wider flex justify-between">
                        <span>Best Matches</span>
                        <span className="text-blue-400">{category === 'all' ? 'All Markets' : category}</span>
                    </div>
                    <ul>
                        {results.map((result, index) => (
                            <li
                                key={`${result.symbol}-${result.market}`}
                                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                onClick={() => handleSelect(result)}
                            >
                                <span>{getMarketIcon(result.market)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-primary">{result.symbol}</span>
                                        <span className={`text-xs uppercase ${getMarketColor(result.market)}`}>
                                            {result.market}
                                        </span>
                                    </div>
                                    <div className="text-sm text-secondary truncate">{result.name}</div>
                                </div>
                                {result.price && (
                                    <div className="text-right">
                                        <div className="font-mono text-sm text-primary">${result.price}</div>
                                        <div className={`text-xs font-mono ${result.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {result.change >= 0 ? '+' : ''}{result.change?.toFixed(2)}%
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* No Results */}
            {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Pickaxe className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No {category === 'all' ? 'results' : category} found for "{query}"</p>
                        {category !== 'all' && (
                            <button
                                onClick={() => setCategory('all')}
                                className="text-xs text-blue-500 hover:underline mt-1"
                            >
                                Try searching all markets
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
