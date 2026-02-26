import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPage = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const mailLink = isMobile ? "mailto:ramaraju0407@gmail.com" : "https://mail.google.com/mail/?view=cm&fs=1&to=ramaraju0407@gmail.com";

    return (
        <>
            <Helmet>
                <title>Privacy Policy | Task Manager</title>
                <meta name="description" content="Privacy Policy explaining how we handle your data." />
            </Helmet>

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-50/50 to-white pt-20 pb-16 px-4 border-b border-slate-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-lg text-slate-500 mb-2">We believe in transparent data handling and absolute security.</p>
                    <p className="text-sm font-semibold text-blue-600">Effective Date: February 15th, 2026</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-12">

                {/* Sticky Sidebar Navigation */}
                <div className="hidden md:block w-64 shrink-0">
                    <div className="sticky top-24 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Contents</h4>
                        <nav className="flex flex-col gap-3">
                            <a href="#information" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">1. Information We Collect</a>
                            <a href="#cookies" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">2. Cookies & Tracking</a>
                            <a href="#security" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">3. Data Security</a>
                            <a href="#rights" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">4. Your Rights</a>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 pb-24">
                    <div className="prose prose-slate prose-blue max-w-none text-slate-600 leading-relaxed">

                        <p className="text-lg text-slate-700 font-medium mb-10 leading-relaxed">
                            Your privacy is important to us. It is Task Manager's policy to respect your privacy regarding any information we may collect from you across our website and applications.
                        </p>

                        <section id="information" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                                Information We Collect
                            </h2>
                            <p className="mb-4">
                                We ask for personal information strictly when it is necessary to provide value to you. We collect it by fair and lawful means, with your knowledge and direct consent.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                                <li><strong>Account Details:</strong> We collect your Name and Email Address exclusively for account creation and secure login purposes.</li>
                                <li><strong>Usage Data:</strong> We may collect anonymous diagnostic data to improve our platform's reliability.</li>
                            </ul>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="cookies" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                                Cookies and Tracking
                            </h2>
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-6 shadow-sm">
                                <h4 className="flex items-center gap-2 font-bold text-blue-900 mb-3 text-lg">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    The "Strictly Necessary" Exemption
                                </h4>
                                <p className="text-blue-800 leading-relaxed">
                                    We use heavily encrypted, <strong>HttpOnly secure cookies</strong> exclusively to authenticate users, maintain secure login sessions, and protect our application against severe security threats (like XSS hijacking).
                                </p>
                                <p className="text-blue-800 leading-relaxed mt-2 font-medium">
                                    Because these cookies are technically mandated for the application to function safely, they are legally considered "Strictly Necessary" under global regulations (GDPR, CCPA) and therefore cannot be disabled. We do not drop tracking, advertising, or third-party cookies.
                                </p>
                            </div>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="security" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">3</span>
                                Data Storage and Security
                            </h2>
                            <p className="mb-4">
                                We utilize industry-standard encryption protocols at rest and in transit. We don't share any personally identifying information publicly or with third-parties, except when strictly forced by legal mandates.
                            </p>
                            <p>
                                We protect the data we store within commercially acceptable means to prevent data loss, theft, unauthorized access, or disclosure.
                            </p>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="rights" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">4</span>
                                Your Rights
                            </h2>
                            <p className="mb-4">
                                You hold the right to refuse our request for your personal information. You maintain absolute control over your data.
                            </p>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-6">
                                <h4 className="font-bold text-slate-900 mb-2">Account Deletion</h4>
                                <p className="text-sm text-slate-600">
                                    You may permanently delete your account and instantly purge all associated task data at any time from your Profile Settings. This action is irreversible.
                                </p>
                            </div>
                        </section>

                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-slate-500 mb-4 text-sm font-medium uppercase tracking-wider">Need Clarification?</p>
                        <a href={mailLink} target={isMobile ? "_self" : "_blank"} rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
                            Email our Privacy Team
                        </a>
                    </div>

                </div>
            </div>
        </>
    );
};

export default PrivacyPage;
