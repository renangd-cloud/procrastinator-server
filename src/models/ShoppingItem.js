const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ShoppingItem = sequelize.define('ShoppingItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    market: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'shopping_items',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

module.exports = ShoppingItem;
