import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, fullName) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Signup Auth Success:", result.user.uid);

            // Update user profile with display name
            if (fullName) {
                const { updateProfile } = await import('firebase/auth');
                await updateProfile(result.user, {
                    displayName: fullName
                });
                console.log("User profile updated with name:", fullName);
            }

            // Send Verification Email
            await sendEmailVerification(result.user);
            console.log("Verification Email Sent");

            // Create user document in Firestore
            try {
                await setDoc(doc(db, "users", result.user.uid), {
                    email: email,
                    name: fullName || '',
                    createdAt: new Date().toISOString(),
                    role: 'user',
                    plan: 'free'
                });
                console.log("Firestore User Doc Created");
            } catch (dbError) {
                console.error("Firestore Error (Check if Firestore is enabled in Console):", dbError);
                // We don't throw here so the user can still use the app even if DB fails
            }
            return result;
        } catch (error) {
            console.error("Signup Auth Error:", error);
            throw error;
        }
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        // Clear ALL user-specific localStorage keys to prevent data leakage
        const userDataKeys = [
            'portfolio',
            'watchlist',
            'marketvue_price_alerts',
            'marketvue_settings',
            'marketvue_theme',
            'hms_historical_assetType',
            'hms_historical_symbol',
            'hms_historical_timeframe'
        ];
        userDataKeys.forEach(key => localStorage.removeItem(key));

        return signOut(auth);
    }

    function resendVerificationEmail(user) {
        // user object is required
        return sendEmailVerification(user);
    }

    async function googleSignIn() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log("Google Auth Success:", user.uid);

            try {
                // Check if user exists, if not create doc
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        email: user.email,
                        name: user.displayName,
                        photoURL: user.photoURL,
                        createdAt: new Date().toISOString(),
                        role: 'user',
                        plan: 'free'
                    });
                    console.log("Firestore User Doc Created (Google)");
                }
            } catch (dbError) {
                console.error("Firestore Error (Check if Firestore is enabled in Console):", dbError);
            }
            return result;
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        googleSignIn,
        resendVerificationEmail
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
