import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import taskService from '../services/taskService';
import { extractApiData, handleApiError } from '../utils/apiHelpers';
import { useToast } from '../context/ToastContext';
import { getNextStatus, STATUS_MESSAGES } from '../constants/status';

/**
 * Central state manager for task CRUD, pagination, and filtering.
 * All filter/page state is URL-driven so views are deep-linkable and survive hard refreshes.
 * Every mutation uses optimistic UI — the caller can trust the list updates instantly.
 */
export const useTasks = (initialFilters = {}) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [transitioning, setTransitioning] = useState({});
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast, updateToast } = useToast();
    const activeMutations = useRef(0);
    const fetchGen = useRef(0);          // Increments on every fetchTasks call; lets stale responses self-discard
    const pendingDeletions = useRef({}); // id → { task, toastId } — tracks undo candidates
    const undoDeleteRef = useRef(null);  // Ref so deleteTask's toast closure always invokes the latest undoDelete
    const pendingExcludeIds = useRef(new Set()); // IDs being optimistically removed, filtered out of parallel fetches

    const page = parseInt(searchParams.get('page')) || 1;
    const filters = useMemo(() => {
        const f = {};
        if (searchParams.get('status')) f.status = searchParams.get('status');
        if (searchParams.get('search')) f.search = searchParams.get('search');
        if (searchParams.get('sortBy')) f.sortBy = searchParams.get('sortBy');
        if (searchParams.get('order')) f.order = searchParams.get('order');
        return f;
    }, [searchParams]);

    // Updating page through the URL keeps the Back button in sync with pagination
    const setPage = useCallback((newPage) => {
        setSearchParams(prev => {
            const currentPage = parseInt(prev.get('page')) || 1;
            const typeofPage = typeof newPage === 'function' ? newPage(currentPage) : newPage;
            if (currentPage !== typeofPage) {
                setLoading(true);
            }
            if (typeofPage <= 1) {
                prev.delete('page');
            } else {
                prev.set('page', typeofPage.toString());
            }
            return prev;
        });
    }, [setSearchParams]);

    // Always reset to page 1 on filter change to avoid landing on an empty page
    // (e.g. user is on page 4, applies a filter that only has 2 pages of results)
    const updateFilters = useCallback((newFilters) => {
        setSearchParams(prev => {
            let hasChanges = false;
            Object.entries(newFilters).forEach(([key, value]) => {
                const prevValue = prev.get(key) || '';
                const newValue = value || '';
                if (prevValue !== newValue) {
                    hasChanges = true;
                    if (!value) {
                        prev.delete(key);
                    } else {
                        prev.set(key, value);
                    }
                }
            });

            if (hasChanges) {
                setLoading(true);
                prev.delete('page');
            }
            return prev;
        });
    }, [setSearchParams]);

    const clearFilters = useCallback(() => {
        setLoading(true);
        setSearchParams({});
    }, [setSearchParams]);

    const fetchTasks = useCallback(async (isSilent = false) => {
        // Stamp this invocation so any response that arrives after a newer fetch has started is dropped.
        const gen = ++fetchGen.current;
        let isAutoCorrecting = false;
        try {
            if (!isSilent) {
                setLoading(true);
            }

            const params = {
                page,
                limit: 12,
                ...filters
            };

            const response = await taskService.getTasks(params);

            // A newer fetchTasks call has already fired — discard this stale result
            if (gen !== fetchGen.current) return;

            if (response.meta) {
                const serverTotalPages = Math.max(1, response.meta.pages);
                setTotalPages(serverTotalPages);

                // If the user just deleted the last task on a non-first page, the server
                // reports fewer total pages — auto-correct by navigating back one page
                if (page > 1 && page > serverTotalPages) {
                    isAutoCorrecting = true;
                    setPage(serverTotalPages);
                    return;
                }
            }

            // Silent syncs skip setTasks if a mutation is in flight to avoid overwriting
            // optimistic UI. User-initiated fetches (filter/page change) always apply —
            // blocking those causes an empty-state flash bug.
            if (!isSilent || activeMutations.current === 0) {
                const excluded = pendingExcludeIds.current;
                const filtered = excluded.size > 0
                    ? (response.data || []).filter(t => !excluded.has(t._id))
                    : (response.data || []);
                setTasks(filtered);
            }

        } catch (err) {
            if (err.status !== 401) {
                showToast(handleApiError(err, 'Failed to fetch tasks'), 'error');
            }
        } finally {
            if (!isSilent && !isAutoCorrecting && gen === fetchGen.current) setLoading(false);
        }
    }, [page, filters, showToast, setPage]);

    // eslint-disable-next-line react-hooks/exhaustive-deps — adding fetchTasks causes an infinite loop
    useEffect(() => { fetchTasks(); }, [page, filters]);

    /**
     * Adds a task optimistically, then background-syncs to replace the temp entry
     * with the server-assigned ID so the UI never shows a stale or duplicate card.
     */
    const createTask = useCallback(async (taskData) => {
        const tempId = `temp-${Date.now()}`;
        const tempTask = { ...taskData, _id: tempId, createdAt: new Date().toISOString() };

        const matchesStatus = !filters.status || filters.status === tempTask.status;
        const matchesSearch = !filters.search || tempTask.title.toLowerCase().includes(filters.search.toLowerCase());
        const shouldShowOptimistically = matchesStatus && matchesSearch;

        const isSortNewest = !filters.sortBy || (filters.sortBy === 'createdAt' && filters.order !== 'asc');
        const isSortOldest = filters.sortBy === 'createdAt' && filters.order === 'asc';

        if (shouldShowOptimistically) {
            setTasks(prev => {
                if (isSortNewest && page === 1) {
                    return [tempTask, ...prev].slice(0, 12);
                } else if (isSortOldest && prev.length < 12) {
                    return [...prev, tempTask];
                }
                // Due Date sorting doesn't have a predictable insert position — skip optimistic render
                return prev;
            });
        }

        try {
            await taskService.createTask(taskData);
            await fetchTasks(true);
            showToast('Task created successfully', 'task-add');
            return null;
        } catch (err) {
            if (shouldShowOptimistically) {
                setTasks(prev => prev.filter(t => t._id !== tempId));
            }
            showToast(handleApiError(err, 'Failed to create task'), 'error');
            throw err;
        }
    }, [filters, page, fetchTasks, showToast]);

    /**
     * Updates a task optimistically. If the updated values no longer match the active filters
     * (e.g. status changed while filtering by status), removes the card immediately
     * rather than waiting for the background sync.
     */
    const updateTask = useCallback(async (id, taskData) => {
        const originalTasks = [...tasks];

        const incomingStatus = taskData.status || originalTasks.find(t => t._id === id)?.status;
        const incomingTitle = taskData.title || originalTasks.find(t => t._id === id)?.title || '';
        const matchesStatus = !filters.status || filters.status === incomingStatus;
        const matchesSearch = !filters.search || incomingTitle.toLowerCase().includes(filters.search.toLowerCase());
        const shouldShowOptimistically = matchesStatus && matchesSearch;

        if (shouldShowOptimistically) {
            setTasks(prev => prev.map(t => t._id === id ? { ...t, ...taskData } : t));
        } else {
            setTasks(prev => prev.filter(t => t._id !== id));
        }

        try {
            await taskService.updateTask(id, taskData);
            await fetchTasks(true);
            showToast('Task updated successfully', 'success');
            return null;
        } catch (err) {
            setTasks(originalTasks);
            showToast(handleApiError(err, 'Failed to update task'), 'error');
            throw err;
        }
    }, [tasks, filters, fetchTasks, showToast]);

    /**
     * Advances a task to its next status. Two paths depending on whether the task
     * stays visible after the transition:
     * - STAYS: activeMutations guard protects the optimistic state from background syncs
     * - LEAVES: PATCH and refetch run in parallel; excludeIds prevents the stale card reappearing
     */
    const updateTaskStatus = useCallback(async (id) => {
        const task = tasks.find(t => t._id === id);
        if (!task || transitioning[id]) return;

        const nextStatus = getNextStatus(task.status);
        const originalTasks = [...tasks];
        const matchesStatus = !filters.status || filters.status === nextStatus;

        if (matchesStatus) {
            activeMutations.current += 1;
            setTransitioning(prev => ({ ...prev, [id]: 'status' }));
            setTasks(prev => prev.map(t => t._id === id ? { ...t, status: nextStatus } : t));

            try {
                await taskService.patchTask(id, { status: nextStatus });
                showToast(STATUS_MESSAGES[nextStatus] || 'Status updated', 'task-update');
            } catch (err) {
                setTasks(originalTasks);
                showToast(handleApiError(err, 'Failed to update status'), 'error');
            } finally {
                setTransitioning(prev => ({ ...prev, [id]: false }));
                activeMutations.current -= 1;
                if (activeMutations.current === 0) fetchTasks(true);
            }
        } else {
            // Task leaves the current filter view — fire PATCH + refetch in parallel.
            // excludeIds ensures the stale card doesn't flash back from the early fetch result.
            pendingExcludeIds.current.add(id);
            setTasks(prev => prev.filter(t => t._id !== id));

            await Promise.allSettled([
                taskService.patchTask(id, { status: nextStatus }),
                fetchTasks(true)
            ]);

            pendingExcludeIds.current.delete(id);

            try {
                showToast(STATUS_MESSAGES[nextStatus] || 'Status updated', 'task-update');
                await fetchTasks(true);
            } catch (err) {
                setTasks(originalTasks);
                showToast(handleApiError(err, 'Failed to update status'), 'error');
            }
        }
    }, [tasks, transitioning, filters, fetchTasks, showToast]);

    /**
     * Deletes a task immediately (committed to DB right away so a hard refresh always reflects truth).
     * Shows a 6-second Undo toast — clicking it calls undoDelete to restore the task.
     */
    const deleteTask = useCallback(async (id) => {
        const taskToDelete = tasks.find(t => t._id === id);
        if (!taskToDelete) return;

        // Check before touching state: if this is the last item on a non-first page,
        // show a skeleton immediately so the empty state never flashes
        const isLastOnNonFirstPage = tasks.length === 1 && page > 1;
        if (isLastOnNonFirstPage) {
            setLoading(true);
        }

        setTasks(prev => prev.filter(task => task._id !== id));

        try {
            await taskService.deleteTask(id);
        } catch (err) {
            if (isLastOnNonFirstPage) setLoading(false);
            setTasks(prev => [taskToDelete, ...prev]);
            showToast(handleApiError(err, 'Failed to delete task'), 'error');
            return;
        }

        if (isLastOnNonFirstPage) {
            setPage(page - 1);
        } else {
            // Pull in the next item from page 2 (or update the total count on the last page)
            await fetchTasks(true);
        }

        pendingDeletions.current[id] = { task: taskToDelete, toastId: null };

        // undoDeleteRef.current is used instead of a direct reference so the toast action
        // always calls the latest version of undoDelete, avoiding a stale closure
        const toastId = showToast(`"${taskToDelete.title}" deleted.`, 'warning', {
            duration: 6000,
            actions: [{
                label: 'Undo',
                icon: 'undo',
                onClick: () => undoDeleteRef.current?.(id)
            }]
        });

        pendingDeletions.current[id].toastId = toastId;
    }, [tasks, page, setPage, fetchTasks, showToast]);

    /**
     * Reverses a soft-delete. Does not use optimistic UI — the server determines
     * exactly where the restored task lands in pagination, so we wait for the response.
     */
    const undoDelete = useCallback(async (id) => {
        const pending = pendingDeletions.current[id];
        if (!pending) return;

        delete pendingDeletions.current[id];

        const currentPage = page;

        try {
            await taskService.restoreTask(id);

            const response = await taskService.getTasks({ page: currentPage, limit: 12, ...filters });
            const serverTotalPages = Math.max(1, response.meta?.pages || 1);

            setTotalPages(serverTotalPages);
            // Always refresh in place — the task lands where the server puts it.
            // Navigating away when the page is full is disorienting and not worth it.
            setTasks(response.data || []);

            if (pending.toastId) {
                updateToast(pending.toastId, {
                    type: 'success',
                    message: 'Task Restored!',
                    actions: [],
                    duration: 3000
                });
            } else {
                showToast('Task restored!', 'success');
            }
        } catch (err) {
            showToast(handleApiError(err, 'Failed to restore task'), 'error');
        }
    }, [page, filters, setTotalPages, setTasks, showToast, updateToast]);

    // Keep the ref current so deleteTask's toast closure always calls the latest undoDelete
    undoDeleteRef.current = undoDelete;

    const completeAllTasks = useCallback(async () => {
        setSubmitting(true);
        try {
            const response = await taskService.completeAllTasks();
            const modifiedCount = response.data?.modifiedCount || 0;

            showToast(`Successfully updated ${modifiedCount} tasks`, 'success');
            await fetchTasks(true);

            return modifiedCount;
        } catch (err) {
            showToast(handleApiError(err, 'Failed to update tasks'), 'error');
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, [fetchTasks, showToast]);

    /**
     * Bulk soft-deletes all tasks of the given status with an optimistic UI pass.
     * If the deletion empties a non-first page, shows a skeleton immediately
     * to prevent a jarring empty-state flash.
     */
    const deleteTasksByStatus = useCallback(async (status) => {
        setDeleting(true);

        const previousTasks = [...tasks];
        const remainingOnPage = tasks.filter(t => t.status !== status);

        const willEmptyNonFirstPage = remainingOnPage.length === 0 && page > 1;
        if (willEmptyNonFirstPage) {
            setLoading(true);
        }

        setTasks(remainingOnPage);

        try {
            const response = await taskService.deleteTasksByStatus(status);
            const modifiedCount = response.data?.modifiedCount || 0;

            showToast(`Cleared ${modifiedCount} completed tasks`, 'success');

            if (willEmptyNonFirstPage) {
                setPage(page - 1);
            } else {
                await fetchTasks(true);
            }

            return modifiedCount;
        } catch (err) {
            if (willEmptyNonFirstPage) setLoading(false);
            setTasks(previousTasks);
            showToast(handleApiError(err, 'Failed to clear tasks'), 'error');
            throw err;
        } finally {
            setDeleting(false);
        }
    }, [tasks, page, setPage, fetchTasks, showToast]);

    return {
        tasks,
        loading,
        submitting,
        deleting,
        transitioning,
        page,
        totalPages,
        filters,
        searchParams,
        setSearchParams,
        setPage,
        updateFilters,
        clearFilters,
        fetchTasks,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        completeAllTasks,
        deleteTasksByStatus
    };
};
