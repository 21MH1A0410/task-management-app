// /server/validations/userValidation.js
const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Name is required',
            invalid_type_error: 'Name is required'
        }).trim().min(1, 'Name is required'),
        email: z.string({
            required_error: 'Email is required',
            invalid_type_error: 'Email is required'
        }).trim().email('Invalid email address'),
        password: z.string({
            required_error: 'Password is required',
            invalid_type_error: 'Password is required'
        }).min(6, 'Password must be at least 6 characters')
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string({
            required_error: 'Email is required',
            invalid_type_error: 'Email is required'
        }).trim().email('Invalid email address'),
        password: z.string({
            required_error: 'Password is required',
            invalid_type_error: 'Password is required'
        }).min(1, 'Password is required')
    })
});

module.exports = {
    registerSchema,
    loginSchema
};
