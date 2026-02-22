import React from 'react';

export default function TermsOfService() {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto text-slate-300 antialiased">
            <div className="mb-10 border-b border-dark-border pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4 tracking-tight">Terms of Service</h1>
                <p className="text-sm font-mono text-slate-500">Effective Date: October 24, 2025</p>
                <p className="text-sm font-mono text-slate-500 mt-1">Last Updated: October 24, 2025</p>
            </div>

            <div className="space-y-8 leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">1. Acceptance of Terms</h2>
                    <p className="mb-3">
                        By accessing, browsing, or using the MarketVue platform, website, and associated services (collectively, the "Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you are expressly prohibited from using the Service and must discontinue use immediately.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">2. Description of Service</h2>
                    <p className="mb-3">
                        MarketVue provides advanced market data visualization, analytics, and portfolio tracking tools.
                        <strong> MarketVue is not a registered investment advisor, broker, or dealer.</strong> The Service is provided strictly for educational and informational purposes. No content published on the Service constitutes a recommendation that any particular security, portfolio of securities, transaction, or investment strategy is suitable for any specific person.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">3. User Accounts and Security</h2>
                    <p className="mb-3">
                        To access certain features of the Service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate.
                    </p>
                    <p className="mb-3">
                        You are entirely responsible for maintaining the confidentiality of your account credentials and for any and all activities that occur under your account. You agree to notify MarketVue immediately of any unauthorized use of your account or any other breach of security.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">4. Intellectual Property Rights</h2>
                    <p className="mb-3">
                        The Service and its original content, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by MarketVue, its licensors, or other providers of such material and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                    </p>
                    <p className="mb-3">
                        These Terms permit you to use the Service for your personal, non-commercial use only. You must not reproduce, distribute, modify, create derivative works of, publicly display, or publicly perform any of the material on our Service without prior written consent from MarketVue.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">5. Disclaimer of Warranties</h2>
                    <p className="mb-3 uppercase text-xs font-semibold tracking-wider text-slate-400">Please read carefully</p>
                    <p className="mb-3">
                        Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. MarketVue expressly disclaims all warranties of any kind, whether express, implied, or statutory, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.
                    </p>
                    <p className="mb-3">
                        MarketVue makes no warranty that (i) the Service will meet your requirements, (ii) the Service will be uninterrupted, timely, secure, or error-free, or (iii) the results that may be obtained from the use of the Service (including market data and charts) will be accurate or reliable. Data is commonly delayed by 15 minutes or more unless explicitly stated otherwise.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">6. Limitation of Liability</h2>
                    <p className="mb-3 uppercase text-xs font-semibold tracking-wider text-slate-400">Please read carefully</p>
                    <p className="mb-3">
                        To the fullest extent permitted by applicable law, in no event shall MarketVue, its affiliates, directors, employees, or agents be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use of, or inability to use, the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">7. Indemnification</h2>
                    <p className="mb-3">
                        You agree to defend, indemnify, and hold harmless MarketVue, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">8. Modifications to Terms</h2>
                    <p className="mb-3">
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">9. Governing Law</h2>
                    <p className="mb-3">
                        These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which MarketVue is established, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                    </p>
                </section>

                <section className="pt-6 border-t border-dark-border mt-12 pb-12">
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">10. Contact Us</h2>
                    <p className="mb-3">
                        If you have any questions about these Terms, please contact our legal team at:
                        <br />
                        <a href="mailto:legal@marketvue.app" className="text-blue-500 hover:text-blue-400 transition-colors mt-2 inline-block">legal@marketvue.app</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
