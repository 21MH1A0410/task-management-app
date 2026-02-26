import React from 'react';
import { Helmet } from 'react-helmet-async';

const TermsPage = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const mailLink = isMobile ? "mailto:ramaraju0407@gmail.com" : "https://mail.google.com/mail/?view=cm&fs=1&to=ramaraju0407@gmail.com";

    return (
        <>
            <Helmet>
                <title>Terms of Service | Task Manager</title>
                <meta name="description" content="Terms of Service for using the Task Manager application." />
            </Helmet>

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-50/50 to-white pt-20 pb-16 px-4 border-b border-slate-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-lg text-slate-500 mb-2">Please read these terms carefully before using our application.</p>
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
                            <a href="#acceptance" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">1. Acceptance of Terms</a>
                            <a href="#description" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">2. Description of Service</a>
                            <a href="#security" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">3. Accounts & Security</a>
                            <a href="#acceptable-use" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">4. Acceptable Use</a>
                            <a href="#liability" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">5. Limitation of Liability</a>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 pb-24">
                    <div className="prose prose-slate prose-blue max-w-none text-slate-600 leading-relaxed">

                        <p className="text-lg text-slate-700 font-medium mb-10 leading-relaxed">
                            These Terms of Service ("Terms") govern your access to and use of the Task Manager platform, including any associated software, websites, APIs, and services (collectively, the "Services").
                        </p>

                        <section id="acceptance" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                                Acceptance of Terms
                            </h2>
                            <p className="mb-4">
                                By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.
                            </p>
                            <p>
                                If these Terms of Service are considered an offer, acceptance is expressly limited to these Terms. Any new features or tools which are added to the current application shall also be subject to the Terms of Service.
                            </p>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="description" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                                Description of Service
                            </h2>
                            <p className="mb-4">
                                Task Manager provides a secure, digital platform for organizing, tracking, and managing personal and professional tasks. The Services may be modified, updated, interrupted, suspended or discontinued at any time without notice or liability.
                            </p>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="security" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">3</span>
                                User Accounts and Security
                            </h2>
                            <p className="mb-4">
                                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process.
                            </p>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 my-6">
                                <h4 className="font-bold text-slate-900 mb-2">Security Obligations</h4>
                                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                                    <li>You are entirely responsible for maintaining the confidentiality of your password and account.</li>
                                    <li>You agree to notify us immediately of any unauthorized use of your account or any other breach of security.</li>
                                    <li>We use strictly necessary HttpOnly cookies to securely manage your authenticated sessions. By using the service, you acknowledge this technical necessity.</li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="acceptable-use" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">4</span>
                                Acceptable Use
                            </h2>
                            <p className="mb-4">
                                You agree not to misuse our Services. For example, you must not, and must not attempt to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mb-6 marker:text-red-500">
                                <li>Probe, scan, or test the vulnerability of any system or network.</li>
                                <li>Breach or otherwise circumvent any security or authentication measures.</li>
                                <li>Interfere with or disrupt any user, host, or network (e.g., sending a virus, overloading, flooding, spamming).</li>
                                <li>Sell, resell, or lease the Services unless specifically authorized to do so.</li>
                            </ul>
                        </section>

                        <hr className="border-slate-200 my-10" />

                        <section id="liability" className="scroll-mt-24 mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">5</span>
                                Limitation of Liability
                            </h2>
                            <p className="mb-4">
                                In no event shall Task Manager, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                            </p>
                        </section>

                    </div>

                    <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
                        <h4 className="text-lg font-bold text-blue-900 mb-2">Questions about these Terms?</h4>
                        <p className="text-blue-700 mb-4">We're here to help clarify any aspect of our service agreement.</p>
                        <a href={mailLink} target={isMobile ? "_self" : "_blank"} rel="noopener noreferrer" className="inline-block bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all">
                            Contact Support
                        </a>
                    </div>

                </div>
            </div>
        </>
    );
};

export default TermsPage;
