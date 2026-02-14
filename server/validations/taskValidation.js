// /server/validations/taskValidation.js
const { z } = require('zod');

// Schema for creating a task (POST)
const createTaskSchema = z.object({
    body: z.object({
        // Title: required field with custom message
        title: z.string({
            required_error: "Title is required",
            invalid_type_error: "Title is required"
        }).min(1, "Title cannot be empty").max(100, "Title is too long"),

        description: z.string().optional(),

        // Status: use string + refine to ensure custom message for invalid enum
        status: z.string()
            .optional() // allow undefined
            .refine(val => {
                if (val === undefined) return true;
                return ['pending', 'in-progress', 'completed'].includes(val);
            }, {
                message: "Invalid status value"
            }),

        dueDate: z.coerce.date().optional(),
    })
});

// Schema for updating a task (PUT) - Made fields required for true full replace
const updateTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID")
    }),
    body: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        status: z.enum(['pending', 'in-progress', 'completed']),
        dueDate: z.coerce.date().optional(),
    })
});

// Schema for patch (partial) - Kept optional with refine
const patchTaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID")
    }),
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(['pending', 'in-progress', 'completed']).optional(),
        dueDate: z.coerce.date().optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update"
    })
});

// Schema for GET /api/tasks (query params validation)
const getTasksSchema = z.object({
    query: z.object({
        search: z.string().optional(),
        status: z.enum(['pending', 'in-progress', 'completed']).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional()
    })
});

// Schema for DELETE /api/tasks?status=... (query validation)
const deleteTasksByStatusSchema = z.object({
    query: z.object({
        status: z.enum(['pending', 'in-progress', 'completed'], {
            required_error: "Status query parameter is required"
        }),
        // Require explicit confirmation for bulk delete safety
        confirm: z.enum(['true'], {
            required_error: "Confirmation required: add ?confirm=true"
        })
    })
});

// Quick task only needs title (status forced to 'in-progress')
const quickTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required")
    })
});

const taskIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID")
    })
});

module.exports = {
    createTaskSchema,
    updateTaskSchema,
    patchTaskSchema,
    getTasksSchema,
    deleteTasksByStatusSchema,
    quickTaskSchema,
    taskIdParamSchema
};
