const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subtask = sequelize.define('Subtask', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'subtasks',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

module.exports = Subtask;
