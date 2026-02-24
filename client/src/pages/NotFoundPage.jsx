// Shown for any URL that doesn't match a known route.
// navigate(-1) is used instead of a link to /tasks so users land
// back where they came from rather than always being redirected to the task list.
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

const NotFoundPage = () => {
    const navigate = useNavigate();


    return (
        <>
            <Helmet>
                <title>404 Not Found | Task Manager</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="flex-grow flex items-center justify-center min-h-[70vh] px-4 py-12">
                <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">

                    <div className="relative flex justify-center items-center">
                        <h1 className="text-9xl font-black text-gray-100/80 tracking-tighter select-none drop-shadow-sm">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <FaExclamationTriangle className="text-blue-500 text-xl" />
                                <span className="text-2xl font-bold text-gray-800">
                                    Page Not Found
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-6">
                        <p className="text-gray-500 text-lg leading-relaxed">
                            Oops! It looks like you've wandered off the path. The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto px-6 py-3 min-w-[160px] inline-flex items-center justify-center gap-2.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        >
                            <FaArrowLeft className="text-gray-400" />
                            Go Back
                        </button>

                        <Link
                            to="/"
                            className="w-full sm:w-auto px-6 py-3 min-w-[160px] inline-flex items-center justify-center gap-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                        >
                            <FaHome className="text-blue-100" />
                            Return to Home
                        </Link>
                    </div>

                </div>
            </div>
        </>
    );
};

export default NotFoundPage;
