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

User.prototype.checkUpdatePermissions = function(currentUser, updateData) {
    if (currentUser.role !== 'Admin' && currentUser.id !== this.id) {
        const error = new Error('errors.forbidden');
        error.status = 403;
        throw error;
    }

    if (updateData.role && currentUser.role !== 'Admin') {
        const error = new Error('errors.cannotUpdateRole');
        error.status = 403;
        throw error;
    }
};

User.prototype.softDelete = async function() {
    await this.update({ deleted: true });
};

module.exports = User;
