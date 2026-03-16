const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: req.t('errors.unauthorized') });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: req.t('errors.forbidden') });
        }

        next();
    };
};

module.exports = checkRole;
