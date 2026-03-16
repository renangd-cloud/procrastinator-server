const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    role: {
        type: DataTypes.ENUM('Admin', 'User'),
        defaultValue: 'User',
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    preferences: {
        type: DataTypes.JSON,
        defaultValue: { language: 'pt' },
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

module.exports = User;
