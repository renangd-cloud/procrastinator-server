const express = require('express');
const router = express.Router();
const shoppingController = require('../controllers/shoppingController');
const auth = require('../middleware/auth');

router.get('/suggestions', auth, shoppingController.getShoppingSuggestions);
router.get('/', auth, shoppingController.getShoppingItems);
router.post('/', auth, shoppingController.createShoppingItem);
router.put('/:id', auth, shoppingController.updateShoppingItem);
router.delete('/:id', auth, shoppingController.deleteShoppingItem);

module.exports = router;
