const express = require('express');
const taskController = require('../controllers/taskController');
const ensureAuthenticated = require('../middleware/auth');

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/duplicate', taskController.duplicateTask);

module.exports = router;
