const { ShoppingItem } = require('../models');

class ShoppingService {
    static async getShoppingItems(userId) {
        return await ShoppingItem.findAll({
            where: { userId, deleted: false },
            order: [
                ['bought', 'ASC'],
                ['market', 'ASC'],
                ['category', 'ASC'],
                ['createDate', 'DESC']
            ]
        });
    }

    static async getShoppingSuggestions(userId) {
        let categories = await ShoppingItem.getCategoriesSuggestions(userId);
        let markets = await ShoppingItem.getMarketsSuggestions(userId);

        // Predefined suggestions
        const predefinedCategories = ['Fruit', 'Vegetable', 'Meat', 'Dairy', 'Bakery', 'Cleaning', 'Other'];
        const predefinedMarkets = ['Supermarket', 'Grocery Store', 'Pharmacy', 'Butcher', 'Bakery', 'Other'];

        // Merge and remove duplicates
        categories = [...new Set([...predefinedCategories, ...categories])];
        markets = [...new Set([...predefinedMarkets, ...markets])];

        return { categories, markets };
    }

    static async createShoppingItem(data, userId) {
        const { name, amount, unit, market, category, priority, notes } = data;
        return await ShoppingItem.create({
            name, amount, unit, market, category, priority, notes, userId
        });
    }

    static async updateShoppingItem(id, data, userId) {
        const item = await ShoppingItem.findOne({ where: { id, userId, deleted: false } });
        if (!item) {
            const error = new Error('errors.itemNotFound');
            error.status = 404;
            throw error;
        }

        const { name, amount, unit, market, category, priority, bought, notes } = data;
        await item.update({
            name, amount, unit, market, category, priority, bought, notes
        });

        return item;
    }

    static async deleteShoppingItem(id, userId) {
        const item = await ShoppingItem.findOne({ where: { id, userId, deleted: false } });
        if (!item) {
            const error = new Error('errors.itemNotFound');
            error.status = 404;
            throw error;
        }

        await item.update({ deleted: true });
        return { message: 'success.itemDeleted' };
    }
}

module.exports = ShoppingService;
