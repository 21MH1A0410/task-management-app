import { FaPlay, FaCheck, FaRedo } from 'react-icons/fa';

export const TASK_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
};

// completed gets a subtle background wash to visually separate done work from active tasks
export const STATUS_CONFIG = {
    [TASK_STATUS.PENDING]: {
        label: 'Pending',
        color: 'bg-gray-100 text-gray-700',
        borderColor: 'border-l-gray-500',
        bgStyle: ''
    },
    [TASK_STATUS.IN_PROGRESS]: {
        label: 'In Progress',
        color: 'bg-blue-100 text-blue-800',
        borderColor: 'border-l-blue-600',
        bgStyle: ''
    },
    [TASK_STATUS.COMPLETED]: {
        label: 'Completed',
        color: 'bg-green-100 text-green-800',
        borderColor: 'border-l-emerald-600',
        bgStyle: 'bg-slate-50/50'
    }
};

// Strict one-way cycle: pending → in-progress → completed → pending.
// Skipping statuses (e.g., pending → completed) is intentionally disallowed
// to keep task progression auditable and predictable.
export const STATUS_TRANSITIONS = {
    [TASK_STATUS.PENDING]: TASK_STATUS.IN_PROGRESS,
    [TASK_STATUS.IN_PROGRESS]: TASK_STATUS.COMPLETED,
    [TASK_STATUS.COMPLETED]: TASK_STATUS.PENDING
};

export const ACTION_CONFIG = {
    [TASK_STATUS.PENDING]: {
        label: 'Start',
        icon: FaPlay,
        className: `
        bg-[#155dfc]
        hover:bg-[#124ECC]
        active:scale-95
        transition-all
        duration-200
        text-white
        shadow-sm
    `,
        title: 'Start working on this task'
    },

    [TASK_STATUS.IN_PROGRESS]: {
        label: 'Complete',
        icon: FaCheck,
        className: `
        bg-[#3CB371]
        hover:bg-[#2E8B57]
        active:scale-95
        transition-all
        duration-200
        text-white
        shadow-sm
    `,
        title: 'Mark this task as completed'
    },

    [TASK_STATUS.COMPLETED]: {
        label: 'Redo',
        icon: FaRedo,
        className: `
        bg-[#334155]
        hover:brightness-88
        active:scale-95
        transition-all
        duration-200
        text-white
        shadow-sm
    `,
        title: 'Restart this task'
    }
};

// Keyed by the *new* status so the message describes what just happened, not what it was before
export const STATUS_MESSAGES = {
    [TASK_STATUS.IN_PROGRESS]: 'Task started',
    [TASK_STATUS.COMPLETED]: 'Task completed',
    [TASK_STATUS.PENDING]: 'Task restarted'
};

/**
 * Returns the next status in the workflow cycle.
 * Falls back to IN_PROGRESS for unrecognized values to handle null/unexpected API responses gracefully.
 */
export const getNextStatus = (currentStatus) => {
    const normalized = currentStatus?.toLowerCase();
    return STATUS_TRANSITIONS[normalized] || TASK_STATUS.IN_PROGRESS;
};
