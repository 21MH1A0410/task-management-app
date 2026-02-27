import React from 'react';
import { TASK_STATUS } from '../constants/status';

const MockTaskCard = ({ task, isActive = false, progressOverride, forceStrike = false }) => {
    const isCompleted = forceStrike || task.status === TASK_STATUS.COMPLETED;
    const isInProgress = !isCompleted && task.status === TASK_STATUS.IN_PROGRESS;

    const cardBg = isCompleted ? 'bg-slate-50/90 border-slate-200/40 opacity-70 scale-100'
        : isActive ? 'bg-white border-blue-400 shadow-2xl shadow-blue-500/20 scale-100 ring-2 ring-blue-500/30'
        : isInProgress ? 'bg-white border-blue-200/60 shadow-xl shadow-blue-500/10 scale-100 ring-1 ring-blue-500/20'
            : 'bg-white/95 border-slate-200/60 shadow-sm scale-100';

    // Pure CSS transition for progress bar (no JS interval)
    const progressWidth = isCompleted ? '100%' : progressOverride !== undefined ? `${progressOverride}%` : isInProgress ? '85%' : '0%';
    const progressText = isCompleted ? '100%' : progressOverride !== undefined ? `${Math.round(progressOverride)}%` : isInProgress ? 'In Progress' : '0%';
    const progressDuration = progressOverride !== undefined ? 'duration-[2000ms]' : isInProgress ? 'duration-[4000ms]' : 'duration-500';

    return (
        <div className={`group relative overflow-hidden rounded-2xl p-4 border transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:z-30 cursor-default ${cardBg} ${task.justCompleted ? 'animate-pop animate-satisfaction-glow' : ''}`}>

            {/* Light Sweep (Luxury SaaS Touch) */}
            {isInProgress && (
                <div className="absolute inset-0 z-0 animate-shimmer pointer-events-none" />
            )}

            <div className="flex justify-between items-center mb-3 relative z-10">
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-widest transition-colors duration-500
                    ${isCompleted ? 'bg-slate-100/50 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                    {task.category}
                </span>

                <div className="flex -space-x-1.5 opacity-90 relative z-10">
                    {task.avatars.map((color, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full ${color} border-2 border-white shadow-sm flex items-center justify-center`}>
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/5 to-transparent"></div>
                        </div>
                    ))}
                </div>
            </div>

            <h4 className={`text-sm font-bold leading-tight mb-3 transition-colors duration-500 relative z-10 font-display ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {task.title}
            </h4>

            <div className="flex items-center justify-between mt-auto relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 
                        ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}
                    />
                    <span className={`text-[10px] font-semibold transition-colors duration-500
                        ${isCompleted ? 'text-emerald-600' : isInProgress ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        {isCompleted ? 'Done' : isInProgress ? 'In Progress' : 'Todo'}
                    </span>
                </div>

                <span className={`text-[10px] font-bold transition-colors duration-500 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                    {progressText}
                </span>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-100/30 z-10">
                <div
                    className={`h-full transition-all ease-out ${progressDuration} ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: progressWidth, willChange: 'width' }}
                />
            </div>
        </div>
    );
};

export default MockTaskCard;
