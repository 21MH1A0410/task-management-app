// Marketing landing page — CTA buttons change dynamically based on auth state
// so logged-in users skip the register/login flow and go directly to /tasks.
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
                <meta property="og:image" content="/og-image.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Task Manager | Organize Your Day" />
                <meta name="twitter:description" content="Task Manager helps you stay on top of your work. Create, track, and complete tasks with a clean, distraction-free interface." />
                <meta name="twitter:image" content="/og-image.png" />
            </Helmet>

            <div className="flex-grow bg-blue-50 font-sans text-gray-900 flex flex-col relative overflow-hidden">

                {/* Animated blobs add visual depth to the hero without competing with content */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                {/* Hero Section */}
                <div className="flex-grow flex items-center justify-center pt-16 pb-20 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-600/20 bg-white/50 mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                            New: Sorting & Filtering Live
                        </div>

                        <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 font-display">
                            Manage tasks with <br className="hidden sm:block" />
                            <span className="text-blue-600">
                                clarity and speed.
                            </span>
                        </h1>

                        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            The minimal, powerful task manager designed for focus.
                            Organize your life, track your progress, and get things done without the noise.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                            {user ? (
                                <Link to="/tasks" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-blue-700 cursor-pointer hover:opacity-90 transition-standard hover:scale-[1.02] active:scale-95 focus-ring">
                                    Go to Dashboard
                                    <svg className="ml-2 -mr-1 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="w-full max-w-[220px] sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-blue-700 cursor-pointer hover:opacity-90 transition-standard hover:scale-[1.02] active:scale-95 focus-ring">
                                        Start for free
                                    </Link>
                                    <Link to="/login" className="w-full max-w-[220px] sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-gray-900 border border-gray-300 hover:bg-gray-50 cursor-pointer hover:opacity-90 active:scale-95 transition-standard focus-ring">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="bg-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need</h2>
                            <p className="mt-4 text-lg text-gray-600">Powerful features to keep you in the flow.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Lightning Fast",
                                    desc: "Create, edit, and manage tasks in milliseconds. Built for speed.",
                                    icon: (
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    ),
                                    color: "bg-amber-500"
                                },
                                {
                                    title: "Stay Organized",
                                    desc: "Smart filters, search, and sorting. Keep your workspace clean.",
                                    icon: (
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ),
                                    color: "bg-blue-500"
                                },
                                {
                                    title: "Secure & Private",
                                    desc: "Your data is encrypted and yours alone. We prioritize your privacy.",
                                    icon: (
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    ),
                                    color: "bg-purple-500"
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="relative group p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-standard">
                                    <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${feature.color} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom CTA Section */}
                <div className="bg-gray-900 py-24 sm:py-32 relative overflow-hidden">
                    {/* A blurred glow element behind the CTA text — purely decorative */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-20">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                            Ready to boost your productivity?
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-400 mb-10">
                            Join thousands of users who are getting more done with less stress.
                            Start your journey today.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            {!user && (
                                <Link to="/register" className="w-full max-w-[220px] sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-blue-500 cursor-pointer hover:opacity-90 transition-standard hover:scale-[1.02] active:scale-95 focus-ring">
                                    Get Started Free
                                </Link>
                            )}
                            <Link to={user ? "/tasks" : "/login"} className="w-full max-w-[220px] sm:w-auto inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-white border border-white/20 hover:bg-white/20 cursor-pointer hover:opacity-90 active:scale-95 transition-standard focus-ring">
                                {user ? "Go to Dashboard" : "Log In"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomePage;
