const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Tag = sequelize.define('Tag', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'tags',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

Tag.prototype.auditLog = async function(action, userId) {
    const { Log } = sequelize.models;
    await Log.create({
        level: 'info',
        message: `Tag ${action}: ${this.name}`,
        meta: { userId, tagId: this.id }
    });
};

Tag.create = async function({ name, color }, userId) {
    const t = await sequelize.transaction();
    try {
        const tag = this.build({ name, color });
        await tag.save({ transaction: t });
        await t.commit();
        await tag.auditLog('created', userId);
        return tag;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

Tag.prototype.update = async function({ name, color }, userId) {
    const t = await sequelize.transaction();
    try {
        this.set({ name, color });
        await this.save({ transaction: t });
        await t.commit();
        await this.auditLog('updated', userId);
        return this;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

module.exports = Tag;
