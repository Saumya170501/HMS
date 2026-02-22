import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="p-6 max-w-4xl mx-auto text-slate-300">
            <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
            <p className="mb-4">Last updated: May 22, 2025</p>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                <p>We collect information you provide directly to us when you create an account, such as your email address. We also collect usage data through cookies and similar technologies to improve our service.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                <p>We use your information to provide, maintain, and improve our services, including providing real-time market data and personalized watchlists.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing</h2>
                <p>We do not share your personal information with third parties except as necessary to provide our services or as required by law.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">4. Your Rights</h2>
                <p>You have the right to access, update, or delete your personal information at any time through your account settings.</p>
            </section>
        </div>
    );
}
