const { User } = require('../models');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ where: { deleted: false } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: req.t('errors.fetchUsersError') });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.params.id, deleted: false } });
        if (!user) return res.status(404).json({ message: req.t('errors.userNotFound') });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.params.id, deleted: false } });
        if (!user) return res.status(404).json({ message: req.t('errors.userNotFound') });

        // Check permissions: Admin can update anyone, User can only update themselves
        if (req.user.role !== 'Admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ message: req.t('errors.forbidden') });
        }

        // Only Admin can update role
        if (req.body.role && req.user.role !== 'Admin') {
            return res.status(403).json({ message: req.t('errors.cannotUpdateRole') });
        }

        await user.update(req.body);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: req.t('errors.updateUserError') });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.params.id, deleted: false } });
        if (!user) return res.status(404).json({ message: req.t('errors.userNotFound') });

        await user.update({ deleted: true });
        res.json({ message: req.t('success.userDeleted') }); // Note: I need to add userDeleted to success in json
    } catch (err) {
        res.status(500).json({ message: req.t('errors.deleteUserError') });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
};
