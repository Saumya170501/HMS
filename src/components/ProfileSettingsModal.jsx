import React, { useState, useEffect, useRef } from 'react';
import {
    X, User, Lock, Bell, Settings, Eye, EyeOff,
    AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
    LogIn, Mail, Phone, Shield, Trash2, Download,
    Save, Loader2, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Reusable sub-components
───────────────────────────────────────────── */
const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">{label}</label>
        {children}
    </div>
);

const TextInput = ({ value, onChange, placeholder, disabled, type = 'text', error }) => (
    <div>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border rounded-lg text-sm text-primary
                placeholder-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'}`}
        />
        {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, error, autoComplete = 'current-password' }) => {
    const [show, setShow] = useState(false);
    return (
        <Field label={label}>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={`w-full px-3.5 py-2.5 pr-10 bg-slate-100 dark:bg-slate-800 border rounded-lg text-sm text-primary
                        placeholder-slate-400 focus:outline-none focus:ring-2 transition-all
                        ${error ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'}`}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        </Field>
    );
};

const StrengthBar = ({ password }) => {
    const { score, label, color } = getPasswordStrength(password);
    if (!password) return null;
    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
            </div>
            <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-amber-500' : score <= 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>{label}</p>
        </div>
    );
};

const Toggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
        <div className="pr-4">
            <p className="text-sm font-medium text-primary">{label}</p>
            {description && <p className="text-xs text-secondary mt-0.5">{description}</p>}
        </div>
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const StatusMsg = ({ status }) => {
    if (!status) return null;
    if (status === 'loading') return (
        <div className="flex items-center gap-2 text-sm text-secondary">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
        </div>
    );
    if (status === 'success') return (
        <p className="text-sm text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Saved successfully!</p>
    );
    if (status?.error) return (
        <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{status.error}</p>
    );
    return null;
};

const SectionCard = ({ children }) => (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 space-y-4">
        {children}
    </div>
);

const GoogleBadge = () => (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        <LogIn className="w-4 h-4 text-slate-400" />
        <p className="text-xs text-secondary">Managed by Google — cannot be changed here.</p>
    </div>
);

