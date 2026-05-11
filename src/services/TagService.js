const { Tag } = require('../models');

class TagService {
    static async createTag({ name, color }, userId) {
        return await Tag.createWithAudit({ name, color }, userId);
    }

    static async getTags() {
        return await Tag.findAll({ where: { deleted: false } });
    }

    static async updateTag(id, { name, color }, userId) {
        const tag = await Tag.findByPk(id);
        if (!tag) {
            const error = new Error('errors.tagNotFound');
            error.status = 404;
            throw error;
        }

        return await tag.updateWithAudit({ name, color }, userId);
    }

    static async deleteTag(id, userId) {
        const tag = await Tag.findByPk(id);
        if (!tag) {
            const error = new Error('errors.tagNotFound');
            error.status = 404;
            throw error;
        }

        await tag.update({ deleted: true });
        await tag.auditLog('deleted', userId);

        return { message: 'success.tagDeleted' };
    }
}

module.exports = TagService;
