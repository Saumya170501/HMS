import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth } from '../config/firebase';

export default function VerifyEmail() {
    const { currentUser, resendVerificationEmail, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // If user is already verified, redirect to dashboard
        if (currentUser?.emailVerified) {
            navigate('/dashboard');
        }

        // Poll for verification status every 3 seconds
        const interval = setInterval(async () => {
            if (currentUser) {
                await currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    navigate('/dashboard');
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentUser, navigate]);

    async function handleResendEmail() {
        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resendVerificationEmail(currentUser);
            setMessage('Verification email sent! Please check your inbox.');
        } catch (err) {
            setError('Failed to send verification email. Wait a moment and try again.');
        }
        setLoading(false);
    }

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-surface border border-border p-8 rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-blue-500" />
                </div>

                <h2 className="text-2xl font-bold text-primary mb-2">Verify your email</h2>
                <p className="text-secondary mb-6">
                    We've sent a verification email to <br />
                    <span className="font-medium text-primary">{currentUser?.email}</span>
                </p>

                {message && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center gap-2 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleResendEmail}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Resend Verification Email
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-4 bg-surface border border-border hover:bg-slate-800 text-primary rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        I've Verified, Reload Page
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full py-2 text-sm text-slate-500 hover:text-slate-400 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-3 h-3" /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
