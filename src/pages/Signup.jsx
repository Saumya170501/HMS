import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader2, TrendingUp, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup, googleSignIn } = useAuth();
    const navigate = useNavigate();

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Password strength calculation
    const calculatePasswordStrength = (pwd) => {
        if (pwd.length === 0) return '';
        if (pwd.length < 8) return 'weak';

        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;

        if (pwd.length >= 8 && strength >= 3) return 'strong';
        if (pwd.length >= 8 && strength >= 2) return 'medium';
        return 'weak';
    };

    // Handle field changes with validation
    const handleFullNameChange = (e) => {
        const value = e.target.value;
        setFullName(value);
        if (!value.trim()) {
            setFullNameError('Full name is required');
        } else {
            setFullNameError('');
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        const strength = calculatePasswordStrength(value);
        setPasswordStrength(strength);

        if (!value) {
            setPasswordError('Password is required');
        } else if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters');
        } else if (strength === 'weak') {
            setPasswordError('Password is too weak');
        } else {
            setPasswordError('');
        }

        // Revalidate confirm password if it exists
        if (confirmPassword && value !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
        } else if (confirmPassword) {
            setConfirmPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (value && value !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        // Clear previous errors
        setError('');
        setFullNameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        // Validate all fields
        let hasError = false;

        if (!fullName.trim()) {
            setFullNameError('Full name is required');
            hasError = true;
        }

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
        } else if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            hasError = true;
        } else if (calculatePasswordStrength(password) === 'weak') {
            setPasswordError('Password is too weak. Add uppercase letters and numbers');
            hasError = true;
        }

        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            hasError = true;
        }

        if (!agreedToTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy');
            hasError = true;
        }

        if (hasError) return;

        try {
            setLoading(true);
            await signup(email, password);
            navigate('/dashboard');
        } catch (error) {
            console.error("Signup Component Error:", error.code, error.message);
            if (error.code === 'auth/email-already-in-use') {
                setError('Account already exists. Please log in.');
            } else {
                setError('Failed to create an account: ' + error.message);
            }
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
            {/* Left Column - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="max-w-md w-full">
                    {/* Logo/Branding */}
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <TrendingUp className="text-white w-7 h-7" />
                        </div>
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            MarketVue
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                            Start Analyzing Markets with{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Dual-Viewport Heatmaps
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base">
                            Get instant access to real-time market data visualized across two synchronized charts
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Join 10,000+ traders</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="font-medium">Free • No credit card</span>
                        </div>
                    </div>

                    {/* Signup Form */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-6">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className={`h-5 w-5 transition-colors ${fullNameError ? 'text-red-500' : fullName ? 'text-emerald-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                                    </div>
                                    <input
                                        id="fullName"
                                        type="text"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 bg-slate-900/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${fullNameError
                                                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                                : fullName && !fullNameError
                                                    ? 'border-emerald-500 focus:ring-emerald-500/50 focus:border-emerald-500'
                                                    : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'
                                            }`}
                                        placeholder="John Smith"
                                        value={fullName}
                                        onChange={handleFullNameChange}
                                    />
                                </div>
                                {fullNameError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                                        {fullNameError}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 transition-colors ${emailError ? 'text-red-500' : email && !emailError ? 'text-emerald-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 bg-slate-900/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${emailError
                                                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                                : email && !emailError
                                                    ? 'border-emerald-500 focus:ring-emerald-500/50 focus:border-emerald-500'
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

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className={`h-5 w-5 transition-colors ${passwordError ? 'text-red-500' : passwordStrength === 'strong' ? 'text-emerald-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 bg-slate-900/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${passwordError
                                                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                                : passwordStrength === 'strong'
                                                    ? 'border-emerald-500 focus:ring-emerald-500/50 focus:border-emerald-500'
                                                    : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'
                                            }`}
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                    />
                                </div>

                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-300 ${passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                                                        passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                                                            passwordStrength === 'strong' ? 'w-full bg-emerald-500' : 'w-0'
                                                    }`}></div>
                                            </div>
                                            <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-400' :
                                                    passwordStrength === 'medium' ? 'text-yellow-400' :
                                                        passwordStrength === 'strong' ? 'text-emerald-400' : 'text-slate-500'
                                                }`}>
                                                {passwordStrength === 'weak' ? 'Weak' :
                                                    passwordStrength === 'medium' ? 'Medium' :
                                                        passwordStrength === 'strong' ? 'Strong' : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            At least 8 characters with one uppercase, one number
                                        </p>
                                    </div>
                                )}

                                {passwordError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className={`h-5 w-5 transition-colors ${confirmPasswordError ? 'text-red-500' : confirmPassword && !confirmPasswordError ? 'text-emerald-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 bg-slate-900/50 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${confirmPasswordError
                                                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                                                : confirmPassword && !confirmPasswordError
                                                    ? 'border-emerald-500 focus:ring-emerald-500/50 focus:border-emerald-500'
                                                    : 'border-slate-700 focus:ring-blue-500/50 focus:border-blue-500'
                                            }`}
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                    />
                                </div>
                                {confirmPasswordError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                                        {confirmPasswordError}
                                    </p>
                                )}
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-3 pt-2">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 bg-slate-900/50 border-slate-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500/50"
                                />
                                <label htmlFor="terms" className="text-xs sm:text-sm text-slate-400">
                                    I agree to the{' '}
                                    <Link to="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                                        Terms of Service
                                    </Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            {/* Primary CTA Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 sm:h-14 flex items-center justify-center px-6 text-base font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started'}
                            </button>

                            {/* Secondary CTA - Google Sign In */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full h-11 flex items-center justify-center gap-3 px-6 text-sm font-medium rounded-xl text-slate-200 bg-transparent border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign up with Google
                            </button>
                        </form>

                        {/* Already have account link */}
                        <p className="text-center text-xs sm:text-sm text-slate-400 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                Sign in here
                            </Link>
                        </p>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-700/50">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Your data is encrypted and secure</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Content */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900 relative overflow-hidden p-12 flex-col justify-between">
                {/* Background Effects */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-full blur-[120px]"></div>
                </div>

                {/* Product Screenshot */}
                <div className="relative z-10 mb-10">
                    <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-purple-500/20 group">
                        <div className="aspect-video bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 flex items-center justify-center relative overflow-hidden">
                            {/* Animated background */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-75"></div>
                            </div>

                            {/* Dual heatmap visualization */}
                            <div className="relative z-10 flex gap-4 p-6 w-full">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                    <div className="h-12 bg-emerald-500/40 rounded shadow-lg"></div>
                                    <div className="h-12 bg-red-500/40 rounded shadow-lg"></div>
                                    <div className="h-12 bg-emerald-500/50 rounded shadow-lg"></div>
                                    <div className="h-12 bg-red-500/30 rounded shadow-lg"></div>
                                    <div className="h-12 bg-emerald-500/30 rounded shadow-lg"></div>
                                    <div className="h-12 bg-red-500/50 rounded shadow-lg"></div>
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                    <div className="h-12 bg-blue-500/40 rounded shadow-lg"></div>
                                    <div className="h-12 bg-purple-500/40 rounded shadow-lg"></div>
                                    <div className="h-12 bg-blue-500/50 rounded shadow-lg"></div>
                                    <div className="h-12 bg-purple-500/30 rounded shadow-lg"></div>
                                    <div className="h-12 bg-blue-500/30 rounded shadow-lg"></div>
                                    <div className="h-12 bg-purple-500/50 rounded shadow-lg"></div>
                                </div>
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Zap className="w-12 h-12 text-purple-400" />
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-sm text-slate-400 mt-4 font-medium">
                        Real-time market heatmaps with synchronized dual views
                    </p>
                </div>

                {/* Key Benefits */}
                <div className="relative z-10 space-y-6 mb-10">
                    <h3 className="text-2xl font-bold text-white mb-6">Why MarketVue?</h3>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">Compare Timeframes</h4>
                            <p className="text-sm text-slate-400">Analyze market performance across multiple timeframes simultaneously</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">Track 5,000+ Stocks</h4>
                            <p className="text-sm text-slate-400">Live sector rotation analysis across all markets</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Zap className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-1">Real-Time Updates</h4>
                            <p className="text-sm text-slate-400">Monitor portfolio performance with live data feeds</p>
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="relative z-10 space-y-4">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <p className="text-sm text-slate-300 italic mb-2">
                            "Best visualization tool for tracking sector rotation. The dual-viewport feature is a game changer."
                        </p>
                        <p className="text-xs text-slate-500">— Sarah M., Day Trader</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <p className="text-sm text-slate-300 italic mb-2">
                            "Real-time data across all S&P 500 sectors. Finally, a dashboard that keeps up with the market."
                        </p>
                        <p className="text-xs text-slate-500">— Michael R., Portfolio Manager</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