/* ─────────────────────────────────────────────
   TAB 1: Personal Information
───────────────────────────────────────────── */
function PersonalTab({ currentUser, updateUsername, updateUserEmail }) {
    const isGoogle = currentUser?.providerData?.every(p => p.providerId !== 'password');

    const [name, setName] = useState(currentUser?.displayName || '');
    const [nameStatus, setNameStatus] = useState(null);

    const [emailOpen, setEmailOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPw, setEmailPw] = useState('');
    const [emailErrors, setEmailErrors] = useState({});
    const [emailStatus, setEmailStatus] = useState(null);

    const [phone, setPhone] = useState('');

    const handleNameSave = async () => {
        if (!name.trim()) return;
        setNameStatus('loading');
        try {
            await updateUsername(name.trim());
            setNameStatus('success');
            setTimeout(() => setNameStatus(null), 3000);
        } catch (e) { setNameStatus({ error: e.message }); }
    };

    const handleEmailSave = async () => {
        const errs = {};
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) errs.newEmail = 'Enter a valid email';
        if (newEmail === currentUser?.email) errs.newEmail = 'Must differ from current email';
        if (!emailPw) errs.emailPw = 'Current password required';
        if (Object.keys(errs).length) { setEmailErrors(errs); return; }
        setEmailErrors({});
        setEmailStatus('loading');
        try {
            await updateUserEmail(newEmail, emailPw);
            setEmailStatus('success');
            setNewEmail(''); setEmailPw('');
            setTimeout(() => { setEmailStatus(null); setEmailOpen(false); }, 4000);
        } catch (e) {
            const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
                ? 'Incorrect password.'
                : e.code === 'auth/email-already-in-use' ? 'Email already in use.'
                    : e.message;
            setEmailStatus({ error: msg });
        }
    };

    return (
        <div className="space-y-5">
            {/* Display Name */}
            <SectionCard>
                <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-primary">Display Name</h4>
                </div>
                <Field label="Full Name">
                    <TextInput value={name} onChange={setName} placeholder="Your name" />
                </Field>
                <div className="flex items-center justify-between pt-1">
                    <StatusMsg status={nameStatus} />
                    <button onClick={handleNameSave} disabled={!name.trim() || nameStatus === 'loading'}
                        className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                        <Save className="w-3.5 h-3.5" /> Save
                    </button>
                </div>
            </SectionCard>

            {/* Email */}
            <SectionCard>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-500" />
                        <h4 className="text-sm font-semibold text-primary">Email Address</h4>
                    </div>
                    {!isGoogle && (
                        <button onClick={() => { setEmailOpen(o => !o); setEmailStatus(null); setEmailErrors({}); }}
                            className="flex items-center gap-1 text-xs font-medium text-purple-500 hover:text-purple-400 transition-colors">
                            {emailOpen ? 'Cancel' : 'Change'}
                            {emailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
                <p className="text-sm text-secondary font-mono">{currentUser?.email}</p>
                {currentUser?.emailVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                )}
                {isGoogle ? <GoogleBadge /> : emailOpen && (
                    <div className="space-y-3 pt-2 border-t border-border">
                        <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg text-xs text-amber-600 dark:text-amber-400">
                            A verification link will be sent to your new address. Your email changes only after clicking it.
                        </div>
                        <Field label="New Email">
                            <TextInput value={newEmail} onChange={setNewEmail} placeholder="new@example.com" error={emailErrors.newEmail} />
                        </Field>
                        <PasswordInput label="Current Password" value={emailPw} onChange={setEmailPw} placeholder="Confirm identity" error={emailErrors.emailPw} />
                        <div className="flex items-center justify-between pt-1">
                            <StatusMsg status={emailStatus} />
                            {emailStatus === 'success'
                                ? null
                                : <button onClick={handleEmailSave} disabled={emailStatus === 'loading'}
                                    className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                                    {emailStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                    Send Verification
                                </button>}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Phone */}
            <SectionCard>
                <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold text-primary">Phone Number</h4>
                    <span className="text-xs text-secondary bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <Field label="Mobile">
                    <TextInput value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" type="tel" />
                </Field>
                <p className="text-xs text-secondary">Used for SMS alerts if enabled (coming soon)</p>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────
   TAB 2: Security
───────────────────────────────────────────── */
function SecurityTab({ currentUser, updateUserPassword }) {
    const isGoogle = currentUser?.providerData?.every(p => p.providerId !== 'password');

    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null);

    const validate = () => {
        const e = {};
        const strength = getPasswordStrength(newPw);
        if (!currentPw) e.currentPw = 'Required';
        if (newPw.length < 8) e.newPw = 'At least 8 characters';
        else if (strength.score < 2) e.newPw = 'Password too weak';
        if (newPw !== confirmPw) e.confirmPw = 'Passwords do not match';
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setErrors({});
        setStatus('loading');
        try {
            await updateUserPassword(newPw, currentPw);
            setStatus('success');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
                ? 'Incorrect current password.' : err.message;
            setStatus({ error: msg });
        }
    };

    return (
        <div className="space-y-5">
            {/* Password change */}
            <SectionCard>
                <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold text-primary">Change Password</h4>
                </div>
                {isGoogle ? <GoogleBadge /> : (
                    <div className="space-y-3">
                        <PasswordInput label="Current Password" value={currentPw} onChange={setCurrentPw} placeholder="Your current password" error={errors.currentPw} />
                        <div>
                            <PasswordInput label="New Password" value={newPw} onChange={setNewPw} placeholder="Min. 8 characters" error={errors.newPw} autoComplete="new-password" />
                            <StrengthBar password={newPw} />
                        </div>
                        <PasswordInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" error={errors.confirmPw} autoComplete="new-password" />
                        <div className="flex items-center justify-between pt-1">
                            <StatusMsg status={status} />
                            <button onClick={handleSave} disabled={status === 'loading'}
                                className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
                                {status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                                Update Password
                            </button>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Privacy Visibility */}
            <SectionCard>
                <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-primary">Privacy</h4>
                </div>
                <Toggle label="Public Profile" description="Allow others to find your portfolio" checked={false} onChange={() => { }} />
                <Toggle label="Data Analytics" description="Share anonymous usage data to improve the app" checked={true} onChange={() => { }} />
                <Toggle label="Two-Factor Auth" description="Add an extra layer of security (coming soon)" checked={false} onChange={() => { }} />
            </SectionCard>
        </div>
    );
}

/* ─────────────────────────────────────────────
   TAB 3: Notifications
───────────────────────────────────────────── */
function NotificationsTab() {
    const { settings, updateNotification, updateAlertManagement } = useSettingsStore();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-5">
            <SectionCard>
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-primary">Alert Types</h4>
                </div>
                <Toggle label="Correlation Alerts" description="Significant correlation changes between assets"
                    checked={settings.notifications?.correlationAlerts ?? true}
                    onChange={v => updateNotification('correlationAlerts', v)} />
                <Toggle label="Price Alerts" description="Significant price movements"
                    checked={settings.notifications?.priceAlerts ?? true}
                    onChange={v => updateNotification('priceAlerts', v)} />
                <Toggle label="Market News" description="Breaking market news"
                    checked={settings.notifications?.marketNews ?? true}
                    onChange={v => updateNotification('marketNews', v)} />
                <Toggle label="Volume Spikes" description="Volume exceeds 200% of average"
                    checked={settings.notifications?.volumeSpikes ?? false}
                    onChange={v => updateNotification('volumeSpikes', v)} />
            </SectionCard>

            <SectionCard>
                <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-purple-500" />
                    <h4 className="text-sm font-semibold text-primary">Delivery</h4>
                </div>
                <Toggle label="Email Notifications" description="Receive alerts to your inbox"
                    checked={settings.alertManagement?.divergenceAlerts ?? true}
                    onChange={v => updateAlertManagement('divergenceAlerts', v)} />
                <Toggle label="Push Notifications" description="Browser push alerts (coming soon)"
                    checked={false} onChange={() => { }} />
                <Toggle label="Sound" description="Play a tone for new alerts"
                    checked={settings.alertManagement?.soundEnabled ?? true}
                    onChange={v => updateAlertManagement('soundEnabled', v)} />
            </SectionCard>

            <div className="flex justify-end">
                <button onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                    {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {saved ? 'Saved!' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   TAB 4: Account Management
───────────────────────────────────────────── */
function AccountTab({ currentUser, logout }) {
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm, 2=typing

    return (
        <div className="space-y-5">
            {/* Data Export */}
            <SectionCard>
                <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-primary">Export Your Data</h4>
                </div>
                <p className="text-sm text-secondary">Download a copy of your portfolio, watchlist, and alert history.</p>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-primary text-sm rounded-lg transition-colors border border-border">
                    <Download className="w-3.5 h-3.5" /> Export as JSON
                </button>
            </SectionCard>

            {/* Account Info */}
            <SectionCard>
                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-primary">Account Details</h4>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-secondary">UID</span>
                        <span className="font-mono text-xs text-primary truncate max-w-[180px]">{currentUser?.uid}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Sign-in method</span>
                        <span className="text-primary capitalize">
                            {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email / Password'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary">Plan</span>
                        <span className="text-primary">Free</span>
                    </div>
                </div>
            </SectionCard>

            {/* Danger Zone */}
            <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <h4 className="text-sm font-semibold text-red-500">Danger Zone</h4>
                </div>
                {deleteStep === 0 && (
                    <>
                        <p className="text-xs text-secondary">Permanently delete your account and all data. This cannot be undone.</p>
                        <button onClick={() => setDeleteStep(1)}
                            className="px-4 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 text-sm rounded-lg transition-colors">
                            Delete Account
                        </button>
                    </>
                )}
                {deleteStep === 1 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-red-400">Are you absolutely sure? Type <span className="font-mono font-bold">DELETE</span> to confirm.</p>
                        <input
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            placeholder="Type DELETE"
                            className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-red-400/50 rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        />
                        <div className="flex gap-2">
                            <button
                                disabled={deleteConfirm !== 'DELETE'}
                                onClick={logout}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
                                Permanently Delete
                            </button>
                            <button onClick={() => { setDeleteStep(0); setDeleteConfirm(''); }}
                                className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   TAB CONFIG
───────────────────────────────────────────── */
const TABS = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: Settings },
];

/* ─────────────────────────────────────────────
   MAIN MODAL
───────────────────────────────────────────── */
export default function ProfileSettingsModal({ isOpen, onClose }) {
    const { currentUser, updateUsername, updateUserEmail, updateUserPassword, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');
    const modalRef = useRef(null);
    const firstFocusRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            // Focus trap
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll(
                    'button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
                    e.preventDefault();
                    (e.shiftKey ? last : first)?.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        // Auto-focus close button
        setTimeout(() => firstFocusRef.current?.focus(), 50);
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div
                ref={modalRef}
                className="relative w-full sm:max-w-lg bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col
                    max-h-[92dvh] sm:max-h-[85vh] animate-slideUp sm:animate-scaleIn overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-border" />
                        ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div>
                            <h2 id="profile-modal-title" className="font-semibold text-primary text-sm">
                                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Profile'}
                            </h2>
                            <p className="text-xs text-secondary">{currentUser?.email}</p>
                        </div>
                    </div>
                    <button
                        ref={firstFocusRef}
                        onClick={onClose}
                        aria-label="Close profile settings"
                        className="p-2 text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-border flex-shrink-0 overflow-x-auto scrollbar-hide">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                    ${active
                                        ? 'border-blue-500 text-blue-500'
                                        : 'border-transparent text-secondary hover:text-primary hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {activeTab === 'personal' && (
                        <PersonalTab currentUser={currentUser} updateUsername={updateUsername} updateUserEmail={updateUserEmail} />
                    )}
                    {activeTab === 'security' && (
                        <SecurityTab currentUser={currentUser} updateUserPassword={updateUserPassword} />
                    )}
                    {activeTab === 'notifications' && (
                        <NotificationsTab />
                    )}
                    {activeTab === 'account' && (
                        <AccountTab currentUser={currentUser} logout={logout} />
                    )}
                </div>
            </div>
        </div>
    );
}
