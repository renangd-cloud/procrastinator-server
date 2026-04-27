const { User } = require('../models');

class UserService {
    static async getAllUsers() {
        return await User.findAll({ where: { deleted: false } });
    }

    static async getUserById(id) {
        const user = await User.findOne({ where: { id, deleted: false } });
        if (!user) {
            const error = new Error('errors.userNotFound');
            error.status = 404;
            throw error;
        }
        return user;
    }

    static async updateUser(id, updateData, currentUser) {
        const user = await User.findOne({ where: { id, deleted: false } });
        if (!user) {
            const error = new Error('errors.userNotFound');
            error.status = 404;
            throw error;
        }

        user.checkUpdatePermissions(currentUser, updateData);

        await user.update(updateData);
        return user;
    }

    static async deleteUser(id) {
        const user = await User.findOne({ where: { id, deleted: false } });
        if (!user) {
            const error = new Error('errors.userNotFound');
            error.status = 404;
            throw error;
        }

        await user.softDelete();
        return { message: 'success.userDeleted' };
    }
}

module.exports = UserService;
