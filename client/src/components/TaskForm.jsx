// Fires onSave as a fire-and-forget call so the modal closes immediately
// while useTasks handles the optimistic update and error toast in the background.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema } from '../validations/schema';
import { useToast } from '../context/ToastContext';
import { mapServerErrors } from '../utils/apiHelpers';
import { FaClock, FaCheckCircle, FaSpinner as FaSpinnerStatic, FaCalendarAlt, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { TASK_STATUS } from '../constants/status';

/** Returns tomorrow as YYYY-MM-DD. Pre-fills the due date so new tasks default to a same-day turnaround. */
const getTomorrowDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};

const TaskForm = ({ isOpen, onClose, onSave, taskToEdit }) => {
    const { showToast } = useToast();
    const [shouldShake, setShouldShake] = useState(false);
    const [globalError, setGlobalError] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isDirty }
    } = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            status: 'pending',
            dueDate: ''
        }
    });

    const watchTitle = watch("title", "");
    const watchDescription = watch("description", "");
    const watchStatus = watch("status", "pending");

    useEffect(() => {
        if (isOpen) {
            setGlobalError(null);
            if (taskToEdit) {
                reset({
                    title: taskToEdit.title || '',
                    description: taskToEdit.description || '',
                    status: taskToEdit.status || 'pending',
                    // The API returns a full ISO timestamp — strip the time component for the date input
                    dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : ''
                });
            } else {
                reset({
                    title: '',
                    description: '',
                    status: 'pending',
                    dueDate: getTomorrowDate()
                });
            }
        }
    }, [taskToEdit, isOpen, reset]);

    // Guard prevents closing mid-submission which would orphan an in-flight request
    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (event) => {
            if (event.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, isSubmitting, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const statusOptions = [
        { id: TASK_STATUS.PENDING, label: 'Pending', icon: <FaClock className="text-gray-400" /> },
        { id: TASK_STATUS.IN_PROGRESS, label: 'In Progress', icon: <FaSpinnerStatic className="text-blue-500 animate-spin" /> },
        { id: TASK_STATUS.COMPLETED, label: 'Completed', icon: <FaCheckCircle className="text-green-500" /> },
    ];

    const onSubmit = async (data) => {
        if (isSubmitting) return;

        // Skip the API call entirely if nothing changed — a no-op PUT would be misleading
        if (taskToEdit && !isDirty) {
            onClose();
            return;
        }

        setGlobalError(null);

        // Convert empty string to null so the backend doesn't persist "" as a due date
        const payload = {
            ...data,
            dueDate: data.dueDate || null
        };

        try {
            onSave(payload).catch(error => {
                const serverErrors = mapServerErrors(error);
                if (Object.keys(serverErrors).length === 0) {
                    showToast("Something went wrong. Please try again.", "error");
                } else if (serverErrors.global) {
                    showToast(serverErrors.global, 'error');
                }
            });
            onClose();
        } catch (error) {
            // Error mapped and handled
        }
    };

    // Shake the panel on Zod validation failure to draw attention without blocking submit
    const onError = () => {
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 400);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-form-title"
        >
            <div
                className={`bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ${shouldShake ? 'animate-shake' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-gray-100 flex-shrink-0">
                    <h2 id="task-form-title" className="text-2xl font-bold text-gray-900 tracking-tight">
                        {taskToEdit ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full cursor-pointer hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
                        aria-label="Close modal"
                        disabled={isSubmitting}
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onError)} className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                    {globalError && (
                        <div className="flex items-center gap-3 py-2 px-1 animate-in slide-in-from-top-2">
                            <FaExclamationCircle className="text-red-500 shrink-0" />
                            <p className="text-sm font-semibold text-red-600">{globalError}</p>
                        </div>
                    )}

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
                                What needs to be done? <span className="text-red-500">*</span>
                            </label>
                            {/* Counter turns red at 45/50 to warn before the hard limit is hit */}
                            <span className={`text-[10px] font-medium transition-colors ${watchTitle.length >= 45 ? 'text-red-500' : 'text-gray-400'}`}>
                                {watchTitle?.length || 0}/50
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                {...register("title")}
                                type="text"
                                id="title"
                                autoFocus
                                aria-invalid={!!errors.title}
                                aria-describedby={errors.title ? 'title-error' : undefined}
                                maxLength={50}
                                className={`w-full px-4 py-2.5 sm:px-4 sm:py-3 text-base sm:text-[15px] font-semibold border rounded-xl transition-all ${errors.title ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                    } bg-gray-50/30 focus:bg-white outline-none placeholder:text-gray-400 placeholder:font-normal`}
                                placeholder="Enter a descriptive title..."
                            />
                        </div>
                        {errors.title && (
                            <div id="title-error" className="mt-2 px-1 flex items-center gap-2 animate-in fade-in duration-200" role="alert">
                                <FaExclamationCircle className="text-red-500 text-xs shrink-0" />
                                <p className="text-red-600 text-xs font-semibold">{errors.title.message}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                                Description
                            </label>
                            <span className={`text-[10px] font-medium transition-colors ${watchDescription.length >= 90 ? 'text-red-500' : 'text-gray-400'}`}>
                                {watchDescription.length}/100
                            </span>
                        </div>
                        <textarea
                            {...register("description")}
                            id="description"
                            rows="3"
                            maxLength={100}
                            aria-invalid={!!errors.description}
                            aria-describedby={errors.description ? 'description-error' : undefined}
                            className={`w-full px-4 py-2.5 sm:px-4 sm:py-3 border rounded-xl transition-all resize-none ${errors.description ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                } bg-gray-50/30 focus:bg-white outline-none placeholder:text-gray-400 placeholder:font-normal text-sm leading-relaxed`}
                            placeholder="Add more details about this task..."
                        />
                        {errors.description && (
                            <div id="description-error" className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-in fade-in duration-200" role="alert">
                                <FaExclamationCircle className="text-red-500 text-xs shrink-0" />
                                <p className="text-red-600 text-xs font-semibold">{errors.description.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        {/* Status is rendered as toggle buttons rather than a <select>
                            so changes feel immediate and tactile */}
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Status
                            </label>
                            {/* Hidden input lets RHF own the value without a visible <select> */}
                            <input type="hidden" {...register("status")} />
                            <div className={`flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl border-2 transition-all ${errors.status ? 'border-red-500' : 'border-transparent'}`}>
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setValue("status", option.id, { shouldValidate: true, shouldDirty: true })}
                                        aria-pressed={watchStatus === option.id}
                                        className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${watchStatus === option.id
                                            ? 'bg-white text-blue-600 shadow-sm scale-[1.02]'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                            }`}
                                    >
                                        <span>
                                            {option.icon}
                                        </span>
                                        <span>
                                            {option.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {errors.status && (
                                <p id="status-error" className="text-red-500 text-xs mt-2 font-medium" role="alert">
                                    {errors.status.message}
                                </p>
                            )}
                        </div>

                        <div className={taskToEdit ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                            <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-900 mb-2">
                                Due Date
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <FaCalendarAlt size={14} />
                                </div>
                                <input
                                    {...register("dueDate")}
                                    type="date"
                                    id="dueDate"
                                    aria-invalid={!!errors.dueDate}
                                    aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                                    className={`w-full pl-10 sm:pl-10 pr-4 sm:pr-4 py-2.5 sm:py-3 border rounded-xl transition-all ${errors.dueDate ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                        } bg-gray-50/30 focus:bg-white outline-none text-sm`}
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1.5 ml-1">
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                Leave empty for no deadline
                            </p>
                            {errors.dueDate && (
                                <div id="dueDate-error" className="mt-2 px-1 flex items-center gap-2 animate-in fade-in duration-200" role="alert">
                                    <FaExclamationCircle className="text-red-500 text-xs shrink-0" />
                                    <p className="text-red-600 text-xs font-semibold">{errors.dueDate.message}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row-reverse justify-start gap-3 mt-2 pt-5 border-t border-gray-100 flex-shrink-0">
                        <button
                            type="submit"
                            className={`w-full sm:w-auto px-6 py-3 min-w-[140px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer hover:opacity-90 transition-all font-bold shadow-md shadow-blue-500/20 active:scale-95 focus-ring ${isSubmitting ? 'opacity-70 cursor-not-allowed active:scale-100' : ''
                                }`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaSpinnerStatic className="animate-spin" />
                                    {taskToEdit ? 'Update Task' : 'Create Task'}
                                </span>
                            ) : (
                                taskToEdit ? 'Update Task' : 'Create Task'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full sm:w-auto px-6 py-3 min-w-[140px] text-gray-500 bg-white hover:text-gray-900 hover:bg-gray-100 rounded-xl cursor-pointer hover:opacity-90 transition-all font-semibold active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            Discard
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
