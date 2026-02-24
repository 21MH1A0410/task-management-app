import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaInfoCircle,
    FaExclamationTriangle,
    FaTimes,
    FaUserCheck,
    FaPlusCircle,
    FaTasks,
    FaUndo
} from 'react-icons/fa';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// Cap the visible queue to prevent the screen from flooding during bulk operations
const TOAST_LIMIT = 3;

const getIcon = (type) => {
    switch (type) {
        case 'success': return <FaCheckCircle className="w-5 h-5 text-emerald-500" />;
        case 'error': return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
        case 'warning': return <FaExclamationTriangle className="w-5 h-5 text-amber-500" />;
        case 'undo': return <FaUndo className="w-5 h-5 text-amber-500" />;
        case 'auth': return <FaUserCheck className="w-5 h-5 text-indigo-500" />;
        case 'task-add': return <FaPlusCircle className="w-5 h-5 text-blue-500" />;
        case 'task-update': return <FaTasks className="w-5 h-5 text-blue-600" />;
        case 'info':
        default: return <FaInfoCircle className="w-5 h-5 text-blue-500" />;
    }
};

const ToastItem = ({ toast, onClose }) => {
    const [progress, setProgress] = useState(100);
    const [isHovered, setIsHovered] = useState(false);
    const duration = toast.duration || 2000;

    const remainingTimeRef = useRef(duration);
    const lastTimeRef = useRef(performance.now());
    // Ref mirrors state so the rAF callback reads the latest hover value
    // without being recreated on every re-render (stale closure avoidance)
    const isHoveredRef = useRef(false);
    const prevDurationRef = useRef(duration);

    // When updateToast changes the duration (e.g. undo countdown), reset the timer
    useEffect(() => {
        if (prevDurationRef.current !== duration) {
            remainingTimeRef.current = duration;
            prevDurationRef.current = duration;
        }
    }, [duration]);

    const [swipeOffset, setSwipeOffset] = useState(0);
    const startXRef = useRef(null);
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(toast.id);
            if (toast.onClose) toast.onClose();
        }, 300);
    }, [toast, onClose]);

    // rAF gives sub-frame accuracy for the progress bar and pauses correctly on hover
    // so the user has time to act on the toast (e.g. click Undo).
    // setInterval would throttle to ~1fps when the tab is backgrounded.
    useEffect(() => {
        if (duration === Infinity) return;

        let animationFrameId;

        const animate = (time) => {
            const delta = time - lastTimeRef.current;
            lastTimeRef.current = time;

            if (!isHoveredRef.current) {
                remainingTimeRef.current -= delta;
                const newProgress = Math.max(0, (remainingTimeRef.current / duration) * 100);
                setProgress(newProgress);

                if (remainingTimeRef.current <= 0) {
                    handleClose();
                    return;
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        lastTimeRef.current = performance.now();
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [duration, handleClose]);

    const handleTouchStart = (e) => {
        startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (startXRef.current === null) return;
        const currentX = e.touches[0].clientX;
        const diffX = currentX - startXRef.current;
        // Rightward swipes only — leftward feels accidental and has no affordance
        if (diffX > 0) {
            setSwipeOffset(diffX);
        }
    };

    const handleTouchEnd = () => {
        // 80px threshold distinguishes a deliberate dismiss from an accidental nudge
        if (swipeOffset > 80) {
            handleClose();
        } else {
            setSwipeOffset(0);
        }
        startXRef.current = null;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    };

    const baseClasses = "pointer-events-auto flex flex-col w-full sm:max-w-sm bg-white rounded-xl shadow-xl border border-gray-100/80 overflow-hidden transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/50";

    // Exit direction matches container position: top on mobile, right on desktop
    const animationClasses = isExiting
        ? "opacity-0 sm:translate-x-full -translate-y-full sm:translate-y-0"
        : "animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-8 sm:slide-in-from-bottom-0 zoom-in-95";

    return (
        <div
            className={`${baseClasses} ${animationClasses}`}
            style={{
                transform: swipeOffset > 0 && !isExiting ? `translateX(${swipeOffset}px)` : undefined,
                opacity: swipeOffset > 0 && !isExiting ? 1 - swipeOffset / 300 : undefined
            }}
            onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') {
                    setIsHovered(true);
                    isHoveredRef.current = true;
                }
            }}
            onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') {
                    setIsHovered(false);
                    isHoveredRef.current = false;
                }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="status"
            aria-live="polite"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <div className="flex items-center w-full p-3 sm:p-4 gap-3">
                <div className="flex-shrink-0">
                    {getIcon(toast.type)}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 leading-snug line-clamp-2">{toast.message}</p>
                </div>

                {toast.actions && toast.actions.length > 0 && (
                    <div className="flex-shrink-0 flex gap-2">
                        {toast.actions.map((act, i) => (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    act.onClick();
                                    handleClose();
                                }}
                                className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm whitespace-nowrap"
                            >
                                {act.icon === 'undo' && <span className="flex items-center justify-center"><FaUndo className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></span>}
                                {act.icon && act.icon !== 'undo' && <span className="flex items-center justify-center">{act.icon}</span>}
                                {act.label}
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClose();
                    }}
                    className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                    aria-label="Close notification"
                    tabIndex={0}
                >
                    <FaTimes className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
            </div>

            {/* Progress bar hidden for Infinity-duration toasts (e.g. Undo) that require manual dismiss */}
            {duration !== Infinity && (
                <div className="h-[2px] w-full bg-gray-50">
                    <div
                        className={`h-full opacity-80 ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' || toast.type === 'undo' ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%`, transition: isHovered ? 'none' : 'width 10ms linear' }}
                    />
                </div>
            )}
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    // Deduplicates toasts within a 2s window — optimistic mutations often fire the same
    // notification from both the UI update and the API response in rapid succession
    const recentToastsRef = useRef({});

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', options = {}) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 5);

        const dedupKey = `${message}-${type}`;
        const now = Date.now();
        if (recentToastsRef.current[dedupKey] && (now - recentToastsRef.current[dedupKey] < 2000)) {
            return id;
        }
        recentToastsRef.current[dedupKey] = now;

        // Prune keys older than 5s so the ref doesn't grow unbounded in long sessions
        Object.keys(recentToastsRef.current).forEach(key => {
            if (now - recentToastsRef.current[key] > 5000) delete recentToastsRef.current[key];
        });

        // Accept both `action: {}` (single) and `actions: []` (multiple) for caller convenience
        let actions = options.actions || [];
        if (options.action) {
            actions = [options.action];
        }

        const newToast = {
            id,
            message,
            type,
            duration: options.duration !== undefined ? options.duration : 2500,
            actions,
            onClose: options.onClose
        };

        setToasts(prev => [...prev, newToast]);

        return id;
    }, []);

    const updateToast = useCallback((id, updates) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    // Slice at render time rather than on add so TOAST_LIMIT doesn't evict
    // toasts that are still mid-exit animation
    const visibleToasts = toasts.slice(0, TOAST_LIMIT);

    return (
        <ToastContext.Provider value={{ showToast, removeToast, updateToast }}>
            {children}
            <div className="fixed z-[60] flex flex-col gap-2 sm:gap-3 pointer-events-none w-[90%] sm:w-auto left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto top-20 sm:top-auto sm:bottom-4 px-0 sm:right-4 items-center sm:items-end">
                {visibleToasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
