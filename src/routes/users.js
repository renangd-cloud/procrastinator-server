const express = require('express');
const passport = require('passport');
const checkRole = require('../middleware/rbac');
const ensureAuthenticated = require('../middleware/auth');
const userController = require('../controllers/UserController');

const router = express.Router();

router.use(ensureAuthenticated);

// Admin only
router.get('/', checkRole(['Admin']), userController.getAllUsers);

// Admin or Self (Middleware for self check needed or handle in controller)
// For simplicity, allowing Admin or any User to see details (requirement says "Ao clicar em um usuario, uma janela com os detalhes daquele usuario deve ser mostrada")
// "A listagem de usuarios por exemplo so deve ser permitida ao Admin."
// "Ao clicar em um usuario..." implies listing first? Or maybe from a task?
// If listing is Admin only, then clicking is implicitly Admin only unless accessed via other means.
// But let's allow Admin to see any, and User to see self.
router.get('/:id', checkRole(['Admin']), userController.getUserById);

router.put('/:id', userController.updateUser);
router.delete('/:id', checkRole(['Admin']), userController.deleteUser);

module.exports = router;
