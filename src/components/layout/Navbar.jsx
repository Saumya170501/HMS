import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar';
import ProfileSettingsModal from '../ProfileSettingsModal';
import ProfileViewModal from '../ProfileViewModal';

import { Sun, Moon, Bell, LogOut, User, ChevronDown, X, Settings, Shield } from 'lucide-react';
import useThemeStore from '../../hooks/useThemeStore';
import useSettingsStore from '../../hooks/useSettingsStore';
import { getDashboardVolatilityAlerts } from '../../services/volatilityService';
import { useAuth } from '../../context/AuthContext';
import useAlertManager from '../../hooks/useAlertManager';
import { getAlertKey } from '../../services/alertManagementService';
import DismissalFeedback from '../DismissalFeedback';

export default function Navbar() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const { isDarkMode, toggleTheme } = useThemeStore();
    const [alerts, setAlerts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showProfileView, setShowProfileView] = useState(false);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const [feedbackAlert, setFeedbackAlert] = useState(null);
    const { currentUser, logout } = useAuth();
    const { shouldShow, dismissAlert, getStats } = useAlertManager();

    // Filter alerts through the alert manager
    const visibleAlerts = useMemo(() => {
        return alerts.filter(alert => shouldShow(alert, alert));
    }, [alerts, shouldShow]);

    const dismissedCount = getStats().total;
    // Update time every second
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch alerts (with user's sensitivity setting)
    const sensitivity = useSettingsStore(state => state.settings.alertManagement?.sensitivity || 'medium');
    React.useEffect(() => {
        const fetchAlerts = async () => {
            const data = await getDashboardVolatilityAlerts(sensitivity);
            setAlerts(data);
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 300000); // 5 minutes
        return () => clearInterval(interval);
    }, [sensitivity]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    // Logout handler
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <>
            <header className="py-2 bg-surface border-b border-border flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300">
                {/* Search Bar */}
                <div className="flex-1 max-w-[200px] sm:max-w-sm md:max-w-xl">
                    <SearchBar onSelect={(asset) => navigate(`/asset/${asset.market}/${asset.symbol}`)} />
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="touch-target p-2 text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Time Display — hidden on mobile, condensed on tablet */}
                    <div className="hidden sm:block text-right">
                        <div className="text-sm md:text-lg font-mono text-primary">{formatTime(currentTime)}</div>
                        <div className="hidden md:block text-xs font-mono text-secondary">{formatDate(currentTime)} EST</div>
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="touch-target p-2 text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            {visibleAlerts.length > 0 && (
                                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white">
                                    {visibleAlerts.length}
                                </span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {showDropdown && (
                            <>
                                {/* Click-outside overlay */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                                    <div className="p-3 border-b border-slate-700/40 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-slate-400" />
                                            <h3 className="font-semibold text-sm text-slate-200">Major Alerts</h3>
                                        </div>
                                        {visibleAlerts.length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAlerts([]);
                                                }}
                                                className="text-[11px] text-slate-500 hover:text-slate-300 font-medium transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-56 overflow-y-auto">
                                        {visibleAlerts.length > 0 ? (
                                            visibleAlerts.map((alert, idx) => (
                                                <div key={idx} className="px-3 py-2.5 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors group relative">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${alert.alert_type === 'HEDGE_OPPORTUNITY' ? 'bg-emerald-400' :
                                                                alert.alert_type === 'DIVERGENCE_WARNING' ? 'bg-amber-400' : 'bg-cyan-400'
                                                                }`} />
                                                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${alert.alert_type === 'HEDGE_OPPORTUNITY' ? 'text-emerald-400' :
                                                                alert.alert_type === 'DIVERGENCE_WARNING' ? 'text-amber-400' : 'text-cyan-400'
                                                                }`}>
                                                                {alert.alert_type.replaceAll('_', ' ')}
                                                            </span>
                                                        </div>
                                                        {/* Per-alert dismiss button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFeedbackAlert(alert);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-slate-300 transition-all"
                                                            title="Dismiss this alert"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center">
                                                <Bell className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500">No major alerts right now</p>
                                                <p className="text-[10px] text-slate-600 mt-1">Only significant divergences appear here</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Footer */}
                                    <div className="border-t border-slate-700/40 p-2 flex items-center justify-between">
                                        {dismissedCount > 0 && (
                                            <button
                                                onClick={() => { setShowDropdown(false); navigate('/settings'); }}
                                                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                                            >
                                                {dismissedCount} dismissed
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/volatility'); }}
                                            className="ml-auto text-[11px] text-blue-400 hover:text-blue-300 font-medium py-1 transition-colors"
                                        >
                                            View all alerts →
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Dismissal Feedback Modal */}
                        {feedbackAlert && (
                            <DismissalFeedback
                                alert={feedbackAlert}
                                onSubmit={(feedback) => {
                                    dismissAlert(feedbackAlert, feedback);
                                    setFeedbackAlert(null);
                                }}
                                onCancel={() => setFeedbackAlert(null)}
                            />
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors"
                        >
                            {currentUser?.photoURL ? (
                                <img
                                    src={currentUser.photoURL}
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full border border-slate-600"
                                />
                            ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <span className="text-sm font-bold">
                                        {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <div className="text-sm font-medium text-primary">
                                    {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                                </div>
                                <div className="text-[10px] text-secondary flex items-center gap-1">
                                    {currentUser?.emailVerified ? 'Verified' : 'Free Plan'}
                                    <ChevronDown className="w-3 h-3" />
                                </div>
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        {showProfileMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">

                                    {/* User header */}
                                    <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                                        <p className="text-sm font-bold truncate text-primary">{currentUser?.email}</p>
                                    </div>

                                    <div className="p-1">
                                        {/* Profile — view-only profile card */}
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setShowProfileView(true); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            <div className="text-left">
                                                <p className="font-medium">Profile</p>
                                                <p className="text-[10px] text-slate-400">View your info</p>
                                            </div>
                                        </button>

                                        {/* Profile Settings — account/security settings */}
                                        <button
                                            onClick={() => { setShowProfileMenu(false); setShowProfileSettings(true); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Shield className="w-4 h-4" />
                                            <div className="text-left">
                                                <p className="font-medium">Profile Settings</p>
                                                <p className="text-[10px] text-slate-400">Name, email, password</p>
                                            </div>
                                        </button>

                                        {/* App Settings — global app preferences */}
                                        <button
                                            onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <div className="text-left">
                                                <p className="font-medium">App Settings</p>
                                                <p className="text-[10px] text-slate-400">Theme, alerts, data prefs</p>
                                            </div>
                                        </button>

                                        <div className="my-1 border-t border-border" />

                                        {/* Sign Out */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Profile View Modal */}
            <ProfileViewModal
                isOpen={showProfileView}
                onClose={() => setShowProfileView(false)}
                onOpenSettings={() => setShowProfileSettings(true)}
            />

            {/* Profile Settings Modal */}
            <ProfileSettingsModal
                isOpen={showProfileSettings}
                onClose={() => setShowProfileSettings(false)}
            />
        </>
    );
}
