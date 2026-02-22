import React from 'react';
import { X, CheckCircle2, AlertCircle, LogIn, Calendar, Mail, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileViewModal({ isOpen, onClose, onOpenSettings }) {
    const { currentUser } = useAuth();

    if (!isOpen) return null;

    const provider = currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email / Password';
    const joinedDate = currentUser?.metadata?.creationTime
        ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog" aria-modal="true" aria-labelledby="profile-view-title">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* Card */}
            <div className="relative w-full sm:max-w-sm bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl
                overflow-hidden animate-slideUp sm:animate-scaleIn">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <h2 id="profile-view-title" className="font-semibold text-primary text-sm">My Profile</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close"
                        className="p-2 text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Avatar + Name */}
                <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-gradient-to-b from-blue-600/5 to-transparent">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar"
                            className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 shadow-lg mb-4" />
                    ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full
                            flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 mb-4">
                            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-primary">
                        {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        {currentUser?.emailVerified ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs text-emerald-500 font-medium">Verified Account</span></>
                        ) : (
                            <><AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs text-amber-500 font-medium">Email not verified</span></>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="px-5 pb-5 space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 divide-y divide-slate-200 dark:divide-slate-700/60">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Email</p>
                                <p className="text-sm text-primary font-mono truncate">{currentUser?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Sign-in Method</p>
                                <p className="text-sm text-primary">{provider}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Member Since</p>
                                <p className="text-sm text-primary">{joinedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <LogIn className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Plan</p>
                                <p className="text-sm text-primary">Free</p>
                            </div>
                        </div>
                    </div>

                    {/* Edit button */}
                    <button onClick={() => { onClose(); onOpenSettings(); }}
                        className="w-full py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                        Edit Profile & Security Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
