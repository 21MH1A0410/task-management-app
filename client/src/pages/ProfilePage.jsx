// Three-section profile dashboard: Identity, Security, and Danger Zone.
// Schemas are declared at module level (not inside the component) so Zod
// doesn't recreate them on every render — important for large forms.
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useToast } from '../context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import taskService from '../services/taskService';
import {
    FaUserShield, FaLock, FaEye, FaEyeSlash, FaFire,
    FaBolt, FaLeaf, FaTrashAlt, FaShieldAlt, FaCamera
} from 'react-icons/fa';
import { FaSpinner } from 'react-icons/fa';
import ConfirmationModal from '../components/ConfirmationModal';
import ImageCropperModal from '../components/ImageCropper';
import { useNavigate } from 'react-router-dom';
import { TASK_STATUS } from '../constants/status';

/** 
 * Inlined here rather than imported from a shared schema file because these
 * are profile-specific shapes that aren't reused anywhere else in the app.
 */
const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain 1 uppercase letter')
        .regex(/[a-z]/, 'Must contain 1 lowercase letter')
        .regex(/[0-9]/, 'Must contain 1 number')
        .regex(/[^A-Za-z0-9]/, 'Must contain 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ProfilePage = () => {
    const { user, updateUser, logout } = useAuth();
    const { tasks } = useTasks();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // UI States
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Avatar States
    const [avatarPreview, setAvatarPreview] = useState(null); // Local object URL for instant preview before the upload finishes
    const [isUploading, setIsUploading] = useState(false);
    const [avatarTs, setAvatarTs] = useState(Date.now()); // Timestamp appended to img src to bust the browser cache after an upload
    const fileInputRef = useRef(null);

    // Each call to URL.createObjectURL allocates memory that the GC can't reclaim
    // automatically — revokeObjectURL tells the browser it's safe to release it
    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const [selectedImage, setSelectedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Resetting the input value is necessary so re-uploading the exact same
        // file name triggers onChange again — browsers skip the event if value hasn't changed
        e.target.value = '';

        // Client-side guard before sending anything to the server.
        // The backend re-validates too, but catching it here saves an unnecessary round-trip.
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image is too large. Please upload a file smaller than 5MB.', 'error');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showToast('Only JPEG, PNG or WebP images are allowed', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    }, [showToast]);

    const handleCropComplete = useCallback(async (croppedFile) => {
        setShowCropper(false);
        const previewUrl = URL.createObjectURL(croppedFile);
        setAvatarPreview(previewUrl);

        setIsUploading(true);
        try {
            await taskService.uploadProfilePic(croppedFile);
            // Update global user state with hasProfilePic:true and a fresh timestamp.
            // The timestamp propagates to the Navbar avatar src via AuthContext,
            // forcing the browser to re-fetch the new image without a manual page reload.
            updateUser({ hasProfilePic: true });
            setAvatarTs(Date.now());
            showToast('Profile picture updated!', 'success');
        } catch (err) {
            setAvatarPreview(null); // revert preview on failure
            showToast(err?.response?.data?.error?.message || 'Upload failed', 'error');
        } finally {
            setIsUploading(false);
        }
    }, [showToast, updateUser]);

    // Password UI States
    const [passwordFocusedOnce, setPasswordFocusedOnce] = useState(false);
    const [submitAttemptedPass, setSubmitAttemptedPass] = useState(false);

    const strengthConfig = {
        0: { label: "Very Weak", color: "bg-red-500", text: "text-red-500" },
        1: { label: "Weak", color: "bg-orange-500", text: "text-orange-500" },
        2: { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" },
        3: { label: "Good", color: "bg-blue-500", text: "text-blue-500" },
        4: { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" },
        5: { label: "Secure", color: "bg-green-500", text: "text-green-500" },
    };

    const passwordRequirements = [
        { id: 'length', label: '8+ Characters', test: (val) => val.replace(/\s/g, '').length >= 8 },
        { id: 'uppercase', label: 'Uppercase', test: (val) => /[A-Z]/.test(val.replace(/\s/g, '')) },
        { id: 'lowercase', label: 'Lowercase', test: (val) => /[a-z]/.test(val.replace(/\s/g, '')) },
        { id: 'number', label: 'Number', test: (val) => /[0-9]/.test(val.replace(/\s/g, '')) },
        { id: 'special', label: 'Special Char', test: (val) => /[^A-Za-z0-9]/.test(val.replace(/\s/g, '')) },
    ];

    // --- Identity Form --- (name + bio)
    const {
        register, handleSubmit, reset, watch,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name || '', bio: user?.bio || '' }
    });

    // --- Password Form --- (separate RHF instance so the two forms are fully isolated)
    const {
        register: regPass, handleSubmit: handlePassSubmit, reset: resetPass, watch: watchPass, setValue: setPassValue,
        formState: { errors: passErrors, isSubmitting: isSubmittingPass }
    } = useForm({ resolver: zodResolver(passwordSchema) });

    const bioValue = watch('bio', user?.bio || '');
    const newPassValue = watchPass('newPassword', '');

    const strength = passwordRequirements.filter(req => req.test(newPassValue)).length;
    const currentStrength = strengthConfig[strength] || strengthConfig[0];

    // Labels the account with a mood based on completed task volume —
    // a lightweight gamification nudge that reads from the hook's cached data
    const accountPulse = useMemo(() => {
        const completed = tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
        if (completed > 10) return { label: 'On Fire', icon: <FaFire className="text-orange-500" />, color: 'bg-orange-50' };
        if (completed > 0) return { label: 'Steady Flow', icon: <FaBolt className="text-blue-500" />, color: 'bg-blue-50' };
        return { label: 'Fresh Start', icon: <FaLeaf className="text-green-500" />, color: 'bg-green-50' };
    }, [tasks]);

    // Handlers
    const onUpdateProfile = async (data) => {
        try {
            const res = await api.put('/users/profile', data);
            updateUser(res.data);
            showToast('Identity updated!', 'success');
            setIsEditing(false);
            reset(data);
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to update profile', 'error');
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            reset({ name: user?.name || '', bio: user?.bio || '' });
        }
        setIsEditing(!isEditing);
    };

    const handlePasswordChange = (e) => {
        const noSpaces = e.target.value.replace(/\s/g, '');
        setPassValue('newPassword', noSpaces, { shouldValidate: true, shouldDirty: true });
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete('/users/profile');
            // Await logout to ensure storage is cleared before navigation fires
            await logout();
            showToast('Account successfully deleted.', 'success');
            // replace:true removes the profile route from the history stack so
            // the Back button can't navigate back to a page for a deleted account
            navigate('/login', { replace: true });
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to delete account', 'error');
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Profile | Task Manager</title>
            </Helmet>
            <div className="flex-grow bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* SIDEBAR: Profile Card & Pulse */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Main Identity Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-white overflow-hidden">
                            <div className="h-28 bg-gradient-to-tr from-blue-700 to-indigo-600" />
                            <div className="px-6 pb-10 text-center relative -mt-14">
                                {/* Smart Avatar — click to upload */}
                                <div className="h-32 w-32 rounded-[2rem] bg-white p-2 shadow-xl mx-auto mb-4 border border-white">
                                    <div
                                        className="h-full w-full rounded-[1.8rem] overflow-hidden relative cursor-pointer group"
                                        onClick={handleAvatarClick}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAvatarClick()}
                                        title="Click to change profile picture"
                                    >
                                        {/* Image or initials */}
                                        {avatarPreview || user?.hasProfilePic ? (
                                            <img
                                                src={avatarPreview || `/api/users/${user.id}/profile-pic?t=${avatarTs}`}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-blue-50 flex items-center justify-center text-blue-600 text-5xl font-black">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        {/* Hover overlay — camera icon */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.8rem]">
                                            {isUploading
                                                ? <FaSpinner className="text-white text-2xl animate-spin" />
                                                : <FaCamera className="text-white text-2xl" />
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h2>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 mb-4">{user?.email}</p>
                                {user?.bio && (
                                    <p className="text-slate-600 text-sm font-medium italic mt-4 max-w-sm mx-auto">"{user.bio}"</p>
                                )}
                            </div>
                        </div>

                        {/* Dynamic Account Pulse Card */}
                        <div className={`p-6 rounded-[2rem] border border-white shadow-xl shadow-blue-500/5 transition-all duration-500 ${accountPulse.color}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    {accountPulse.icon}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Pulse</h3>
                                    <p className="text-lg font-bold text-slate-900">{accountPulse.label}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Keep completing tasks to maintain your streak!</p>
                        </div>
                    </div>

                    {/* CONTENT: Forms Section */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Identity Details Block */}
                        <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-200/60 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                                            <FaUserShield className="text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Identity</h3>
                                    </div>
                                    <p className="text-slate-500 font-medium ml-11">Manage your public personal and biography</p>
                                </div>
                                <button
                                    onClick={toggleEdit}
                                    className={`px-6 py-3 rounded-2xl font-black text-sm cursor-pointer transition-all focus-ring active:scale-95 ${isEditing ? 'bg-slate-100 text-slate-500 hover:opacity-90' : 'bg-slate-900 text-white hover:bg-blue-600 hover:opacity-90 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                                >
                                    {isEditing ? 'Discard' : 'Edit Profile'}
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Name</label>
                                        <input
                                            {...register('name')}
                                            disabled={!isEditing}
                                            placeholder="Your name"
                                            className={`w-full px-5 py-4 sm:px-6 sm:py-5 rounded-2xl font-bold border-2 transition-all outline-none ${isEditing ? 'border-blue-100 focus:ring-4 focus:ring-blue-50 bg-white' : 'border-transparent bg-slate-50'} ${errors.name ? 'border-red-500' : ''}`}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Email (Read-only)</label>
                                        <input disabled value={user?.email || ''} className="w-full px-5 py-4 sm:px-6 sm:py-5 rounded-2xl bg-slate-50 text-slate-400 font-semibold italic cursor-not-allowed border-2 border-transparent" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Bio</label>
                                        <span className={`text-[10px] font-black ${String(bioValue).length > 500 ? 'text-red-500' : 'text-slate-300'}`}>
                                            {String(bioValue).length} / 500
                                        </span>
                                    </div>
                                    <textarea
                                        {...register('bio')}
                                        disabled={!isEditing}
                                        rows={4}
                                        placeholder="A short bio..."
                                        className={`w-full px-5 py-4 sm:px-6 sm:py-5 rounded-[2rem] border-2 resize-none outline-none transition-all ${isEditing ? 'border-blue-100 focus:ring-4 focus:ring-blue-50 bg-white' : 'border-transparent bg-slate-50'} ${errors.bio ? 'border-red-500' : ''}`}
                                    />
                                    {errors.bio && <p className="text-red-500 text-xs font-bold mt-1">{errors.bio.message}</p>}
                                </div>
                                {isEditing && (
                                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 cursor-pointer hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isSubmitting ? 'Saving Changes...' : 'Confirm Update'}
                                    </button>
                                )}
                            </form>
                        </section>

                        {/* Security Update Block */}
                        <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-200/60">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-slate-900 rounded-lg shadow-lg shadow-slate-200">
                                            <FaShieldAlt className="text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Security</h3>
                                    </div>
                                    <p className="text-slate-500 font-medium ml-11">Update your password to keep your account safe</p>
                                </div>
                            </div>

                            <form onSubmit={handlePassSubmit(async (data) => {
                                setSubmitAttemptedPass(true);
                                try {
                                    await api.put('/users/password', data);
                                    showToast('Password updated successfully!', 'success');
                                    resetPass();
                                    setSubmitAttemptedPass(false);
                                    setPasswordFocusedOnce(false);
                                } catch (err) {
                                    showToast(err.response?.data?.message || err.message || 'Failed to update password', 'error');
                                }
                            })} className="space-y-6 max-w-xl">
                                {/* A visually hidden username field so password managers
                                correctly associate the password fields with this account */}
                                <input type="text" autoComplete="username" value={user?.email || ''} readOnly aria-hidden="true" className="sr-only" tabIndex={-1} />
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Current Password</label>
                                    <input
                                        {...regPass('currentPassword')}
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                        className={`w-full px-5 py-4 sm:px-6 sm:py-5 rounded-2xl font-bold bg-white border-2 transition-all outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 ${passErrors.currentPassword ? 'border-red-500' : 'border-slate-100 hover:border-slate-300'}`}
                                    />
                                    {passErrors.currentPassword && <p className="text-red-500 text-xs font-bold mt-1">{passErrors.currentPassword.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 pt-2">
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">New Password</label>
                                        <div className="relative">
                                            <input
                                                {...regPass('newPassword')}
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                onChange={handlePasswordChange}
                                                onFocus={() => setPasswordFocusedOnce(true)}
                                                placeholder="New password"
                                                className={`w-full px-5 py-4 sm:px-6 sm:py-5 rounded-2xl font-bold bg-white border-2 pr-12 transition-all outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 ${passErrors.newPassword ? 'border-red-500' : 'border-slate-100 hover:border-slate-300'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 cursor-pointer hover:opacity-90 focus:outline-none transition-colors"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                            </button>
                                        </div>
                                        {passErrors.newPassword && <p className="text-red-500 text-xs font-bold mt-1 max-w-[200px] leading-tight">{passErrors.newPassword.message}</p>}

                                        {/* Password Strength Meter UI */}
                                        <div className="mt-4 px-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500">
                                                    Password Strength
                                                </span>
                                                <span className={`text-[11px] font-bold transition-all duration-300 ${newPassValue ? currentStrength.text : 'text-slate-400'}`}>
                                                    {currentStrength.label}
                                                </span>
                                            </div>
                                            <div className="flex gap-1.5 w-full mb-4">
                                                {[1, 2, 3, 4, 5].map((step) => (
                                                    <div
                                                        key={step}
                                                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step <= strength ? currentStrength.color : 'bg-slate-100'}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex flex-col gap-2 transition-all duration-300">
                                                {passwordFocusedOnce && passwordRequirements.map((req) => {
                                                    const isValid = req.test(newPassValue);
                                                    if (isValid) return null;
                                                    return (
                                                        <div key={req.id} className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-left-2">
                                                            <span className={`text-[11px] font-semibold tracking-tight transition-colors duration-300 ${(submitAttemptedPass || passErrors.newPassword) ? 'text-red-500' : 'text-slate-500'}`}>
                                                                • {req.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Confirm Password</label>
                                        <input
                                            {...regPass('confirmPassword')}
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            placeholder="Confirm new password"
                                            className={`w-full px-5 py-4 sm:px-6 sm:py-5 rounded-2xl font-bold bg-white border-2 transition-all outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 ${passErrors.confirmPassword ? 'border-red-500' : 'border-slate-100 hover:border-slate-300'}`}
                                        />
                                        {passErrors.confirmPassword && <p className="text-red-500 text-xs font-bold mt-1">{passErrors.confirmPassword.message}</p>}
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmittingPass} className="mt-4 px-8 py-4 bg-slate-900 text-white font-black rounded-[1.2rem] shadow-xl hover:bg-slate-800 cursor-pointer hover:opacity-90 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isSubmittingPass ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </section>

                        {/* Danger Zone Block */}
                        <section className="p-6 sm:p-10 border-2 border-red-100 rounded-[2.5rem] bg-red-50/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="flex items-center gap-2 text-red-600 font-black uppercase text-sm tracking-widest mb-2">
                                        <FaTrashAlt /> Danger Zone
                                    </h4>
                                    <p className="text-sm text-slate-600 font-medium">Permanently delete your account and all associated tasks.</p>
                                    <p className="text-xs text-red-500 font-bold mt-1">This action cannot be undone.</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="whitespace-nowrap px-6 py-3 bg-red-100 text-red-600 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95 shadow-sm focus-ring-error"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Account Deletion Confirmation */}
                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    onClose={() => !isDeleting && setShowDeleteConfirm(false)}
                    title="Delete Account Permanently"
                    message="Are you absolutely sure? This will instantly wipe your account, settings, and all your tasks forever."
                    confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                    confirmStyle="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    onConfirm={handleDeleteAccount}
                />

                {/* Image Cropper Modal */}
                {selectedImage && (
                    <ImageCropperModal
                        isOpen={showCropper}
                        onClose={() => setShowCropper(false)}
                        imageSrc={selectedImage}
                        onCropComplete={handleCropComplete}
                    />
                )}
            </div>
        </>
    );
};

export default ProfilePage;