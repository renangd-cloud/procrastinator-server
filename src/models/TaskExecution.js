const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskExecution = sequelize.define('TaskExecution', {
    id: {
        type: DataTypes.UUID, // Distinct ID for this execution
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
    date: {
        type: DataTypes.DATEONLY, // The specific date of this occurrence
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Completed'),
        defaultValue: 'Pending',
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
}, {
    tableName: 'task_executions',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['taskId', 'date']
        }
    ]
});

module.exports = TaskExecution;
