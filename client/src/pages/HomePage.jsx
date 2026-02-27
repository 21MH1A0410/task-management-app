// Marketing landing page — CTA buttons change dynamically based on auth state
// so logged-in users skip the register/login flow and go directly to /tasks.
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeroInteractiveDemo from '../components/HeroInteractiveDemo';

const HomePage = () => {
    const { user } = useAuth();

    return (
        <>
            <Helmet>
                <title>Task Manager | Organize Your Day</title>
                <meta name="description" content="Task Manager helps you stay on top of your work. Create, track, and complete tasks with a clean, distraction-free interface." />
                <meta property="og:title" content="Task Manager | Organize Your Day" />
                <meta property="og:description" content="Task Manager helps you stay on top of your work. Create, track, and complete tasks with a clean, distraction-free interface." />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="https://task-management-app-2kk.pages.dev/og-image.jpg" />
                <meta property="og:url" content="https://task-management-app-2kk.pages.dev/" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Task Manager | Organize Your Day" />
                <meta name="twitter:description" content="Task Manager helps you stay on top of your work. Create, track, and complete tasks with a clean, distraction-free interface." />
                <meta name="twitter:image" content="https://task-management-app-2kk.pages.dev/og-image.jpg" />
                <meta name="theme-color" content="#0f172a" />
                <link rel="canonical" href="https://task-management-app-2kk.pages.dev/" />
            </Helmet>

            <section className="min-h-[calc(100vh-56px)] flex items-start pt-8 md:pt-0 md:items-center overflow-hidden relative bg-white">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-100/50 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                    <div className="absolute top-[10%] right-[-5%] w-[400px] h-[400px] bg-purple-100/50 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
                </div>

                {/* Hero Content Wrapper */}
                <div className="flex-grow pt-24 pb-16 md:pt-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">

                    {/* Left Text Content */}
                    <div className="text-center lg:text-left z-20 xl:pr-12">
                        <div className="animate-fade-in-up">
                            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 backdrop-blur-sm border border-blue-100 mb-8 shadow-sm tracking-wide uppercase">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2.5 animate-pulse"></span>
                                New: Advanced Task Orchestration
                            </div>

                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1] font-display">
                                Manage tasks <br className="hidden lg:block" />
                                <span className="text-gradient">
                                    effortlessly.
                                </span>
                            </h1>

                            <p className="mt-8 text-lg sm:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                The minimal, high-performance task manager designed for deep focus.
                                Organize your workflow, track progress, and achieve more with a distraction-free interface.
                            </p>

                            <div className="mt-12 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-5">
                                {user ? (
                                    <Link to="/tasks" className="group relative overflow-hidden inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-2xl hover:bg-slate-800 transition-standard hover:-translate-y-1 focus-ring">
                                        <span className="relative z-10 flex items-center">
                                            Open Dashboard
                                            <svg className="ml-2.5 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/register" className="w-[280px] max-w-[90vw] sm:max-w-none sm:w-auto inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-standard hover:-translate-y-1 focus-ring">
                                            Start for Free
                                        </Link>
                                        <Link to="/login" className="w-[280px] max-w-[90vw] sm:max-w-none sm:w-auto inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-standard hover:-translate-y-1 hover:shadow-md focus-ring">
                                            Sign In
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative flex justify-center lg:justify-end">
                        <div className="w-full max-w-[480px] lg:max-w-[560px] xl:max-w-[620px] animate-float premium-shadow">
                            <div className="hero-demo-scale">
                                <HeroInteractiveDemo />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <div className="bg-slate-50/50 py-32 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-24 animate-fade-in-up">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 font-display">
                            Everything you need to <span className="text-gradient">excel</span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Purpose-built tools designed to keep you in the flow and maximize your daily output.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            {
                                tag: "Performance",
                                title: "Lightning Fast",
                                desc: "Proprietary engine built for extreme performance. Manage tasks in milliseconds.",
                                icon: (
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                ),
                                color: "bg-amber-500 shadow-amber-500/20",
                                delay: "animation-delay-200"
                            },
                            {
                                tag: "Workflow",
                                title: "Smart Organization",
                                desc: "Intelligent filtering and categorization that adapts to your unique workflow.",
                                icon: (
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ),
                                color: "bg-blue-600 shadow-blue-600/20",
                                delay: "animation-delay-300"
                            },
                            {
                                tag: "Security",
                                title: "Privacy First",
                                desc: "End-to-end encryption for your peace of mind. Your data, your rules.",
                                icon: (
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ),
                                color: "bg-indigo-600 shadow-indigo-600/20",
                                delay: "animation-delay-500"
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className={`relative group p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2 transition-standard animate-fade-in-up ${feature.delay}`}>
                                <div className={`inline-flex items-center justify-center p-4 rounded-2xl ${feature.color} shadow-xl mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    {feature.icon}
                                </div>
                                <span className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">{feature.tag}</span>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-lg">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom CTA Section */}
            <div className="bg-slate-900 py-16 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500 rounded-full blur-[120px] animate-pulse-glow"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-8 font-display">
                        Ready to elevate your productivity?
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-12 leading-relaxed">
                        Join a global community of high-achievers who use TaskManager to conquer their goals every single day.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                        {!user && (
                            <Link to="/register" className="w-[280px] max-w-[90vw] sm:max-w-none sm:w-auto inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-standard hover:scale-105 active:scale-95 focus-ring">
                                Create your workspace
                            </Link>
                        )}
                        <Link to={user ? "/tasks" : "/login"} className="w-[280px] max-w-[90vw] sm:max-w-none sm:w-auto inline-flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md px-8 py-4 text-base font-bold text-white border border-white/20 hover:bg-white/20 transition-standard active:scale-95 focus-ring">
                            {user ? "Go to Dashboard" : "Log In"}
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomePage;
