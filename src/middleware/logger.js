const Log = require('../models/Log');

const requestLogger = async (req, res, next) => {
    const start = Date.now();
    res.on('finish', async () => {
        const duration = Date.now() - start;
        try {
            await Log.create({
                level: res.statusCode >= 400 ? 'error' : 'info',
                message: `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
                meta: {
                    userId: req.user ? req.user.id : null,
                    body: req.method !== 'GET' ? req.body : undefined,
                    query: req.query,
                    ip: req.ip,
                },
            });
        } catch (err) {
            console.error('Logging Error:', err);
        }
    });
    next();
};

module.exports = { requestLogger };
