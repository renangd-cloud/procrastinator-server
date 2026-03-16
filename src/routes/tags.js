const express = require('express');
const passport = require('passport');
const tagController = require('../controllers/tagController');
const checkRole = require('../middleware/rbac');

const ensureAuthenticated = require('../middleware/auth');

const router = express.Router();

router.use(ensureAuthenticated);

// Only Admins can manage tags? Or everyone? 
// Requirement says "User Management with Roles (Admin/User)". 
// Usually Tags are shared or personal. Assuming shared for now, maybe Admin only for creation/deletion?
// Let's allow everyone to read, but maybe restrict write?
// For now, I'll allow authenticated users to do everything, but we can add checkRole(['Admin']) if needed.
// Let's add checkRole for delete as an example of usage.

router.post('/', tagController.createTag);
router.get('/', tagController.getTags);
router.put('/:id', tagController.updateTag);
router.delete('/:id', checkRole(['Admin']), tagController.deleteTag);

module.exports = router;
