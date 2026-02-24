// Standalone login form — validation is handled by Zod at the client level,
// with server error messages mapped and surfaced both inline and via toast
// so users on slow connections still see feedback even if the banner scrolls out of view.
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { mapServerErrors } from '../utils/apiHelpers';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { loginSchema } from '../validations/schema';

const LoginPage = () => {

    const [showPassword, setShowPassword] = useState(false);
    const [globalError, setGlobalError] = useState(null);

    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    const onSubmit = async (data) => {
        setGlobalError(null);
        try {
            await login(data.email, data.password, data.rememberMe);
            showToast('Welcome back!', 'auth');
            navigate('/tasks');
        } catch (err) {
            const serverErrors = mapServerErrors(err);
            if (serverErrors.global) {
                setGlobalError(serverErrors.global);
                showToast(serverErrors.global, 'error');
            } else if (err.message) {
                showToast(err.message, 'error');
            } else {
                showToast('Failed to login', 'error');
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Login | Task Manager</title>
                <meta name="description" content="Sign in to Task Manager to manage your tasks." />
            </Helmet>
            <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="relative z-10 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/60 w-full max-w-md backdrop-blur-sm">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 mt-3 font-medium">Sign in to manage your tasks</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        {/* Red inline banner for server errors — gives users context
                    even if they've already scrolled past the toast */}
                        {globalError && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2">
                                <FaExclamationCircle className="text-red-500 shrink-0" />
                                <p className="text-sm font-semibold text-red-600">{globalError}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <input
                                {...register("email")}
                                type="email"
                                autoComplete="email"
                                className={`w-full px-4 py-3 rounded-xl transition-all duration-300 outline-none ${errors.email ? 'bg-red-50 border border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10' : 'bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in duration-200">
                                    <FaExclamationCircle className="text-red-500 text-xs shrink-0" />
                                    <p className="text-red-600 text-xs font-semibold">{errors.email.message}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    className={`w-full px-4 py-3 rounded-xl transition-all duration-300 outline-none pr-10 ${errors.password ? 'bg-red-50 border border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10' : 'bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {errors.password && (
                                <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in duration-200">
                                    <FaExclamationCircle className="text-red-500 text-xs shrink-0" />
                                    <p className="text-red-600 text-xs font-semibold">{errors.password.message}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                {/* Custom checkbox: native <input type="checkbox"> can't be styled with
                                the peer-checked Tailwind utilities without a hidden sibling element */}
                                <div className="relative">
                                    <input
                                        {...register("rememberMe")}
                                        type="checkbox"
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md transition-all peer-checked:border-blue-600 peer-checked:bg-blue-600 group-hover:border-blue-400"></div>
                                    <svg className="absolute top-1 left-1 w-3 h-3 text-white scale-0 transition-transform peer-checked:scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember Me</span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-blue-600 text-white py-3 rounded-xl font-semibold tracking-wide hover:bg-blue-700 cursor-pointer transition-all duration-300 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${isSubmitting ? 'opacity-70 cursor-not-allowed hover:scale-100 active:scale-100' : ''}`}
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Sign Up</Link>
                    </p>

                    <p className="mt-6 text-center text-xs text-gray-500 px-4 leading-relaxed max-w-sm mx-auto">
                        By continuing, you agree to our{' '}
                        <Link to="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>.
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
