const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: req.t('errors.unauthorized') });
};

module.exports = ensureAuthenticated;
