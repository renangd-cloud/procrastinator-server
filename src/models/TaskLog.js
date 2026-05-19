const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const TaskLogActionType = require('../constants/TaskLogActionType');

const TaskLog = sequelize.define('TaskLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'tasks',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    actionType: {
        type: DataTypes.ENUM(...Object.values(TaskLogActionType)),
        allowNull: false,
    },
    changes: {
        type: DataTypes.JSON,
        allowNull: true, // Will be null for comments or simple status changes without field details
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true, // Used for general comments or the reason for inactivation
    }
}, {
    tableName: 'task_logs',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false, // We usually don't update logs
});

module.exports = TaskLog;
