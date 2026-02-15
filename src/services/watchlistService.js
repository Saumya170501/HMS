import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

export const watchlistService = {
    /**
     * Get watchlist for a user
     * @param {string} userId
     * @returns {Promise<Array>} Array of watchlist items
     */
    async getWatchlist(userId) {
        if (!userId) return [];
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().watchlist || [];
            }
            return [];
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
        if (!userId) return;
        try {
            const docRef = doc(db, 'users', userId);
            // Check if doc exists first, if not create it
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    watchlist: [item],
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            } else {
                await updateDoc(docRef, {
                    watchlist: arrayUnion(item),
                    updatedAt: new Date().toISOString()
                });
            }
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
        if (!userId) return;
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const currentWatchlist = docSnap.data().watchlist || [];
                const itemToRemove = currentWatchlist.find(item => item.symbol === symbol);

                if (itemToRemove) {
                    await updateDoc(docRef, {
                        watchlist: arrayRemove(itemToRemove),
                        updatedAt: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            throw error;
        }
    },

    /**
     * Subscribe to real-time watchlist updates
     * @param {string} userId 
     * @param {function} callback 
     * @returns {function} unsubscribe function
     */
    subscribeToWatchlist(userId, callback) {
        if (!userId) return () => { };

        const docRef = doc(db, 'users', userId);
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data().watchlist || []);
            } else {
                callback([]);
            }
        }, (error) => {
            console.error('Watchlist subscription error:', error);
        });
    }
};
