const ShoppingService = require('../services/ShoppingService');

exports.getShoppingSuggestions = async (req, res) => {
    try {
        const suggestions = await ShoppingService.getShoppingSuggestions(req.user.id);
        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getShoppingItems = async (req, res) => {
    try {
        const items = await ShoppingService.getShoppingItems(req.user.id);
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createShoppingItem = async (req, res) => {
    try {
        const newItem = await ShoppingService.createShoppingItem(req.body, req.user.id);
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateShoppingItem = async (req, res) => {
    try {
        const item = await ShoppingService.updateShoppingItem(req.params.id, req.body, req.user.id);
        res.json(item);
    } catch (err) {
        res.status(err.status || 400).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

exports.deleteShoppingItem = async (req, res) => {
    try {
        const result = await ShoppingService.deleteShoppingItem(req.params.id, req.user.id);
        res.json({ message: req.t(result.message) || 'Item deleted' });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};
