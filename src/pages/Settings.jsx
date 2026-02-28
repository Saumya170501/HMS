import React, { useState, useCallback } from 'react';
import useThemeStore from '../hooks/useThemeStore';
import {
    Link, Zap, Download, Palette, RefreshCw, Bell,
    Moon, Sun, Monitor, Check, Shield, RotateCcw
} from 'lucide-react';



// Setting Section Component
const SettingSection = ({ title, description, children }) => (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-primary">{title}</h3>
            {description && <p className="text-xs text-secondary mt-1">{description}</p>}
        </div>
        <div className="p-4 space-y-4">
            {children}
        </div>
    </div>
);

// Toggle Switch Component
const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <div>
            <div className="text-sm text-primary">{label}</div>
            {description && <div className="text-xs text-secondary">{description}</div>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
);

// Radio Group Component
const RadioGroup = ({ label, options, value, onChange }) => (
    <div className="py-2">
        <div className="text-sm text-primary mb-3">{label}</div>
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${value === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

// Select Component
const Select = ({ label, description, options, value, onChange }) => (
    <div className="py-2">
        <div className="flex items-center justify-between mb-2">
            <div>
                <div className="text-sm text-primary">{label}</div>
                {description && <div className="text-xs text-secondary">{description}</div>}
            </div>
        </div>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

import useSettingsStore from '../hooks/useSettingsStore';
import useAlertManager from '../hooks/useAlertManager';

/* ============================================================
   Password Strength Meter
   ============================================================ */
function getPasswordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
        { label: 'Too short', color: 'bg-red-500' },
        { label: 'Weak', color: 'bg-red-400' },
        { label: 'Fair', color: 'bg-amber-400' },
        { label: 'Good', color: 'bg-yellow-400' },
        { label: 'Strong', color: 'bg-emerald-400' },
        { label: 'Very Strong', color: 'bg-emerald-500' },
    ];
    return { score, ...levels[score] };
}

const PasswordStrengthBar = ({ password }) => {
    const { score, label, color } = getPasswordStrength(password);
    if (!password) return null;
    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' :
                score <= 2 ? 'text-amber-500' :
                    score <= 3 ? 'text-yellow-500' : 'text-emerald-500'
                }`}>{label}</p>
        </div>
    );
};

/* ============================================================
   Secure Text Input
   ============================================================ */
const SecureInput = ({ label, placeholder, value, onChange, type = 'text', error }) => {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    return (
        <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    type={isPassword && !show ? 'password' : 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={isPassword ? 'current-password' : 'off'}
                    className={`w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-lg text-sm text-primary placeholder-slate-400 focus:outline-none focus:ring-2 transition-all pr-10 ${error
                        ? 'border-red-500 focus:ring-red-500/30'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'
                        }`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        </div>
    );
};





export default function Settings() {
    const { settings, updateSetting, updateNotification, updateAlertManagement, resetSettings } = useSettingsStore();
    const { resetAll: resetDismissedAlerts, getStats } = useAlertManager();
    const { theme, setTheme } = useThemeStore();
    const [saved, setSaved] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);

    // Save visual feedback wrapper
    const handleSave = () => {
        // Zustand persists automatically, just show feedback
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Reset wrapper
    const handleReset = () => {
        resetSettings();
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-6 max-w-4xl pb-28 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Settings</h1>
                    <p className="text-secondary text-sm ">Customize your dashboard experience</p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                            <Check className="w-4 h-4" /> Saved!
                        </span>
                    )}
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/30"
                    >
                        Save Settings
                    </button>
                </div>
            </div>


            {/* Correlation Preferences */}
            <SettingSection
                title={<div className="flex items-center gap-2"><Link className="w-4 h-4" /> Correlation Preferences</div>}
                description="Configure how correlation analysis works"
            >
                <Select
                    label="Default Lookback Period"
                    description="Time period for calculating correlations"
                    value={settings.correlationLookback}
                    onChange={(val) => updateSetting('correlationLookback', parseInt(val))}
                    options={[
                        { value: 30, label: '30 Days' },
                        { value: 60, label: '60 Days' },
                        { value: 90, label: '90 Days (Recommended)' },
                        { value: 180, label: '180 Days (6 Months)' },
                        { value: 365, label: '365 Days (1 Year)' }
                    ]}
                />

                <Toggle
                    label="AI Explanations"
                    description="Show natural language insights for correlations"
                    checked={settings.aiExplanations}
                    onChange={(val) => updateSetting('aiExplanations', val)}
                />

                {settings.aiExplanations && (
                    <RadioGroup
                        label="Explanation Detail Level"
                        value={settings.aiDetailLevel}
                        onChange={(val) => updateSetting('aiDetailLevel', val)}
                        options={[
                            { value: 'brief', label: 'Brief' },
                            { value: 'detailed', label: 'Detailed' }
                        ]}
                    />
                )}
            </SettingSection>

            {/* Price Alert Configuration */}
            <SettingSection
                title={<div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Price Alert Configuration</div>}
                description="Customize how price alerts behave"
            >
                <RadioGroup
                    label="Alert Sound"
                    value={settings.alertSound || 'default'}
                    onChange={(val) => updateSetting('alertSound', val)}
                    options={[
                        { value: 'default', label: 'Default Beep' },
                        { value: 'subtle', label: 'Subtle Chime' },
                        { value: 'none', label: 'Mute' }
                    ]}
                />

                <Toggle
                    label="Volume Spikes"
                    description="Alert when trading volume exceeds 200% of average"
                    checked={settings.notifications.volumeSpikes}
                    onChange={(val) => updateNotification('volumeSpikes', val)}
                />

                <Select
                    label="Alert Display Duration"
                    description="How long alert toasts stay visible"
                    value={settings.alertDuration || 5000}
                    onChange={(val) => updateSetting('alertDuration', parseInt(val))}
                    options={[
                        { value: 3000, label: '3 Seconds' },
                        { value: 5000, label: '5 Seconds' },
                        { value: 10000, label: '10 Seconds' },
                        { value: 0, label: 'Until Dismissed' }
                    ]}
                />
            </SettingSection>

            {/* Export Preferences */}
            <SettingSection
                title={<div className="flex items-center gap-2"><Download className="w-4 h-4" /> Export Preferences</div>}
                description="Configure default settings for data exports"
            >
                <RadioGroup
                    label="Default Format"
                    value={settings.exportFormat || 'csv'}
                    onChange={(val) => updateSetting('exportFormat', val)}
                    options={[
                        { value: 'csv', label: 'CSV' },
                        { value: 'json', label: 'JSON' }
                    ]}
                />

                <Toggle
                    label="Include Metadata"
                    description="Add header row with timestamp and source info"
                    checked={settings.exportMetadata !== false}
                    onChange={(val) => updateSetting('exportMetadata', val)}
                />
            </SettingSection>

            {/* Display Preferences */}
            <SettingSection
                title={<div className="flex items-center gap-2"><Palette className="w-4 h-4" /> Display Preferences</div>}
                description="Customize the visual appearance"
            >
                <RadioGroup
                    label="Theme"
                    value={theme}
                    onChange={(val) => {
                        setTheme(val);
                        updateSetting('theme', val);
                    }}
                    options={[
                        { value: 'dark', label: <div className="flex items-center gap-2"><Moon className="w-3 h-3" /> Dark</div> },
                        { value: 'light', label: <div className="flex items-center gap-2"><Sun className="w-3 h-3" /> Light</div> },
                        { value: 'auto', label: <div className="flex items-center gap-2"><Monitor className="w-3 h-3" /> System</div> }
                    ]}
                />

                <Toggle
                    label="After-Hours Grayscale"
                    description="Show stock heatmap in grayscale when market is closed"
                    checked={settings.showAfterHoursGrayscale}
                    onChange={(val) => updateSetting('showAfterHoursGrayscale', val)}
                />
            </SettingSection>

            {/* Data Refresh */}
            <SettingSection
                title={<div className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Data Refresh</div>}
                description="Configure how often data updates"
            >
                <Select
                    label="Auto-refresh Interval"
                    description="How often to fetch new market data"
                    value={settings.refreshInterval}
                    onChange={(val) => updateSetting('refreshInterval', parseInt(val))}
                    options={[
                        { value: 15, label: 'Every 15 seconds' },
                        { value: 30, label: 'Every 30 seconds (Recommended)' },
                        { value: 60, label: 'Every 1 minute' },
                        { value: 120, label: 'Every 2 minutes' }
                    ]}
                />
            </SettingSection>

            {/* Notifications */}
            <SettingSection
                title={<div className="flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</div>}
                description="Manage alert preferences"
            >
                <Toggle
                    label="Correlation Alerts"
                    description="Notify when significant correlation changes are detected"
                    checked={settings.notifications.correlationAlerts}
                    onChange={(val) => updateNotification('correlationAlerts', val)}
                />

                <Toggle
                    label="Price Alerts"
                    description="Get notified on significant price movements"
                    checked={settings.notifications.priceAlerts}
                    onChange={(val) => updateNotification('priceAlerts', val)}
                />

                <Toggle
                    label="Market News"
                    description="Receive breaking market news alerts"
                    checked={settings.notifications.marketNews}
                    onChange={(val) => updateNotification('marketNews', val)}
                />
            </SettingSection>

            {/* Alert Management */}
            <SettingSection
                title={<div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Alert Management</div>}
                description="Control alert types, sensitivity, and dismissal behavior"
            >
                {/* Per-type toggles */}
                <Toggle
                    label="Divergence Alerts"
                    description="Notify when asset pairs diverge from historical norms"
                    checked={settings.alertManagement?.divergenceAlerts ?? true}
                    onChange={(val) => updateAlertManagement('divergenceAlerts', val)}
                />
                <Toggle
                    label="Hedge Opportunities"
                    description="Identify natural hedging pairs in your portfolio"
                    checked={settings.alertManagement?.hedgeOpportunities ?? true}
                    onChange={(val) => updateAlertManagement('hedgeOpportunities', val)}
                />
                <Toggle
                    label="Volatility Alerts"
                    description="Detect unusual market volatility events"
                    checked={settings.alertManagement?.volatilityAlerts ?? true}
                    onChange={(val) => updateAlertManagement('volatilityAlerts', val)}
                />
                <Toggle
                    label="Alert Sound"
                    description="Play a notification sound for new alerts"
                    checked={settings.alertManagement?.soundEnabled ?? true}
                    onChange={(val) => updateAlertManagement('soundEnabled', val)}
                />

                {/* Sensitivity */}
                <div className="mt-4">
                    <RadioGroup
                        label="Alert Sensitivity"
                        options={[
                            { value: 'low', label: 'Low — Only major divergences (8%+)' },
                            { value: 'medium', label: 'Medium — Moderate divergences (5%+)' },
                            { value: 'high', label: 'High — All notable divergences (3%+)' },
                        ]}
                        value={settings.alertManagement?.sensitivity || 'medium'}
                        onChange={(val) => updateAlertManagement('sensitivity', val)}
                    />
                </div>

                {/* Reappearance Window */}
                <div className="mt-4">
                    <Select
                        label="Dismissed Alert Reappearance"
                        description="How long before a dismissed alert can reappear if data changes"
                        options={[
                            { value: 1, label: '1 day' },
                            { value: 3, label: '3 days' },
                            { value: 7, label: '7 days (default)' },
                            { value: -1, label: 'Never (permanent dismiss)' },
                        ]}
                        value={settings.alertManagement?.reappearanceDays ?? 7}
                        onChange={(val) => updateAlertManagement('reappearanceDays', Number(val))}
                    />
                </div>

                {/* Dismissed alerts stats + reset */}
                <div className="mt-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-primary font-medium">
                                {getStats().total} alert{getStats().total !== 1 ? 's' : ''} dismissed
                            </span>
                            {getStats().permanent > 0 && (
                                <span className="ml-2 text-xs text-slate-500">
                                    ({getStats().permanent} permanent)
                                </span>
                            )}
                        </div>
                        {getStats().total > 0 && (
                            resetConfirm ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-amber-400">Are you sure?</span>
                                    <button
                                        onClick={() => { resetDismissedAlerts(); setResetConfirm(false); }}
                                        className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded transition-colors"
                                    >
                                        Yes, reset
                                    </button>
                                    <button
                                        onClick={() => setResetConfirm(false)}
                                        className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setResetConfirm(true)}
                                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset All
                                </button>
                            )
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                        Dismissed alerts won't reappear unless data changes significantly or the reappearance window expires.
                    </p>
                </div>
            </SettingSection>





        </div>
    );
}
