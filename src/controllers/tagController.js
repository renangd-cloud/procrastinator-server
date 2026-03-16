const { Tag, sequelize } = require('../models');
const Log = require('../models/Log');

const createTag = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, color } = req.body;
        const tag = await Tag.create({ name, color }, { transaction: t });

        await t.commit();
        await Log.create({
            level: 'info',
            message: `Tag created: ${name}`,
            meta: { userId: req.user.id, tagId: tag.id }
        });

        res.json(tag);
    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: err.message });
    }
};

const getTags = async (req, res) => {
    try {
        const tags = await Tag.findAll({ where: { deleted: false } });
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateTag = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const tag = await Tag.findByPk(req.params.id);
        if (!tag) {
            await t.rollback();
            return res.status(404).json({ message: req.t('errors.tagNotFound') });
        }

        const { name, color } = req.body;
        await tag.update({ name, color }, { transaction: t });
        await t.commit();
        await Log.create({
            level: 'info',
            message: `Tag updated: ${name}`,
            meta: { userId: req.user.id, tagId: tag.id }
        });

        res.json(tag);
    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: err.message });
    }
};

const deleteTag = async (req, res) => {
    try {
        const tag = await Tag.findByPk(req.params.id);
        if (!tag) return res.status(404).json({ message: req.t('errors.tagNotFound') });

        await tag.update({ deleted: true });
        await Log.create({
            level: 'info',
            message: `Tag deleted: ${tag.name}`,
            meta: { userId: req.user.id, tagId: tag.id }
        });

        res.json({ message: req.t('success.tagDeleted') });
    } catch (err) {
        res.status(500).json({ message: req.t('errors.deleteTagError') });
    }
};

module.exports = {
    createTag,
    getTags,
    updateTag,
    deleteTag
};
