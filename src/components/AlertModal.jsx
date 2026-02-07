import React, { useState, useEffect } from 'react';
import { X, Bell, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import useMarketStore from '../store';

export default function AlertModal({ isOpen, onClose, onSave, editingAlert = null, initialSymbol = '' }) {
    const [symbol, setSymbol] = useState(initialSymbol);
    const [type, setType] = useState('price_above');
    const [threshold, setThreshold] = useState('');
    const [error, setError] = useState('');

    const marketData = useMarketStore(state => state.marketData);

    const allAssets = [
        ...marketData.stocks,
        ...marketData.crypto,
        ...marketData.commodities
    ];

    useEffect(() => {
        if (editingAlert) {
            setSymbol(editingAlert.symbol);
            setType(editingAlert.type);
            setThreshold(editingAlert.threshold);
        } else if (initialSymbol) {
            setSymbol(initialSymbol);
        } else {
            setSymbol('');
            setType('price_above');
            setThreshold('');
        }
        setError('');
    }, [isOpen, editingAlert, initialSymbol]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!symbol) {
            setError('Please select an asset');
            return;
        }

        if (!threshold || isNaN(parseFloat(threshold))) {
            setError('Please enter a valid threshold value');
            return;
        }

        onSave({
            symbol: symbol.toUpperCase(),
            type,
            threshold: parseFloat(threshold),
            triggered: false
        });
        onClose();
    };

    const currentPrice = allAssets.find(a => a.symbol === symbol)?.price;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-500" />
                        {editingAlert ? 'Edit Alert' : 'Create Price Alert'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Asset Selection */}
                    <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">Asset Symbol</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                placeholder="e.g. BTC, AAPL, GOLD"
                                className="w-full bg-slate-800 border border-dark-border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!!editingAlert}
                            />
                            {currentPrice && (
                                <div className="absolute right-3 top-2.5 text-xs text-slate-400">
                                    Current: ${currentPrice.toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alert Type */}
                    <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">Condition</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('price_above')}
                                className={`p-2 rounded-lg border text-sm flex flex-col items-center justify-center gap-1 transition-colors ${type === 'price_above'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-dark-border text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4" />
                                <span>Price Above</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('price_below')}
                                className={`p-2 rounded-lg border text-sm flex flex-col items-center justify-center gap-1 transition-colors ${type === 'price_below'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-dark-border text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4 rotate-180" />
                                <span>Price Below</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('percent_change')}
                                className={`p-2 rounded-lg border text-sm flex flex-col items-center justify-center gap-1 transition-colors ${type === 'percent_change'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                    : 'bg-slate-800 border-dark-border text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <Percent className="w-4 h-4" />
                                <span>% Change</span>
                            </button>
                        </div>
                    </div>

                    {/* Threshold */}
                    <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                            {type === 'percent_change' ? 'Percentage Threshold' : 'Target Price ($)'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder={type === 'percent_change' ? "5.0" : "50000"}
                            className="w-full bg-slate-800 border border-dark-border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs flex items-center gap-1 bg-red-500/10 p-2 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            {editingAlert ? 'Update Alert' : 'Create Alert'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
