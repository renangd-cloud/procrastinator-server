const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SubtaskExecution = sequelize.define('SubtaskExecution', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    taskExecutionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'task_executions',
            key: 'id'
        }
    },
    subtaskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'subtasks',
            key: 'id'
        }
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'subtask_executions',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['taskExecutionId', 'subtaskId']
        }
    ]
});

module.exports = SubtaskExecution;
