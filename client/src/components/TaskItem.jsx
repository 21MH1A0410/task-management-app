// Wrapped in React.memo so the task grid doesn't re-render every card
// when a single task's state changes.
import React, { useCallback } from 'react';
import {
    FaEdit,
    FaTrash,
    FaClock,
    FaSpinner as FaSpinnerStatic,
    FaCheckCircle
} from 'react-icons/fa';
import { AlertCircle, Flame, Hourglass, Calendar, CalendarDays, CalendarCheck2 } from 'lucide-react';
import { STATUS_CONFIG, ACTION_CONFIG, TASK_STATUS } from '../constants/status';
import { getDueLabel } from '../utils/dateHelpers';

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

    // Smart Date Badges Logic
    const dueObj = getDueLabel(task.dueDate);

    // Default styles for 'date' or missing
    let dueStyle = 'text-slate-500 bg-slate-50 border border-slate-100';
    let DueIcon = Calendar;
    let urgencyAccent = ''; // Left-border accent for premium SaaS look

    if (dueObj) {
        if (isCompleted) {
            // Completed Override: Muted grey to prevent guilt UX
            dueStyle = 'bg-slate-100 text-slate-500 border border-slate-200';
            DueIcon = CalendarCheck2;
        } else {
            // Active Styles
            switch (dueObj.type) {
                case 'overdue':
                    dueStyle = 'bg-rose-100 text-rose-700 font-semibold border border-rose-200/50';
                    DueIcon = AlertCircle;
                    urgencyAccent = 'border-l-[4px] border-l-rose-500 border-y-0 border-r-0';
                    break;
                case 'today':
                    dueStyle = 'bg-orange-100 text-orange-700 font-semibold border border-orange-200/50';
                    DueIcon = Flame;
                    urgencyAccent = 'border-l-[4px] border-l-orange-400 border-y-0 border-r-0';
                    break;
                case 'tomorrow':
                    dueStyle = 'bg-amber-50 text-amber-700 font-medium border border-amber-200/50';
                    DueIcon = Hourglass;
                    break;
                case 'this_week':
                    dueStyle = 'bg-purple-50 text-purple-700 font-medium border border-purple-200/50';
                    DueIcon = CalendarDays;
                    break;
                case 'next_week':
                    dueStyle = 'bg-blue-50 text-blue-700 font-medium border border-blue-200/50';
                    DueIcon = CalendarDays;
                    break;
                case 'this_month':
                    dueStyle = 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-100/50';
                    DueIcon = Calendar;
                    break;
                case 'next_month':
                    dueStyle = 'bg-teal-50 text-teal-700 font-medium border border-teal-100/50';
                    DueIcon = Calendar;
                    break;
                default:
                    // default standard date styling
                    dueStyle = 'text-slate-500 bg-slate-50 border border-slate-100';
                    DueIcon = Calendar;
                    break;
            }
        }
    }

    return (
        <div className={`group relative bg-white rounded-2xl p-4 min-h-[220px] transition-standard flex flex-col justify-between h-full shadow-sm hover:shadow-lg ${urgencyAccent ? urgencyAccent : `border border-gray-100 border-l-4 ${statusConfig.borderColor}`} ${statusConfig.bgStyle}`}>

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
                        {dueObj ? (
                            <span className={`text-[11px] flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${dueStyle}`}>
                                <DueIcon size={12} strokeWidth={2.5} className="opacity-80" />
                                {dueObj.label}
                            </span>
                        ) : (
                            <span className="text-[11px] flex items-center gap-1.5 px-2.5 py-1 text-gray-400 bg-gray-50 rounded-md border border-slate-100">
                                <Calendar size={12} strokeWidth={2} className="opacity-50" />
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
