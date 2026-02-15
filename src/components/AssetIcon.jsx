import React, { useState } from 'react';
import { getAssetIcon } from '../services/assetIconService';

/**
 * AssetIcon — displays the real logo for any asset.
 * Falls back to a colored letter avatar if the image fails to load.
 *
 * @param {string} symbol - e.g. 'BTC', 'AAPL', 'GOLD'
 * @param {string} market - 'crypto' | 'stocks' | 'commodities'
 * @param {number} size   - pixel size (default 28)
 * @param {string} className - extra classes
 */
export default function AssetIcon({ symbol, market, size = 28, className = '' }) {
    const [imgError, setImgError] = useState(false);
    const icon = getAssetIcon(symbol, market);

    const sizeStyle = { width: size, height: size, minWidth: size };

    // Emoji icons (commodities)
    if (icon.type === 'emoji') {
        return (
            <span
                className={`flex items-center justify-center ${className}`}
                style={{ ...sizeStyle, fontSize: size * 0.7 }}
                role="img"
                aria-label={symbol}
            >
                {icon.value}
            </span>
        );
    }

    // Letter avatar fallback
    if (icon.type === 'letter' || imgError) {
        const colors = [
            'from-blue-500 to-purple-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-pink-500 to-rose-600',
            'from-cyan-500 to-blue-600',
            'from-violet-500 to-purple-600',
        ];
        const colorIndex = (symbol || '').charCodeAt(0) % colors.length;

        return (
            <div
                className={`rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shadow-md ${className}`}
                style={{ ...sizeStyle, fontSize: size * 0.45 }}
            >
                {(symbol || '?').charAt(0)}
            </div>
        );
    }

    // Image URL (crypto or stock logos)
    return (
        <img
            src={icon.value}
            alt={`${symbol} icon`}
            className={`rounded-full object-cover bg-white/10 ${className}`}
            style={sizeStyle}
            onError={(e) => {
                // Try fallback URL if available
                if (icon.fallback && e.target.src !== icon.fallback) {
                    e.target.src = icon.fallback;
                } else {
                    setImgError(true);
                }
            }}
            loading="lazy"
        />
    );
}
