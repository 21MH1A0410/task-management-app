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
        next(err);
    }
};

module.exports = zodResolver;
