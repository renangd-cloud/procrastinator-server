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

ShoppingItem.getCategoriesSuggestions = async function(userId) {
    const { Sequelize } = require('sequelize');
    const categories = await this.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
        where: { userId }
    });
    return categories.map(c => c.category).filter(c => c && c.trim() !== '');
};

ShoppingItem.getMarketsSuggestions = async function(userId) {
    const { Sequelize } = require('sequelize');
    const markets = await this.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('market')), 'market']],
        where: { userId }
    });
    return markets.map(m => m.market).filter(m => m && m.trim() !== '');
};

module.exports = ShoppingItem;
