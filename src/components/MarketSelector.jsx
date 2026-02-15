import React from 'react';

/**
 * Market selector dropdown
 * @param {Object} props
 * @param {string} props.value - Currently selected market
 * @param {Function} props.onChange - Handler for market change
 */
export default function MarketSelector({ value, onChange }) {
    const markets = [
        { id: 'crypto', label: 'Crypto' },
        { id: 'stocks', label: 'US Stocks' },
        { id: 'commodities', label: 'Commodities' },
    ];

    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-dark-surface border border-dark-border rounded-lg px-4 py-2 pr-10 text-sm font-mono text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-slate-500"
            >
                {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                        {market.label}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}
