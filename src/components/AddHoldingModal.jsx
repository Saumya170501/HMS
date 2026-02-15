import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Coins, Pickaxe } from 'lucide-react';
import useMarketStore from '../store';
import apiManager from '../services/apiManager';

export default function AddHoldingModal({ onClose, onAdd }) {
    const marketData = useMarketStore(state => state.marketData);
    const [selectedMarket, setSelectedMarket] = useState('stocks');
    const [selectedAsset, setSelectedAsset] = useState('');
    const [quantity, setQuantity] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const assets = marketData[selectedMarket] || [];
    const selectedAssetData = assets.find(a => a.symbol === selectedAsset);

    // Auto-fill purchase price with current price
    useEffect(() => {
        if (selectedAssetData && !purchasePrice) {
            setPurchasePrice(selectedAssetData.price.toString());
        }
    }, [selectedAssetData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!selectedAsset) {
            setError('Please select an asset');
            return;
        }
        if (!quantity || parseFloat(quantity) <= 0) {
            setError('Please enter a valid quantity');
            return;
        }
        if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
            setError('Please enter a valid purchase price');
            return;
        }

        const holdingData = {
            symbol: selectedAsset,
            name: selectedAssetData?.name || selectedAsset,
            market: selectedMarket,
            quantity: parseFloat(quantity),
            purchasePrice: parseFloat(purchasePrice),
            purchaseDate: purchaseDate,
            currentPrice: selectedAssetData?.price || parseFloat(purchasePrice)
        };

        onAdd(holdingData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-slate-200">Add Holding</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Market Selection */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2 font-medium">
                            Step 1: Choose Market
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'text-blue-500' },
                                { value: 'crypto', label: 'Crypto', icon: Coins, color: 'text-purple-500' },
                                { value: 'commodities', label: 'Commodities', icon: Pickaxe, color: 'text-amber-500' }
                            ].map((market) => (
                                <button
                                    key={market.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedMarket(market.value);
                                        setSelectedAsset('');
                                        setPurchasePrice('');
                                    }}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl font-medium text-sm transition-all ${selectedMarket === market.value
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                        }`}
                                >
                                    <market.icon className={`w-5 h-5 ${selectedMarket === market.value ? 'text-white' : market.color}`} />
                                    <span>{market.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Asset Selection */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2 font-medium">
                            Step 2: Select Asset
                        </label>
                        <select
                            value={selectedAsset}
                            onChange={(e) => {
                                setSelectedAsset(e.target.value);
                                setPurchasePrice('');
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select an asset</option>
                            {assets.map((asset) => (
                                <option key={asset.symbol} value={asset.symbol}>
                                    {asset.symbol} - {asset.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Asset Preview */}
                    {selectedAssetData && (
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-lg text-slate-200">
                                    {selectedAssetData.symbol}
                                </span>
                                <span className={`font-mono ${selectedAssetData.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {selectedAssetData.change >= 0 ? '+' : ''}{selectedAssetData.change?.toFixed(2)}%
                                </span>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">{selectedAssetData.name}</div>
                            <div className="text-xl font-mono text-slate-200">
                                ${selectedAssetData.price?.toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2 font-medium">
                            Step 3: Enter Quantity
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g., 10"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Purchase Price (Optional) */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2 font-medium">
                            Purchase Price (Optional)
                            <span className="text-slate-600 ml-2">Defaults to current price</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                                placeholder={selectedAssetData?.price.toString() || '0.00'}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Purchase Date (Optional) */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2 font-medium">
                            Purchase Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Cost Preview */}
                    {quantity && purchasePrice && (
                        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-300">Total Cost</span>
                                <span className="font-mono font-bold text-blue-200 text-lg">
                                    ${(parseFloat(quantity) * parseFloat(purchasePrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/25 font-medium"
                        >
                            Add to Portfolio
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
