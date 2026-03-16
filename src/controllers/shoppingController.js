const ShoppingItem = require('../models/ShoppingItem');
const { Sequelize } = require('sequelize');

exports.getShoppingSuggestions = async (req, res) => {
    try {
        const categories = await ShoppingItem.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
            where: { userId: req.user.id }
        });
        const markets = await ShoppingItem.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('market')), 'market']],
            where: { userId: req.user.id }
        });

        res.json({
            categories: categories.map(c => c.category).filter(Boolean),
            markets: markets.map(m => m.market).filter(Boolean)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getShoppingItems = async (req, res) => {
    try {
        const items = await ShoppingItem.findAll({
            where: { userId: req.user.id },
            order: [['createDate', 'ASC']]
        });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createShoppingItem = async (req, res) => {
    try {
        const { name, quantity, category, market, link } = req.body;
        const newItem = await ShoppingItem.create({
            name,
            quantity,
            category,
            market,
            link,
            userId: req.user.id
        });
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateShoppingItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ShoppingItem.findOne({ where: { id, userId: req.user.id } });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.update(req.body);
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteShoppingItem = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ShoppingItem.findOne({ where: { id, userId: req.user.id } });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.destroy();
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
