import React, { useState, useEffect, useRef } from 'react';
import { TASK_STATUS } from '../constants/status';
import MockTaskCard from './MockTaskCard';

// 14 distinct, highly realistic SaaS/development tasks
const INITIAL_TASKS = [
    { _id: 'm1', title: 'Review Client Feedback for MVP', category: 'Product', stat: '8/10', avatars: ['bg-blue-400', 'bg-emerald-400'], status: TASK_STATUS.COMPLETED },
    { _id: 'm2', title: 'Fix Auth Route Flashing', category: 'Engineering', stat: '2/3', avatars: ['bg-rose-400'], status: TASK_STATUS.IN_PROGRESS },
    { _id: 'm3', title: 'Write Core API Docs', category: 'Engineering', stat: '0/5', avatars: ['bg-amber-400', 'bg-indigo-400'], status: TASK_STATUS.PENDING },
    { _id: 'm4', title: 'Design System Typography', category: 'Design', stat: '1/4', avatars: ['bg-purple-400'], status: TASK_STATUS.PENDING },
    { _id: 'm5', title: 'Migrate to Postgres', category: 'DevOps', stat: '12/12', avatars: ['bg-slate-400', 'bg-blue-400'], status: TASK_STATUS.IN_PROGRESS },
    { _id: 'm6', title: 'Optimize Hero Layout', category: 'Design', stat: 'In Review', avatars: ['bg-emerald-400'], status: TASK_STATUS.PENDING },
    { _id: 'm7', title: 'Create Q3 Marketing Assets', category: 'Marketing', stat: '0/8', avatars: ['bg-pink-400', 'bg-rose-400'], status: TASK_STATUS.PENDING },
    { _id: 'm8', title: 'Investigate Memory Leak', category: 'Engineering', stat: 'Priority', avatars: ['bg-red-500'], status: TASK_STATUS.IN_PROGRESS },
    { _id: 'm9', title: 'Bump React & Tailwind', category: 'Engineering', stat: 'Approved', avatars: ['bg-cyan-400'], status: TASK_STATUS.COMPLETED },
    { _id: 'm10', title: 'Draft Release Notes', category: 'Product', stat: 'Drafting', avatars: ['bg-orange-400'], status: TASK_STATUS.PENDING },
    { _id: 'm11', title: 'Profile Picture Uploads', category: 'Engineering', stat: '5/5', avatars: ['bg-teal-400', 'bg-emerald-400'], status: TASK_STATUS.IN_PROGRESS },
];
const HeroInteractiveDemo = () => {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [mobileIndex, setMobileIndex] = useState(0);
    const [mobilePhase, setMobilePhase] = useState(0); // 0:Idle, 1:Highlight, 2:Progress+Strike, 3:Exit Shrink
    const containerRef = useRef(null);
    const windowRef = useRef(null);
    const glowRef = useRef(null);
    const contentRef = useRef(null);

    // Advanced Animation Memory
    const animationMemory = useRef({
        history: [],               // last 5 global actions
        taskCooldowns: {},         // per-task cooldown
        burstMode: false,          // productivity burst flag
        burstCount: 0,             // burst completion counter
        cycleCount: 0              // global cycle tracker
    });

    const pickNextStatus = (task) => {
        const memory = animationMemory.current;
        const recent = memory.history.slice(-2);

        const lastTwoCompleted =
            recent.length === 2 &&
            recent.every(s => s === TASK_STATUS.COMPLETED);

        memory.cycleCount++;

        // Trigger burst occasionally
        if (!memory.burstMode && memory.cycleCount % 8 === 0) {
            memory.burstMode = true;
            memory.burstCount = 0;
        }

        // BURST MODE (exactly 3 completions)
        if (memory.burstMode) {
            if (task.status === TASK_STATUS.IN_PROGRESS && memory.burstCount < 3) {
                memory.burstCount++;
                memory.history.push(TASK_STATUS.COMPLETED);
                if (memory.burstCount >= 3) {
                    memory.burstMode = false;
                }
                return TASK_STATUS.COMPLETED;
            }
        }

        // Prevent 3 consecutive completions (hard rule)
        if (lastTwoCompleted) {
            return TASK_STATUS.IN_PROGRESS;
        }

        // Cooldown protection
        if (memory.taskCooldowns[task._id]) {
            return TASK_STATUS.IN_PROGRESS;
        }

        // Natural progression logic
        if (task.status === TASK_STATUS.PENDING) {
            return TASK_STATUS.IN_PROGRESS;
        }

        if (task.status === TASK_STATUS.IN_PROGRESS) {
            if (Math.random() > 0.5) {
                memory.taskCooldowns[task._id] = 4;
                memory.history.push(TASK_STATUS.COMPLETED);
                return TASK_STATUS.COMPLETED;
            }
        }

        if (task.status === TASK_STATUS.COMPLETED) {
            if (Math.random() > 0.7) {
                return TASK_STATUS.PENDING;
            }
        }

        return TASK_STATUS.IN_PROGRESS;
    };

    // Elite Multi-Layer Parallax Track (Staggered Depth Version)
    useEffect(() => {
        // Skip heavy 3D engine on mobile completely
        if (window.innerWidth < 768) return;

        let frame;
        let targetX = 0;
        let targetY = 0;

        // Independent inertia trackers for staggered depth
        let bgX = 0, bgY = 0;
        let winX = 0, winY = 0;
        let contentX = 0, contentY = 0;

        const TRANSLATE_MAX_X = 20;
        const TRANSLATE_MAX_Y = 20;

        const handleMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // Normalize mouse position from -0.5 to 0.5
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            targetX = Number((x * TRANSLATE_MAX_X).toFixed(2));
            targetY = Number((y * TRANSLATE_MAX_Y).toFixed(2));
        };

        const handleLeave = () => {
            targetX = 0;
            targetY = 0;
        };

        const animate = () => {
            // Background is heavy and slow (0.03 interpolation)
            bgX += (targetX - bgX) * 0.10;
            bgY += (targetY - bgY) * 0.10;

            // Window/Container is medium weight (0.05 interpolation)
            winX += (targetX - winX) * 0.15;
            winY += (targetY - winY) * 0.15;

            // Content is fast and reactive (0.08 interpolation)
            contentX += (targetX - contentX) * 0.18;
            contentY += (targetY - contentY) * 0.18;

            if (containerRef.current) containerRef.current.style.transform = `scale(1)`;

            // 1. Background Glow (Slowest, widest movement)
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${bgX * -40}px, ${bgY * -40}px)`;
            }

            // 2. Glass Window (Subtle, contained movement, moves the entire block)
            if (windowRef.current) {
                windowRef.current.style.transform = `translate(${winX * 8}px, ${winY * 8}px)`;
            }

            // 3. Task Content (2D TRANSLATION ONLY - NO 3D ROTATION)
            // By completely avoiding rotateX/rotateY, the browser never rasterizes the 
            // text layer into a texture, guaranteeing it stays 100% naturally sharp.
            if (contentRef.current) {
                contentRef.current.style.transform = `
                    translateX(${contentX * -0.6}px)
                    translateY(${contentY * -0.6}px)
                `;
            }

            frame = requestAnimationFrame(animate);
        };

        animate();
        if (containerRef.current) {
            containerRef.current.addEventListener("mousemove", handleMove);
            containerRef.current.addEventListener("mouseleave", handleLeave);
        }
        
        return () => {
            if (containerRef.current) {
                containerRef.current.removeEventListener("mousemove", handleMove);
                containerRef.current.removeEventListener("mouseleave", handleLeave);
            }
            cancelAnimationFrame(frame);
        };
    }, []);

    // Smart Activity Stack Sequence (Mobile)
    useEffect(() => {
        if (window.innerWidth >= 768) return;
        let isMounted = true;
        let timeout;

        const runCycle = () => {
            if (!isMounted) return;
            setMobilePhase(0); // Idle
            timeout = setTimeout(() => {
                if (!isMounted) return;
                setMobilePhase(1); // Highlight
                timeout = setTimeout(() => {
                    if (!isMounted) return;
                    setMobilePhase(2); // Fill progress & check
                    timeout = setTimeout(() => {
                        if (!isMounted) return;
                        setMobilePhase(3); // Fold/Shrink
                        timeout = setTimeout(() => {
                            if (!isMounted) return;
                            setMobileIndex(prev => (prev + 1) % tasks.length);
                            runCycle();
                        }, 800); // match 800ms animation duration
                    }, 1400); // match text/progress duration
                }, 400);
            }, 1500);
        };

        runCycle();

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [tasks.length]);

    // Staggered Task Lifecycle Logic (Advanced Rhythm Version)
    useEffect(() => {
        // Skip animation cycle completely on mobile sizes
        if (window.innerWidth < 768) return;

        const interval = setInterval(() => {
            // Pause animation when page is hidden to save memory and CPU
            if (document.hidden) return;

            setTasks(current => {
                const newTasks = [...current];

                // Avoid picking task in cooldown
                const availableTasks = newTasks.filter(
                    t => !animationMemory.current.taskCooldowns[t._id]
                );

                if (availableTasks.length === 0) return current;

                const selectedTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
                const rIdx = newTasks.indexOf(selectedTask);
                const task = { ...newTasks[rIdx] };
                task.justCompleted = false;

                const nextStatus = pickNextStatus(task);

                if (nextStatus === TASK_STATUS.COMPLETED && task.status === TASK_STATUS.IN_PROGRESS) {
                    task.status = TASK_STATUS.COMPLETED;
                    task.justCompleted = true;
                } else if (nextStatus === TASK_STATUS.IN_PROGRESS && task.status === TASK_STATUS.PENDING) {
                    task.status = TASK_STATUS.IN_PROGRESS;
                } else if (nextStatus === TASK_STATUS.PENDING && task.status === TASK_STATUS.COMPLETED) {
                    task.status = TASK_STATUS.PENDING;
                }

                newTasks[rIdx] = task;
                return newTasks;
            });

            // Update Cooldowns
            Object.keys(animationMemory.current.taskCooldowns).forEach((id) => {
                animationMemory.current.taskCooldowns[id]--;
                if (animationMemory.current.taskCooldowns[id] <= 0) {
                    delete animationMemory.current.taskCooldowns[id];
                }
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const col1 = tasks.slice(0, 7);
    const col2 = tasks.slice(7, 14);

    const renderColumn = (columnTasks) => (
        <div className="flex flex-col gap-4 py-2">
            {columnTasks.map((task, i) => (
                <MockTaskCard key={task._id + i} task={task} />
            ))}
            {columnTasks.map((task, i) => (
                <MockTaskCard key={task._id + i + 'dup'} task={task} />
            ))}
        </div>
    );

    return (
        <div className="relative w-full h-[450px] md:h-full md:perspective-[3000px] select-none mt-4 md:mt-0">
            {/* Entry Animation Wrappers */}
            <div className="animate-fade-in-up transition-all duration-1000 h-full">

                {/* Desktop Version (Scrolling Marquee) */}
                <div className="hidden md:flex items-center justify-center h-full perspective-[3000px]">
                    {/* Layer 1: Background Glow (Slow Parallax) */}
                    <div
                        ref={glowRef}
                        className="absolute inset-x-[-10%] md:inset-x-[-40%] inset-y-[-10%] md:inset-y-[-30%] bg-gradient-to-tr from-blue-200/30 md:from-blue-200/20 via-indigo-100/20 md:via-indigo-100/10 to-transparent blur-[80px] md:blur-[120px] rounded-full pointer-events-none transition-transform duration-300 ease-out"
                    />

                    {/* Layer 2: Floating Particles (Desktop Only for Performance) */}
                    <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400/20 rounded-full blur-md animate-float-gpu" />
                        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-purple-400/20 rounded-full blur-md animate-float-gpu animation-delay-2000" />
                    </div>

                    {/* Layer 3: Main Glass Container - Responsively Scaled */}
                    <div
                        ref={containerRef}
                        className="relative z-10 w-full max-w-[340px] md:max-w-[500px] lg:max-w-[580px] aspect-[3/4] md:aspect-square transition-all duration-700 ease-out"
                    >
                        <div
                            ref={windowRef}
                            className="w-full h-full transition-transform duration-500 ease-out bg-white/40 md:bg-white/30 backdrop-blur-xl border border-white/60 rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col p-4 md:p-6 pb-0 relative overflow-hidden ring-1 ring-black/5"
                        >
                            {/* Dashboard Live Indicator */}
                            <div className="absolute top-4 md:top-6 right-4 md:right-8 z-30 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 rounded-full bg-white/60 md:bg-white/40 border border-white/60 shadow-sm backdrop-blur-md">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Live Workspace</span>
                            </div>

                            <div className="flex gap-1.5 absolute top-5 md:top-7 left-5 md:left-8 z-20 opacity-80 md:opacity-100">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400 md:bg-red-400/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 md:bg-amber-400/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 md:bg-emerald-400/80" />
                            </div>

                            <div className="flex justify-center border-b border-slate-200/40 pb-3 md:pb-4 mb-3 md:mb-4 mt-8 md:mt-10 shrink-0">
                                <div className="h-1.5 w-16 md:w-24 bg-slate-200/60 rounded-full" />
                            </div>

                            <div 
                                ref={contentRef} 
                                className="flex gap-3 md:gap-4 lg:gap-6 w-full flex-1 overflow-hidden transition-transform duration-700 ease-out [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)]"
                                style={{ transform: 'translateZ(0)', WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden' }}
                            >
                                <div className="flex flex-col animate-marquee-up-slow w-[48%] scale-95 md:scale-100 origin-top">{renderColumn(col1)}</div>
                                <div className="flex flex-col animate-marquee-down-slow w-[48%] -translate-y-[25%] scale-95 md:scale-100 origin-top">{renderColumn(col2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Version: Smart Activity Stack */}
                <div className="md:hidden flex flex-col w-full max-w-[360px] mx-auto mt-6 px-4 [mask-image:linear-gradient(to_bottom,black_75%,transparent)] h-[380px]">
                    {tasks.map((task, idx) => {
                        let relativeIndex = (idx - mobileIndex + tasks.length) % tasks.length;
                        if (relativeIndex > 3) return null; // Render max 4 items

                        const isTop = relativeIndex === 0;
                        const isHighlighting = isTop && mobilePhase >= 1;
                        const isProgressing = isTop && mobilePhase >= 2;
                        const isExiting = isTop && mobilePhase === 3;

                        return (
                            <div 
                                key={task._id}
                                className="w-full transition-all duration-[800ms] ease-in-out px-1"
                                style={{
                                    display: 'grid',
                                    gridTemplateRows: isExiting ? '0fr' : '1fr',
                                    opacity: isExiting ? 0 : 1,
                                    transform: isExiting ? 'translateY(-20px) scale(0.95)' : 'translateY(0) scale(1)',
                                }}
                            >
                                <div className="overflow-hidden">
                                    <div className="pb-4">
                                        <MockTaskCard 
                                            task={task} 
                                            isActive={isHighlighting}
                                            progressOverride={isProgressing ? 100 : undefined}
                                            forceStrike={isProgressing || isExiting}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default HeroInteractiveDemo;
