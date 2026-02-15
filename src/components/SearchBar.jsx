import React, { useState, useEffect, useRef } from 'react';
import apiManager from '../services/apiManager';
import { TrendingUp, Coins, Pickaxe, LayoutGrid } from 'lucide-react';

export default function SearchBar({ onSelect, placeholder = "Search stocks, crypto, commodities..." }) {
    const [query, setQuery] = useState('');
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
                const searchResults = await apiManager.search(query);
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
    }, [query]);

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

    const handleSelect = (result) => {
        setQuery('');
        setIsOpen(false);
        if (onSelect) {
            onSelect(result);
        }
    };

    const getMarketIcon = (market) => {
        switch (market) {
            case 'stocks': return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 'crypto': return <Coins className="w-5 h-5 text-purple-500" />;
            case 'commodities': return <Pickaxe className="w-5 h-5 text-amber-500" />;
            default: return <LayoutGrid className="w-5 h-5 text-slate-500" />;
        }
    };

    const getMarketColor = (market) => {
        switch (market) {
            case 'stocks': return 'text-blue-400';
            case 'crypto': return 'text-orange-400';
            case 'commodities': return 'text-yellow-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full bg-slate-800 border border-dark-border rounded-lg px-4 py-2.5 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                {query && (
                    <button
                        onClick={() => { setQuery(''); setIsOpen(false); }}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-surface border border-dark-border rounded-lg shadow-xl overflow-hidden z-50">
                    <ul>
                        {results.map((result, index) => (
                            <li
                                key={`${result.symbol}-${result.market}`}
                                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                                    }`}
                                onClick={() => handleSelect(result)}
                            >
                                <span>{getMarketIcon(result.market)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-200">{result.symbol}</span>
                                        <span className={`text-xs uppercase ${getMarketColor(result.market)}`}>
                                            {result.market}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 truncate">{result.name}</div>
                                </div>
                                {result.price && (
                                    <div className="text-right">
                                        <div className="font-mono text-sm text-slate-200">${result.price}</div>
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-surface border border-dark-border rounded-lg shadow-xl p-4 text-center text-slate-500">
                    No results found for "{query}"
                </div>
            )}
        </div>
    );
}
