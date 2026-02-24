const { ZodError } = require('zod');

/**
 * Validates req.body, req.params, and req.query against a Zod schema in a single pass.
 * Replaces the request properties with Zod's sanitized/transformed output before calling next().
 */
const zodResolver = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        req.body = validatedData.body || req.body;
        req.params = validatedData.params || req.params;
        req.query = validatedData.query || req.query;

        next();
    } catch (err) {
        if (err instanceof ZodError) {
            const errors = err.errors || err.issues || [];

            const errorMessage = errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');

            return res.status(400).json({
                success: false,
                error: {
                    message: errorMessage || 'Validation failed',
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
