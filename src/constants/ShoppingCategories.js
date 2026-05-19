/**
 * Sugestões predefinidas de categorias e mercados para itens de compra.
 * Centraliza os dados de domínio fora da camada de serviço.
 */
const PREDEFINED_CATEGORIES = Object.freeze([
    'Fruit',
    'Vegetable',
    'Meat',
    'Dairy',
    'Bakery',
    'Cleaning',
    'Other',
]);

const PREDEFINED_MARKETS = Object.freeze([
    'Supermarket',
    'Grocery Store',
    'Pharmacy',
    'Butcher',
    'Bakery',
    'Other',
]);

module.exports = { PREDEFINED_CATEGORIES, PREDEFINED_MARKETS };
