// Registration form with a real-time password strength meter and requirements checklist.
// Requirements only reveal after the user first focuses the password field —
// showing them upfront before typing would feel noisy and overwhelming.
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { mapServerErrors } from '../utils/apiHelpers';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaCheck, FaTimes } from 'react-icons/fa';
import { registerSchema } from '../validations/schema';

const RegisterPage = () => {

    const strengthConfig = {
        0: { label: "Very Weak", color: "bg-red-500", text: "text-red-600" },
        1: { label: "Weak", color: "bg-orange-500", text: "text-orange-500" },
        2: { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" },
        3: { label: "Good", color: "bg-blue-500", text: "text-blue-500" },
        4: { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" },
        5: { label: "Secure", color: "bg-green-500", text: "text-green-500" },
    };

    const [showPassword, setShowPassword] = useState(false);
    const [passwordFocusedOnce, setPasswordFocusedOnce] = useState(false);
    const [globalError, setGlobalError] = useState(null);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const { register: registerUser, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

    const watchPassword = watch("password", "");

    // Each test strips whitespace before checking — this matches the space-stripping
    // logic in handlePasswordChange so the meter always reflects the actual stored value
    const passwordRequirements = [
        { id: 'length', label: '8+ Characters', test: (val) => val.replace(/\s/g, '').length >= 8 },
        { id: 'uppercase', label: 'Uppercase', test: (val) => /[A-Z]/.test(val.replace(/\s/g, '')) },
        { id: 'lowercase', label: 'Lowercase', test: (val) => /[a-z]/.test(val.replace(/\s/g, '')) },
        { id: 'number', label: 'Number', test: (val) => /[0-9]/.test(val.replace(/\s/g, '')) },
        { id: 'special', label: 'Special Char', test: (val) => /[^A-Za-z0-9]/.test(val.replace(/\s/g, '')) },
    ];

    const strength = passwordRequirements.filter(req => req.test(watchPassword)).length;
    const currentStrength = strengthConfig[strength] || strengthConfig[0];

    useEffect(() => {
        if (user) {
            navigate('/tasks');
        }
    }, [user, navigate]);


    const onSubmit = async (data) => {
        setSubmitAttempted(true);
        setGlobalError(null);

        try {
            await registerUser(data.name, data.email, data.password);
            showToast('Registration successful! Welcome.', 'success');
            navigate('/tasks');
        } catch (err) {
            const serverErrors = mapServerErrors(err);
            if (serverErrors.global) {
                setGlobalError(serverErrors.global);
                showToast(serverErrors.global, 'error');
            } else if (err.message) {
                showToast(err.message, 'error');
            } else {
                showToast('Failed to register', 'error');
            }
        }
    };

    // Strip spaces in real time rather than letting Zod reject on submit —
    // prevents the confusing situation where the strength meter shows "Secure" but the form still errors
    const handlePasswordChange = (e) => {
        const noSpaces = e.target.value.replace(/\s/g, '');
        setValue('password', noSpaces, { shouldValidate: true, shouldDirty: true });
    };

    return (
        <>
            <Helmet>
                <title>Register | Task Manager</title>
                <meta name="description" content="Create your Task Manager account and start organizing your work." />
                <meta property="og:title" content="Register | Task Manager" />
                <meta property="og:description" content="Create your Task Manager account and start organizing your work." />
                <meta property="og:image" content="https://task-management-app-2kk.pages.dev/og-image.jpg" />
                <meta property="og:url" content="https://task-management-app-2kk.pages.dev/register" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Register | Task Manager" />
                <meta name="twitter:description" content="Create your Task Manager account and start organizing your work." />
                <meta name="twitter:image" content="https://task-management-app-2kk.pages.dev/og-image.jpg" />
            </Helmet>
            <div className="relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="relative z-10 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/60 w-full max-w-md backdrop-blur-sm">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Sign Up</h1>
                        <p className="text-slate-600 mt-3 font-medium">Join us and start organizing</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        {/* Global Error Message */}
                        {globalError && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2">
                                <FaExclamationCircle className="text-red-600 shrink-0" />
                                <p className="text-sm font-semibold text-red-600">{globalError}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                            <input
                                {...register("name")}
                                type="text"
                                autoComplete="name"
                                className={`w-full px-4 py-3 rounded-xl transition-all duration-300 outline-none ${errors.name ? 'bg-red-50 border border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10' : 'bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                                placeholder="John Doe"
                            />
                            {errors.name && (
                                <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in duration-200">
                                    <FaExclamationCircle className="text-red-600 text-xs shrink-0" />
                                    <p className="text-red-600 text-xs font-semibold">{errors.name.message}</p>
                                </div>
                            )}
                        </div>
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
                                    <FaExclamationCircle className="text-red-600 text-xs shrink-0" />
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
                                    autoComplete="new-password"
                                    onChange={handlePasswordChange}
                                    onFocus={() => setPasswordFocusedOnce(true)}
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
                            <div className="mt-4 px-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500">
                                        Password Strength
                                    </span>
                                    <span className={`text-[11px] font-bold transition-all duration-300 ${watchPassword ? currentStrength.text : 'text-gray-400'}`}>
                                        {currentStrength.label}
                                    </span>
                                </div>

                                {/* Full-width 5-segmented Progress Bar */}
                                <div className="flex gap-1.5 w-full mb-4">
                                    {[1, 2, 3, 4, 5].map((step) => (
                                        <div
                                            key={step}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step <= strength ? currentStrength.color : 'bg-gray-100'}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2 transition-all duration-300">
                                    {passwordFocusedOnce && passwordRequirements.map((req) => {
                                        const isValid = req.test(watchPassword);
                                        if (isValid) return null;

                                        return (
                                            <div key={req.id} className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-left-2">
                                                <span className={`text-[11px] font-semibold tracking-tight transition-colors duration-300 ${(submitAttempted || errors.password) ? 'text-red-600' : 'text-slate-600'}`}>
                                                    • {req.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full bg-blue-600 text-white py-3 rounded-xl font-semibold tracking-wide hover:bg-blue-700 cursor-pointer transition-all duration-300 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${isSubmitting ? 'opacity-70 cursor-not-allowed hover:scale-100 active:scale-100' : ''}`}
                        >
                            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
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

export default RegisterPage;
