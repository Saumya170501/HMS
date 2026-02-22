import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto text-slate-300 antialiased">
            <div className="mb-10 border-b border-dark-border pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4 tracking-tight">Privacy Policy</h1>
                <p className="text-sm font-mono text-slate-500">Effective Date: October 24, 2025</p>
                <p className="text-sm font-mono text-slate-500 mt-1">Last Updated: October 24, 2025</p>
            </div>

            <div className="space-y-8 leading-relaxed">
                <section>
                    <p className="mb-3">
                        MarketVue ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, disclosed, and safeguarded when you visit our website or use our application (the "Service").
                        Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">1. Information We Collect</h2>
                    <p className="mb-3">
                        We may collect information about you in a variety of ways. The information we may collect via the Service includes:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mb-3 text-slate-400">
                        <li><strong className="text-slate-300">Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Service.</li>
                        <li><strong className="text-slate-300">Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Service.</li>
                        <li><strong className="text-slate-300">Financial Data:</strong> We do not store financial data directly. Any financial transactions are handled securely by third-party payment processors (e.g., Stripe), and you are subject to their respective privacy policies.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">2. How We Use Your Information</h2>
                    <p className="mb-3">
                        Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mb-3 text-slate-400">
                        <li>Create and manage your account.</li>
                        <li>Deliver targeted market alerts, portfolio updates, and relevant information.</li>
                        <li>Improve the efficiency and operation of the Service.</li>
                        <li>Monitor and analyze usage and trends to improve your experience.</li>
                        <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                        <li>Comply with legal and regulatory obligations.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">3. Disclosure of Your Information</h2>
                    <p className="mb-3">
                        We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mb-3 text-slate-400">
                        <li><strong className="text-slate-300">By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                        <li><strong className="text-slate-300">Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, and customer service.</li>
                        <li><strong className="text-slate-300">Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                    </ul>
                    <p className="mb-3 font-semibold mt-4">We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">4. Tracking Technologies</h2>
                    <p className="mb-3">
                        We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Service to help customize the Site and improve your experience. For more information on how we use cookies, please refer to our Cookie Policy posted on the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">5. Data Security</h2>
                    <p className="mb-3">
                        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">6. User Rights & Data Retention</h2>
                    <p className="mb-3">
                        You have the right to request access to the personal data we hold about you, to request that your personal data be corrected or deleted, and to object to or request the restriction of processing of your personal data.
                        We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy.
                    </p>
                    <p className="mb-3">
                        If you wish to terminate your account or request the deletion of your data, you can do so at any time by navigating to your Account Settings within the application.
                    </p>
                </section>


                <section className="pt-6 border-t border-dark-border mt-12 pb-12">
                    <h2 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">7. Contact Us</h2>
                    <p className="mb-3">
                        If you have questions or comments about this Privacy Policy, please contact our Data Protection Officer at:
                        <br />
                        <a href="mailto:privacy@marketvue.app" className="text-blue-500 hover:text-blue-400 transition-colors mt-2 inline-block">privacy@marketvue.app</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
