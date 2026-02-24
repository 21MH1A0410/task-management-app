import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    name: z.string().trim().min(1, 'Full name is required').max(100, 'Name is too long'),
    email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
    password: z.string()
        .min(8, 'Must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain 1 uppercase letter')
        .regex(/[a-z]/, 'Must contain 1 lowercase letter')
        .regex(/[0-9]/, 'Must contain 1 number')
        .regex(/[^A-Za-z0-9]/, 'Must contain 1 special character'),
});

export const taskSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Title is required')
        .max(50, 'Title is too long'),
    description: z.string().trim().max(100, 'Description is too long').optional(),
    status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
    dueDate: z.string()
        .optional()
        .transform(val => val === '' ? null : val)
        .refine((val) => val === null || val === undefined || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
});
