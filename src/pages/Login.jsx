import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, TrendingUp, Zap, BarChart3 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, googleSignIn } = useAuth();
    const navigate = useNavigate();

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Handle email change with validation
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    // Handle password change with validation
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        if (!value) {
            setPasswordError('Password is required');
        } else {
            setPasswordError('');
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        // Clear previous errors
        setError('');
        setEmailError('');
        setPasswordError('');

        // Validate before submission
        let hasError = false;
        if (!email) {
            setEmailError('Email is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            hasError = true;
        }

        if (!password) {
            setPasswordError('Password is required');
            hasError = true;
        }

        if (hasError) return;

        try {
            setLoading(true);
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            setError('Invalid email or password. Please try again.');
        }
        setLoading(false);
    }

    async function handleGoogleSignIn() {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            navigate('/dashboard');
        } catch (error) {
            setError('Failed to sign in with Google: ' + error.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex bg-background text-slate-200">
            {/* Left Side - Creative Visuals (Swapped order/color for variety) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-bl from-slate-900 via-slate-800 to-blue-950 relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10">
                    {/* MarketVue Branding */}
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="text-white w-7 h-7" />
                        </div>
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            MarketVue
                        </span>
                    </div>

                    {/* Primary H1 Heading */}
                    <h1 className="text-6xl font-extrabold leading-tight mb-6 text-white">
                        Dual-Viewport <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400">
                            Market Heatmap
                        </span>
                    </h1>

                    {/* Explanation */}
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-md">
                        Compare market performance across two timeframes simultaneously with synchronized heatmaps
                    </p>

                    <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                        View S&P 500 stocks in two independent charts—compare daily moves against weekly trends, or track sectors alongside individual stocks
                    </p>
                </div>

                {/* Welcome subheading */}
                <div className="relative z-10">
                    <p className="text-2xl font-semibold text-slate-300">
                        Welcome back to the market
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-surface">
                <div className="max-w-md w-full">
                    {/* Mobile branding */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden justify-center">
                        <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            MarketVue
                        </span>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-2xl font-bold text-white mb-3">Sign In</h2>
                        <p className="text-sm text-slate-400">
                            Monitor your watchlist, analyze sector heatmaps, and track portfolio performance in real-time
                        </p>
                    </div>

                    {/* Hero Image Section */}
                    <div className="w-full my-6">
                        <div className="relative rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-blue-500/10 group">
                            {/* Placeholder for heatmap image - replace src with actual image path */}
                            <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center relative overflow-hidden">
                                {/* Animated background effect */}
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-75"></div>
                                </div>

                                {/* Placeholder content - simulating dual heatmap */}
                                <div className="relative z-10 flex gap-4 p-6 w-full">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <div className="h-12 bg-emerald-500/30 rounded"></div>
                                        <div className="h-12 bg-red-500/30 rounded"></div>
                                        <div className="h-12 bg-emerald-500/40 rounded"></div>
                                        <div className="h-12 bg-red-500/40 rounded"></div>
                                        <div className="h-12 bg-emerald-500/20 rounded"></div>
                                        <div className="h-12 bg-red-500/20 rounded"></div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <div className="h-12 bg-blue-500/30 rounded"></div>
                                        <div className="h-12 bg-purple-500/30 rounded"></div>
                                        <div className="h-12 bg-blue-500/40 rounded"></div>
                                        <div className="h-12 bg-purple-500/40 rounded"></div>
                                        <div className="h-12 bg-blue-500/20 rounded"></div>
                                        <div className="h-12 bg-purple-500/20 rounded"></div>
                                    </div>
                                </div>

                                {/* Overlay icon */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Zap className="w-12 h-12 text-blue-400" />
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                            Real-time market heatmaps with synchronized dual views
                        </p>

                        {/* Credibility Indicators */}
                        <div className="mt-4 pt-4 border-t border-slate-700/30">
                            <p className="text-center text-xs text-slate-500 mb-3">
                                Real-time market data updated intraday • Tracking S&P 500 and major indices
                            </p>
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <span>Live data from 5,000+ stocks</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>Updated every 15 minutes</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                    <span>All S&P 500 sectors</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            {error}
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 transition-colors ${emailError ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 bg-slate-900/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${emailError
                                            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                            : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'
                                            }`}
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                    />
                                </div>
                                {emailError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className={`h-5 w-5 transition-colors ${passwordError ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 bg-slate-900/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${passwordError
                                            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                            : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'
                                            }`}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                    />
                                </div>
                                {passwordError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                                        {passwordError}
                                    </p>
                                )}
                                <div className="mt-2 text-right">
                                    <Link to="/reset-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-surface text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-700 rounded-xl shadow-sm bg-slate-800/50 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign in with Google
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
