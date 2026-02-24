// Wrapped in React.memo so the task grid doesn't re-render every card
// when a single task's state changes.
import React, { useCallback } from 'react';
import {
    FaEdit,
    FaTrash,
    FaClock,
    FaSpinner as FaSpinnerStatic,
    FaCheckCircle,
    FaCalendarAlt
} from 'react-icons/fa';
import { STATUS_CONFIG, ACTION_CONFIG, TASK_STATUS } from '../constants/status';

/**
 * Highlights matched search terms within task titles using a word-boundary regex.
 * Escapes the query before injecting into RegExp to prevent ReDoS from user input.
 */
const SearchHighlight = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                // Value comparison avoids the stateful lastIndex bug with the `g` flag on RegExp.test()
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

const TaskItem = React.memo(({ task, onEdit, onDelete, onStatusTransition, isTransitioning, searchTerm = '' }) => {
    const statusNormalized = task.status?.toLowerCase() || TASK_STATUS.PENDING;
    const statusConfig = STATUS_CONFIG[statusNormalized] || STATUS_CONFIG[TASK_STATUS.PENDING];
    const actionConfig = ACTION_CONFIG[statusNormalized] || ACTION_CONFIG[TASK_STATUS.PENDING];
    const ActionIcon = actionConfig.icon;
    const isCompleted = statusNormalized === TASK_STATUS.COMPLETED;

    // Stable refs prevent child buttons from triggering re-renders
    // when an unrelated task elsewhere in the list updates
    const handleStatusClick = useCallback(() => {
        onStatusTransition(task._id);
    }, [task._id, onStatusTransition]);

    const handleEdit = useCallback(() => {
        onEdit(task);
    }, [task, onEdit]);

    const handleDelete = useCallback(() => {
        onDelete(task._id);
    }, [task._id, onDelete]);

    /**
     * Returns urgency-aware styling for the due date badge.
     * Completed tasks always get a muted style regardless of date — alerting
     * a user about a missed deadline that's already been resolved is counterproductive.
     */
    const getDueDateDetails = () => {
        if (!task.dueDate) return { style: 'text-gray-400', isOverdue: false, bgBadge: '' };
        if (isCompleted) return { style: 'text-slate-400', isOverdue: false, bgBadge: '' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { style: 'text-rose-600 font-semibold', isOverdue: true, bgBadge: 'bg-rose-50' };
        if (diffDays === 0) return { style: 'text-orange-600 font-semibold', isOverdue: false, bgBadge: 'bg-orange-50' };
        if (diffDays <= 2) return { style: 'text-orange-500 font-medium', isOverdue: false, bgBadge: '' };
        return { style: 'text-slate-500', isOverdue: false, bgBadge: '' };
    };

    const { style: dueDateStyle, isOverdue, bgBadge } = getDueDateDetails();

    return (
        <div className={`group relative bg-white rounded-2xl p-4 min-h-[220px] border border-gray-100 border-l-4 shadow-sm hover:shadow-lg transition-standard flex flex-col justify-between h-full ${statusConfig.borderColor} ${statusConfig.bgStyle}`}>

            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.color}`}>
                        {statusNormalized === TASK_STATUS.PENDING && <FaClock className="w-3 h-3" />}
                        {statusNormalized === TASK_STATUS.IN_PROGRESS && <FaSpinnerStatic className="w-3 h-3 animate-spin" />}
                        {statusNormalized === TASK_STATUS.COMPLETED && <FaCheckCircle className="w-3 h-3" />}
                        <span>
                            {statusConfig.label}
                        </span>
                    </span>
                    <div className="flex flex-col items-end gap-1">
                        {task.dueDate ? (
                            <span className={`text-xs flex items-center gap-1.5 px-2 py-1 ${bgBadge || 'bg-gray-50'} rounded-md border border-gray-100 ${dueDateStyle}`}>
                                {isOverdue ? (
                                    // Pulsing dot makes overdue tasks immediately scannable in a long list
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                ) : (
                                    <FaCalendarAlt className="w-3 h-3 opacity-90" />
                                )}
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        ) : (
                            <span className="text-xs flex items-center gap-1.5 px-2 py-1 text-gray-400 bg-gray-50 rounded-md border border-slate-50">
                                <FaCalendarAlt className="w-3 h-3 opacity-50" />
                                No Date
                            </span>
                        )}
                    </div>
                </div>

                <h3 className={`text-base font-bold text-gray-900 leading-tight line-clamp-2 min-h-[40px] flex items-center break-words ${isCompleted ? 'line-through text-slate-400' : ''}`} title={task.title}>
                    <SearchHighlight text={task.title} highlight={searchTerm} />
                </h3>

                <p className="text-slate-500 text-sm line-clamp-3 min-h-[60px] leading-relaxed">
                    {task.description || <span className="italic text-slate-400">No description provided.</span>}
                </p>
            </div>

            <div className="pt-3 border-t border-slate-50 flex justify-between items-center gap-2">
                <button
                    type="button"
                    onClick={handleStatusClick}
                    disabled={isTransitioning}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-standard flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${actionConfig.className} ${isTransitioning ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md cursor-pointer hover:opacity-90 active:scale-95'}`}
                    aria-label={actionConfig.title}
                    title={actionConfig.title}
                >
                    {isTransitioning ? (
                        <FaSpinnerStatic className="w-3 h-3 animate-spin" />
                    ) : (
                        <ActionIcon className="w-3 h-3" />
                    )}
                    {actionConfig.label}
                </button>

                {/* Hidden on desktop until hovered — reduces visual noise at rest */}
                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        type="button"
                        onClick={handleEdit}
                        disabled={isTransitioning}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer hover:opacity-90 active:scale-95 transition-fast focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Edit task: ${task.title}`}
                        title="Edit Task"
                    >
                        <FaEdit size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isTransitioning}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer hover:opacity-90 active:scale-95 transition-fast focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Delete task: ${task.title}`}
                        title="Delete Task"
                    >
                        <FaTrash size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
