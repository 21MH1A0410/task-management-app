export function getDueLabel(dueDate) {
    if (!dueDate) return null;

    const now = new Date();
    // Strip time for accurate day-level comparisons
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const due = new Date(dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffTime = dueDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { type: "overdue", label: "Overdue" };
    }
    if (diffDays === 0) {
        return { type: "today", label: "Today" };
    }
    if (diffDays === 1) {
        return { type: "tomorrow", label: "Tomorrow" };
    }

    // Calendar-aware "This Week" logic
    // today.getDay() returns 0 (Sun) to 6 (Sat).
    // Let's assume a week starts on Sunday for standard JS dates.
    // Days remaining in the current week:
    const daysUntilEndOfWeek = 6 - today.getDay(); 
    
    // If the due date falls within the remaining days of this calendar week
    if (diffDays > 1 && diffDays <= daysUntilEndOfWeek) {
        return { type: "this_week", label: "This Week" };
    }

    // "Next Week" logic: falls in the following 7-day calendar block
    if (diffDays > daysUntilEndOfWeek && diffDays <= daysUntilEndOfWeek + 7) {
        return { type: "next_week", label: "Next Week" };
    }

    // Month logic
    if (
        due.getMonth() === now.getMonth() &&
        due.getFullYear() === now.getFullYear()
    ) {
        return { type: "this_month", label: "This Month" };
    }

    if (
        (due.getMonth() === now.getMonth() + 1 && due.getFullYear() === now.getFullYear()) ||
        (due.getMonth() === 0 && now.getMonth() === 11 && due.getFullYear() === now.getFullYear() + 1)
    ) {
        return { type: "next_month", label: "Next Month" };
    }

    // Fallback Date Format
    return {
        type: "date",
        label: due.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    };
}
