const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskDependency = sequelize.define('TaskDependency', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'task_dependencies',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

module.exports = TaskDependency;
