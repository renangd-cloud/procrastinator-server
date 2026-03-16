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

module.exports = Tag;
