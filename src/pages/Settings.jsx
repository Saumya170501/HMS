import React, { useState, useEffect } from 'react';

// Default settings
const DEFAULT_SETTINGS = {
    correlationLookback: 90,
    aiExplanations: true,
    aiDetailLevel: 'detailed',
    theme: 'dark',
    refreshInterval: 30,
    showAfterHoursGrayscale: true,
    alertSound: 'default',
    alertDuration: 5000,
    exportFormat: 'csv',
    exportMetadata: true,
    notifications: {
        correlationAlerts: true,
        priceAlerts: false,
        marketNews: true,
        volumeSpikes: false
    }
};

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
                    className={`px-4 py-2 text-sm font-mono rounded-lg transition-colors ${value === option.value
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
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-primary font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

export default function Settings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('marketvue_settings');
        if (savedSettings) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
            } catch (e) {
                console.error('Failed to parse saved settings');
            }
        }
    }, []);

    // Save settings
    const handleSave = () => {
        localStorage.setItem('marketvue_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Reset to defaults
    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('marketvue_settings');
    };

    // Update nested settings
    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateNotification = (key, value) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: value }
        }));
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Settings</h1>
                    <p className="text-secondary text-sm font-mono">Customize your dashboard experience</p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                            <span>✓</span> Saved!
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
                title="🔗 Correlation Preferences"
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
                title="⚡ Price Alert Configuration"
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
                title="📤 Export Preferences"
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
                title="🎨 Display Preferences"
                description="Customize the visual appearance"
            >
                <RadioGroup
                    label="Theme"
                    value={settings.theme}
                    onChange={(val) => updateSetting('theme', val)}
                    options={[
                        { value: 'dark', label: '🌙 Dark' },
                        { value: 'light', label: '☀️ Light' },
                        { value: 'auto', label: '🖥️ System' }
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
                title="🔄 Data Refresh"
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
                title="🔔 Notifications"
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

            {/* API Configuration */}
            <SettingSection
                title="🔑 API Configuration"
                description="Configure external data sources"
            >
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-secondary">Alpha Vantage API</span>
                        <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">Connected</span>
                    </div>
                    <p className="text-xs text-secondary">
                        Using demo key with limited rate (5 calls/min). Add your own key for unlimited access.
                    </p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-secondary">Correlation API Server</span>
                        <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">Optional</span>
                    </div>
                    <p className="text-xs text-secondary">
                        Run <code className="bg-slate-200 dark:bg-slate-900 px-1 rounded">npm run api</code> to enable the correlation API server on port 3001.
                    </p>
                </div>
            </SettingSection>

            {/* Current Settings Debug */}
            <SettingSection
                title="⚙️ Current Configuration"
                description="Debug view of saved settings"
            >
                <pre className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-xs text-secondary font-mono overflow-x-auto border border-slate-200 dark:border-slate-800">
                    {JSON.stringify(settings, null, 2)}
                </pre>
            </SettingSection>
        </div>
    );
}
