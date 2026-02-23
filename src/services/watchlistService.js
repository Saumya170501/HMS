import { db } from '../config/firebase';
import {
    collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot
} from 'firebase/firestore';
import { getCoinGeckoId } from '../config/cryptoMapping';

/**
 * Get the watchlist subcollection reference
 */
function getWatchlistCol(userId) {
    return collection(db, 'users', userId, 'watchlist');
}

export const watchlistService = {
    /**
     * Get all watchlist items for a user
     * @param {string} userId
     * @returns {Promise<Array>} Array of watchlist items
     */
    async getWatchlist(userId) {
        if (!userId) return [];
        try {
            const snapshot = await getDocs(getWatchlistCol(userId));
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (error) {
            console.error('Error fetching watchlist:', error);
            return [];
        }
    },

    /**
     * Add item to user's watchlist
     * @param {string} userId
     * @param {object} item { symbol, market, name }
     */
    async addToWatchlist(userId, item) {
        if (!userId || !item?.symbol) return;
        const normalizedSymbol = item.symbol.toUpperCase();
        try {
            const docRef = doc(db, 'users', userId, 'watchlist', normalizedSymbol);
            await setDoc(docRef, {
                symbol: normalizedSymbol,
                market: item.market,
                name: item.name || item.symbol,
                addedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            throw error;
        }
    },

    /**
     * Remove item from user's watchlist
     * @param {string} userId
     * @param {string} symbol
     */
    async removeFromWatchlist(userId, symbol) {
        if (!userId || !symbol) return;
        const upper = symbol.toUpperCase();
        const lower = symbol.toLowerCase();
        const coinGeckoId = getCoinGeckoId(symbol);

        try {
            // Delete standard uppercase doc
            await deleteDoc(doc(db, 'users', userId, 'watchlist', upper));

            // Cleanup lowercase doc
            if (upper !== lower) {
                await deleteDoc(doc(db, 'users', userId, 'watchlist', lower));
            }

            // Cleanup legacy CoinGecko ID doc (e.g., 'bitcoin')
            if (coinGeckoId && coinGeckoId !== lower && coinGeckoId !== upper) {
                await deleteDoc(doc(db, 'users', userId, 'watchlist', coinGeckoId));
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            throw error;
        }
    },

    /**
     * Remove item by exact Firestore document ID
     * @param {string} userId
     * @param {string} docId
     */
    async removeByExactId(userId, docId) {
        if (!userId || !docId) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'watchlist', docId));
        } catch (error) {
            console.error('Error removing exact ID from watchlist:', error);
            throw error;
        }
    },

    /**
     * Check if an asset is in the watchlist
     * @param {string} userId
     * @param {string} symbol
     * @returns {Promise<string|boolean>} Returns the document ID if found, otherwise false
     */
    async isInWatchlist(userId, symbol) {
        if (!userId || !symbol) return false;
        const upper = symbol.toUpperCase();
        const lower = symbol.toLowerCase();
        const coinGeckoId = getCoinGeckoId(symbol);

        try {
            // Check uppercase
            const upperSnap = await getDoc(doc(db, 'users', userId, 'watchlist', upper));
            if (upperSnap.exists()) return upperSnap.id;

            // Check lowercase
            if (upper !== lower) {
                const lowerSnap = await getDoc(doc(db, 'users', userId, 'watchlist', lower));
                if (lowerSnap.exists()) return lowerSnap.id;
            }

            // Check legacy CoinGecko ID
            if (coinGeckoId && coinGeckoId !== lower && coinGeckoId !== upper) {
                const legacySnap = await getDoc(doc(db, 'users', userId, 'watchlist', coinGeckoId));
                if (legacySnap.exists()) return legacySnap.id;
            }

            return false;
        } catch {
            return false;
        }
    },

    /**
     * Subscribe to real-time watchlist updates
     */
    subscribeToWatchlist(userId, callback) {
        if (!userId) return () => { };

        return onSnapshot(getWatchlistCol(userId), (snapshot) => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(items);
        }, (error) => {
            console.error('Watchlist subscription error:', error);
        });
    }
};
