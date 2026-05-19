const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const LogLevel = require('../constants/LogLevel');

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

Tag.prototype.auditLog = async function(actionKey, userId) {
    const { Log } = sequelize.models;
    await Log.create({
        level: LogLevel.INFO,
        message: `${actionKey}: ${this.name}`,
        meta: { userId, tagId: this.id }
    });
};

Tag.createWithAudit = async function({ name, color }, userId) {
    const t = await sequelize.transaction();
    try {
        const tag = this.build({ name, color });
        await tag.save({ transaction: t });
        await t.commit();
        await tag.auditLog('logs.tagCreated', userId);
        return tag;
    } catch (err) {
        if (!t.finished) await t.rollback();
        throw err;
    }
};

Tag.prototype.updateWithAudit = async function({ name, color }, userId) {
    const t = await sequelize.transaction();
    try {
        this.set({ name, color });
        await this.save({ transaction: t });
        await t.commit();
        await this.auditLog('logs.tagUpdated', userId);
        return this;
    } catch (err) {
        if (!t.finished) await t.rollback();
        throw err;
    }
};

module.exports = Tag;
