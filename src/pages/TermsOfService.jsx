import React from 'react';

export default function TermsOfService() {
    return (
        <div className="p-6 max-w-4xl mx-auto text-slate-300">
            <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
            <p className="mb-4">Last updated: May 22, 2025</p>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p>By accessing or using MarketVue, you agree to be bound by these Terms of Service.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                <p>MarketVue provides market data visualization tools. We do not provide financial advice. All data is provided for informational purposes only.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibility</h2>
                <p>You are responsible for your own investment decisions. We are not liable for any losses incurred based on information provided by our service.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">4. Limitation of Liability</h2>
                <p>To the maximum extent permitted by law, MarketVue shall not be liable for any indirect, incidental, special, or consequential damages.</p>
            </section>
        </div>
    );
}
