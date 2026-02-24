import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* Brand Row (Logo + Links on Mobile) */}
                    <div className="flex w-full md:w-auto justify-between items-center md:hidden">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">T</div>
                            <span className="text-slate-900 font-bold text-xl tracking-tight">TaskManager</span>
                        </div>
                        {/* Mobile Links */}
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
                            <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                        </div>
                    </div>

                    {/* Desktop Brand Column */}
                    <div className="hidden md:flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">T</div>
                            <span className="text-slate-900 font-bold text-xl tracking-tight">TaskManager</span>
                        </div>
                        <p className="text-sm text-slate-500 border-l border-slate-200 pl-8">
                            Organize your life, focus on your work, and achieve more every day with our intelligent task management platform.
                        </p>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                    </div>
                </div>

                {/* Mobile Paragraph */}
                <p className="mt-4 text-sm text-slate-500 md:hidden leading-relaxed">
                    Organize your life, focus on your work, and achieve more every day with our intelligent task management platform.
                </p>

                {/* Bottom Bar */}
                <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} TaskManager Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
