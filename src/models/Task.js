const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    date: {
        type: DataTypes.DATE, // For the planner date
        allowNull: true, // Date is now optional
    },
    dueDate: {
        type: DataTypes.DATE, // For the due date
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Completed'),
        defaultValue: 'Pending',
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High'),
        defaultValue: 'Medium',
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    inactivatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    recurrenceType: {
        type: DataTypes.ENUM('Daily', 'Weekly', 'Bi-weekly', 'Monthly'),
        allowNull: true,
    },
    recurrenceDays: {
        type: DataTypes.JSON, // Array of weekday numbers [0-6] for daily recurrence
        allowNull: true,
    },
    lastCompletedDate: {
        type: DataTypes.DATE, // Tracks when the recurring task was last completed
        allowNull: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

module.exports = Task;
