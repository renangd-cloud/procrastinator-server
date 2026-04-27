const TagService = require('../services/TagService');

const createTag = async (req, res) => {
    try {
        const tag = await TagService.createTag(req.body, req.user.id);
        res.json(tag);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const getTags = async (req, res) => {
    try {
        const tags = await TagService.getTags();
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateTag = async (req, res) => {
    try {
        const tag = await TagService.updateTag(req.params.id, req.body, req.user.id);
        res.json(tag);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const deleteTag = async (req, res) => {
    try {
        const result = await TagService.deleteTag(req.params.id, req.user.id);
        res.json({ message: req.t(result.message) });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : req.t('errors.deleteTagError') });
    }
};

module.exports = {
    createTag,
    getTags,
    updateTag,
    deleteTag
};
