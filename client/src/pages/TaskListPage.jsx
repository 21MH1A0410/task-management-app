// The main task dashboard. All filter, sort, and pagination state lives in the URL
// (driven by useTasks) so every view is deep-linkable and survives a hard refresh.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import TaskSkeleton from '../components/TaskSkeleton';
import ConfirmationModal from '../components/ConfirmationModal';
import { FaPlus, FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaTimes, FaSortAmountDown, FaSortAmountUp, FaCalendarDay, FaChevronDown, FaClock, FaCheckCircle, FaSpinner as FaSpinnerStatic, FaChartPie } from 'react-icons/fa';
import { useTasks } from '../hooks/useTasks';

// --- Helper Components ---

const Dropdown = ({ value, options, onChange, align = 'left', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const currentOption = options.find(opt => opt.id === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        // mousedown fires before blur so we can close the dropdown before focus shifts elsewhere
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-10 px-3 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-standard whitespace-nowrap shadow-sm"
            >
                <span className="flex items-center gap-2 overflow-hidden">
                    <span className="text-blue-500 shrink-0">{currentOption?.icon}</span>
                    <span className="truncate">{currentOption?.label}</span>
                </span>
                <FaChevronDown className={`w-3 h-3 ml-1 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0 sm:right-0'} mt-2 w-full sm:w-56 origin-top bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-1 animate-in fade-in zoom-in duration-200`}>
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                            className={`flex items-center w-full px-4 py-3 text-sm transition-colors ${value === option.id
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`mr-3 ${value === option.id ? 'text-blue-600' : 'text-gray-400'}`}>
                                {option.icon}
                            </span>
                            {option.label}
                            {value === option.id && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const TaskListPage = () => {
    const {
        tasks,
        loading,
        deleting,
        transitioning,
        page,
        totalPages,
        filters,
        setPage,
        updateFilters,
        updateTaskStatus,
        deleteTask,
        createTask,
        updateTask,
        deleteTasksByStatus,
        searchParams,
        setSearchParams,
        clearFilters
    } = useTasks();


    // isInitialLoad prevents the inline "Updating..." spinner from flashing on first load.
    // We only want it to appear on subsequent background fetches, not the very first one.
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (!loading && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [loading, isInitialLoad]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [search, setSearch] = useState(filters.search || '');

    const sortOptions = [
        { id: 'newest', label: 'Newest first', icon: <FaSortAmountDown className="w-3 h-3" /> },
        { id: 'oldest', label: 'Oldest first', icon: <FaSortAmountUp className="w-3 h-3" /> },
        { id: 'dueDate', label: 'Due Date', icon: <FaCalendarDay className="w-3 h-3" /> },
    ];

    const filterOptions = [
        { id: 'All', label: 'All Tasks', icon: <FaFilter className="w-3 h-3" /> },
        { id: 'Pending', label: 'Pending', icon: <FaClock className="w-3 h-3" /> },
        { id: 'In Progress', label: 'In Progress', icon: <FaSpinnerStatic className="w-3 h-3 animate-spin" /> },
        { id: 'Completed', label: 'Completed', icon: <FaCheckCircle className="w-3 h-3" /> },
    ];

    // Convert the URL-friendly 'in-progress' format back to 'In Progress' for Dropdown matching.
    // The URL uses lowercase-hyphen because query strings don't handle spaces well.
    const filter = filters.status
        ? filters.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : 'All';

    const currentSortBy = filters.sortBy === 'dueDate' ? 'dueDate' : (filters.order === 'asc' ? 'oldest' : 'newest');
    const currentSortOption = sortOptions.find(opt => opt.id === currentSortBy) || sortOptions[0];
    const currentFilterOption = filterOptions.find(opt => opt.id === filter) || filterOptions[0];

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        confirmText: 'Delete',
        onConfirm: () => { }
    });

    const openConfirmation = useCallback(({ title, message, type = 'danger', onConfirm, confirmText = 'Delete' }) => {
        setConfirmation({ isOpen: true, title, message, type, onConfirm, confirmText });
    }, []);

    const closeConfirmation = useCallback(() => {
        setConfirmation(prev => ({ ...prev, isOpen: false }));
    }, []);

    // We keep a separate local `search` state for the input so every keystroke doesn't
    // fire a URL update and re-fetch. The debounce commits it to the URL after 300ms of quiet.
    useEffect(() => {
        const handler = setTimeout(() => {
            if (search.trim() !== (filters.search || '')) {
                updateFilters({ search: search.trim() });
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [search, filters.search, updateFilters]);

    // If "Clear all filters" resets the URL search param, reflect that in the local input too.
    // Without this, the input box would still show stale text even though the filter is cleared.
    useEffect(() => {
        if (!filters.search && search) {
            setSearch('');
        }
    }, [filters.search]);

    const handleSortChange = useCallback((newSort) => {
        if (newSort === 'newest') {
            updateFilters({ sortBy: 'createdAt', order: 'desc' });
        } else if (newSort === 'oldest') {
            updateFilters({ sortBy: 'createdAt', order: 'asc' });
        } else if (newSort === 'dueDate') {
            updateFilters({ sortBy: 'dueDate', order: 'asc' });
        }
    }, [updateFilters]);

    const handleFilterChange = useCallback((status) => {
        const statusValue = status === 'All' ? undefined : status.toLowerCase().replace(' ', '-');
        updateFilters({ status: statusValue });
    }, [updateFilters]);

    // Scroll back to the top when the page changes so users always start at the
    // top of the results, rather than mid-list from their previous page position
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleAddTask = useCallback(() => {
        setCurrentTask(null);
        setIsModalOpen(true);
    }, []);

    const handleEditTask = useCallback((task) => {
        setCurrentTask(task);
        setIsModalOpen(true);
    }, []);

    const handleDeleteTask = useCallback((id) => {
        // Deletion with Undo is fully handled inside useTasks — this wrapper
        // exists to give TaskItem a stable callback reference via useCallback
        deleteTask(id);
    }, [deleteTask]);



    const handleSaveTask = useCallback(async (taskData) => {
        if (currentTask) {
            await updateTask(currentTask._id, taskData);
        } else {
            await createTask(taskData);
        }
        setIsModalOpen(false);
    }, [currentTask, updateTask, createTask]);

    const handleClearCompleted = useCallback(() => {
        openConfirmation({
            title: 'Clear Completed Tasks',
            message: 'Are you sure you want to delete all completed tasks? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Clear',
            onConfirm: () => {
                deleteTasksByStatus('completed');
                closeConfirmation();
            }
        });
    }, [openConfirmation, closeConfirmation, deleteTasksByStatus]);



    return (
        <>
            <Helmet>
                <title>My Tasks | Task Manager</title>
            </Helmet>
            <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Tasks</h1>
                            {loading && !isInitialLoad && (
                                <div className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md animate-in fade-in">
                                    <FaSpinnerStatic className="animate-spin mr-1.5 w-3 h-3" />
                                    Updating...
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-gray-500 text-sm">Manage your tasks and stay organized.</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <button
                            onClick={handleAddTask}
                            className="flex-1 sm:flex-none h-10 inline-flex items-center justify-center gap-1.5 px-4 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer hover:opacity-90 focus-ring shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                        >
                            <FaPlus className="text-[10px]" />
                            New Task
                        </button>

                        {/* Clear Completed Button */}
                        <button
                            onClick={handleClearCompleted}
                            disabled={deleting}
                            className={`flex-1 sm:flex-none h-10 inline-flex items-center justify-center gap-1.5 px-4 text-xs font-bold rounded-xl transition-all shadow-sm focus-ring active:scale-95 whitespace-nowrap ${deleting
                                ? 'bg-red-50 text-red-300 cursor-not-allowed'
                                : 'bg-white text-red-600 border border-gray-200 hover:bg-red-50 hover:border-red-100 cursor-pointer hover:opacity-90'
                                }`}
                        >
                            <FaTimes className="text-[10px]" />
                            {deleting ? 'Clearing...' : 'Clear Completed'}
                        </button>
                    </div>
                </div>

                {/* Adjusted Control Bar - Optimized for Mobile Side-by-Side */}
                <div className="mb-8 flex flex-col gap-4">
                    {/* Search - Always full width */}
                    <div className="relative group w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-4 h-10 border border-gray-200 rounded-xl bg-white focus-ring transition-all text-xs shadow-sm placeholder:font-normal"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sort & Filter Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Side-by-Side Dropdowns on Mobile */}
                        <div className="flex flex-row gap-2 w-full sm:w-auto">
                            <Dropdown
                                value={currentSortBy}
                                options={sortOptions}
                                onChange={handleSortChange}
                                align="left"
                                className="flex-1 sm:w-48"
                            />
                            <Dropdown
                                value={filter}
                                options={filterOptions}
                                onChange={handleFilterChange}
                                align="right"
                                className="flex-1 md:hidden"
                            />
                        </div>

                        {/* Filter Pills - Tablet & Desktop only */}
                        <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x flex-1 min-w-0 h-10">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleFilterChange(option.id)}
                                    className={`h-full px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-2 cursor-pointer active:scale-95 ${filter === option.id
                                        ? 'bg-blue-600 text-white shadow-md border-blue-600'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:opacity-90'
                                        }`}
                                >
                                    <span className={filter === option.id ? 'text-white' : 'text-blue-500'}>
                                        {option.icon}
                                    </span>
                                    <span>
                                        {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Task Grid */}
                {(loading || isInitialLoad) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 items-stretch">
                        {[...Array(12)].map((_, i) => (
                            <TaskSkeleton key={i} />
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mx-4 sm:mx-0 text-center">
                        {(search || filter !== 'All') ? (
                            <>
                                <div className="mx-auto h-20 w-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                    <FaSearch size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto px-6 leading-relaxed">
                                    We couldn't find any tasks matching your current filters. Try adjusting your search criteria.
                                </p>
                                <button
                                    onClick={() => { setSearch(''); clearFilters(); }}
                                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-2xl hover:bg-gray-50 hover:opacity-90 cursor-pointer active:scale-95 focus-ring transition-standard shadow-sm"
                                >
                                    Clear all filters
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <FaChartPie size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto px-6 leading-relaxed">
                                    You don't have any active tasks on your plate right now. Ready to tackle a new project?
                                </p>
                                <button
                                    onClick={handleAddTask}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 cursor-pointer hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/30 focus-ring transition-standard hover:scale-[1.02]"
                                >
                                    Create New Task
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 items-stretch">
                        {tasks.map((task) => (
                            transitioning[task._id] === 'deleting' ? (
                                <TaskSkeleton key={`skeleton-${task._id}`} />
                            ) : (
                                <TaskItem
                                    key={task._id}
                                    task={task}
                                    onStatusTransition={updateTaskStatus}
                                    onDelete={handleDeleteTask}
                                    onEdit={handleEditTask}
                                    isTransitioning={transitioning[task._id] === 'status'}
                                    searchTerm={search}
                                />
                            )
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {
                    totalPages > 1 && (
                        <div className="mt-12 flex justify-center items-center gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-3 text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-standard focus-ring"
                                aria-label="Previous page"
                            >
                                <FaChevronLeft />
                            </button>
                            <span className="text-sm font-medium text-gray-700">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-3 text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-standard focus-ring"
                                aria-label="Next page"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )
                }

                {/* Progress breakdown — only shown in "All tasks" view to keep the stat meaningful.
                An IIFE here avoids introducing extra state just to calculate these numbers. */}
                {!loading && tasks.length > 0 && !filters.status && (() => {
                    const total = tasks.length;
                    const pending = tasks.filter(t => t.status.toLowerCase() === 'pending').length;
                    const inProgress = tasks.filter(t => t.status.toLowerCase() === 'in-progress').length;
                    const completed = tasks.filter(t => t.status.toLowerCase() === 'completed').length;

                    const stats = [
                        { label: 'Pending', count: pending, color: '#334155', pct: (pending / total) * 100, filterKey: 'pending' },
                        { label: 'In Progress', count: inProgress, color: '#155dfc', pct: (inProgress / total) * 100, filterKey: 'in-progress' },
                        { label: 'Completed', count: completed, color: '#3CB371', pct: (completed / total) * 100, filterKey: 'completed' }
                    ];

                    return (
                        <div className="mt-8 mb-4 w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
                            {/* Clear, Simple Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Progress Overview
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {Math.round(stats[2].pct)}% completed
                                    </p>
                                </div>

                                <span className="text-xs font-medium text-slate-500">
                                    {total} Tasks
                                </span>
                            </div>

                            {/* Each segment is a button — clicking filters the list to that status */}
                            <div className="group relative h-2.5 w-full bg-slate-200/60 rounded-full overflow-hidden flex">
                                {stats.map((stat) => stat.pct > 0 && (
                                    <button
                                        key={stat.label}
                                        onClick={() => updateFilters({ status: stat.filterKey })} // URL-synced filtering 
                                        className="h-full transition-all duration-500 hover:brightness-110 cursor-pointer hover:opacity-90 focus:outline-none first:rounded-l-full last:rounded-r-full"
                                        style={{
                                            width: `${stat.pct}%`,
                                            background: `linear-gradient(to right, ${stat.color}, ${stat.color}dd)`
                                        }}
                                        title={`Filter by ${stat.label}`}
                                    />
                                ))}
                            </div>

                            {/* Simple Legend */}
                            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                                {stats.map((stat) => (
                                    <button
                                        key={stat.label}
                                        onClick={() => updateFilters({ status: stat.filterKey })} // URL-synced filtering 
                                        className="flex items-center gap-2 group transition-all active:scale-95 hover:opacity-90 cursor-pointer focus:outline-none"
                                    >
                                        <div className="w-2 h-2 rounded-full shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: stat.color }} />
                                        <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                                            {stat.label}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800">
                                            {stat.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Modals */}
                <TaskForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTask}
                    taskToEdit={currentTask}
                />

                <ConfirmationModal
                    isOpen={confirmation.isOpen}
                    onClose={closeConfirmation}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                    type={confirmation.type}
                    confirmText={confirmation.confirmText}
                    isLoading={deleting}
                />
            </div>
        </>
    );
};

export default TaskListPage;
