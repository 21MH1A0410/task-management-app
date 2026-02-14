// /server/middleware/zodResolver.js
const { ZodError } = require('zod');

/**
 * Generic Zod validation resolver
 * Allows validating body, params, and query
 */
const zodResolver = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        // overwrite request with validated data
        req.body = validatedData.body || req.body;
        req.params = validatedData.params || req.params;
        req.query = validatedData.query || req.query;

        next();
    } catch (err) {
        if (err instanceof ZodError) {
            const errors = err.errors || err.issues || [];

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                }
            });
        }

        next(err);
    }
};

module.exports = zodResolver;
