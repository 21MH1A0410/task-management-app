const { z } = require('zod');

const createTaskSchema = z.object({
    body: z.object({
        title: z.string({
            required_error: "Title is required",
            invalid_type_error: "Title is required"
        }).trim().min(1, "Title cannot be empty").max(50, "Title is too long"),

        description: z.string().trim().max(100, "Description is too long").optional(),

        status: z.string()
            .optional()
            .refine(val => {
                if (val === undefined) return true;
                return ['pending', 'in-progress', 'completed'].includes(val);
            }, {
                message: "Invalid status value"
            }),

        dueDate: z.coerce.date().nullable().optional(),
    })
});

// PUT enforces full-replacement semantics — all required fields must be present
const updateTaskSchema = z.object({
    params: z.object({
        id: z.string()
    }),
    body: z.object({
        title: z.string().trim().min(1, "Title is required").max(50, "Title is too long"),
        description: z.string().trim().max(100, "Description is too long").optional(),
        status: z.enum(['pending', 'in-progress', 'completed']),
        dueDate: z.coerce.date().nullable().optional(),
    })
});

const patchTaskSchema = z.object({
    params: z.object({
        id: z.string()
    }),
    body: z.object({
        title: z.string().trim().min(1).max(50).optional(),
        description: z.string().trim().max(100, "Description is too long").optional(),
        status: z.enum(['pending', 'in-progress', 'completed']).optional(),
        dueDate: z.coerce.date().nullable().optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update"
    })
});

const getTasksSchema = z.object({
    query: z.object({
        search: z.string().max(200, "Search query too long").optional(),
        status: z.enum(['pending', 'in-progress', 'completed']).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        sortBy: z.enum(['createdAt', 'dueDate']).optional(),
        order: z.enum(['asc', 'desc']).optional()
    })
});

const deleteTasksByStatusSchema = z.object({
    query: z.object({
        status: z.enum(['pending', 'in-progress', 'completed'], {
            required_error: "Status query parameter is required"
        }),
        // Explicit confirmation prevents accidental bulk deletes from tooling or bad clients
        confirm: z.enum(['true'], {
            required_error: "Confirmation required: add ?confirm=true"
        })
    })
});

const taskIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID")
    })
});

module.exports = {
    createTaskSchema,
    updateTaskSchema,
    patchTaskSchema,
    getTasksSchema,
    deleteTasksByStatusSchema,
    taskIdParamSchema
};
