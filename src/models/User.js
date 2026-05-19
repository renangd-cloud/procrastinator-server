const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const UserRole = require('../constants/UserRole');

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
        type: DataTypes.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.USER,
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
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== this.id) {
        const error = new Error('errors.forbidden');
        error.status = 403;
        throw error;
    }

    if (updateData.role && currentUser.role !== UserRole.ADMIN) {
        const error = new Error('errors.cannotUpdateRole');
        error.status = 403;
        throw error;
    }
};

User.prototype.softDelete = async function() {
    await this.update({ deleted: true });
};

module.exports = User;
