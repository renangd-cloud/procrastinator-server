const TaskService = require('../services/TaskService');

const createTask = async (req, res) => {
    try {
        const taskWithDetails = await TaskService.createTask(req.body, req.user.id);
        res.json(taskWithDetails);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const getTasks = async (req, res) => {
    try {
        const tasks = await TaskService.getTasks(req.user.id, req.query.includeBlocked);
        res.json(tasks);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await TaskService.getTaskById(req.params.id, req.user.id);
        res.json(task);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const updatedTask = await TaskService.updateTask(req.params.id, req.body, req.user.id);
        res.json(updatedTask);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const result = await TaskService.deleteTask(req.params.id, req.user.id);
        res.json({ message: req.t(result.message) });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : req.t('errors.deleteTaskError') });
    }
};

const duplicateTask = async (req, res) => {
    try {
        const taskWithDetails = await TaskService.duplicateTask(req.params.id, req.body.title, req.user.id);
        res.status(201).json(taskWithDetails);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const getTaskLogs = async (req, res) => {
    try {
        const logs = await TaskService.getTaskLogs(req.params.id, req.user.id);
        res.json(logs);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const addTaskComment = async (req, res) => {
    try {
        const log = await TaskService.addTaskComment(req.params.id, req.body.comment, req.user.id);
        res.status(201).json(log);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    duplicateTask,
    getTaskLogs,
    addTaskComment
};


