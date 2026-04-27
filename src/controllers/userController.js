const UserService = require('../services/UserService');

const getAllUsers = async (req, res) => {
    try {
        const users = await UserService.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : req.t('errors.fetchUsersError') });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await UserService.getUserById(req.params.id);
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await UserService.updateUser(req.params.id, req.body, req.user);
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : req.t('errors.updateUserError') });
    }
};

const deleteUser = async (req, res) => {
    try {
        const result = await UserService.deleteUser(req.params.id);
        res.json({ message: req.t(result.message) });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.status ? req.t(err.message) : req.t('errors.deleteUserError') });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};
