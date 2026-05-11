const { Task, Subtask, Tag, TaskExecution, SubtaskExecution, TaskLog, User } = require('../models');
const Log = require('../models/Log');
const { Op } = require('sequelize');
const { format } = require('date-fns');

class TaskService {
    static #getTaskDetailsInclude() {
        return [
            { model: Subtask, separate: true, order: [['order', 'ASC']] },
            Tag,
            { model: Task, as: 'Prerequisites' },
            { model: Task, as: 'Dependents' },
            {
                model: TaskExecution,
                as: 'Executions',
                include: [{ model: SubtaskExecution, as: 'SubtaskExecutions' }]
            }
        ];
    }

    static #shouldShowRecurringTask(task) {
        if (!task.isRecurring) return true;
        if (!task.recurrenceType) return true;
        return true;
    }

    static async createTask(data, userId) {
        try {
            if (data.date === '' || data.date === 'Invalid date') data.date = null;
            if (data.dueDate === '' || data.dueDate === 'Invalid date') data.dueDate = null;
            if (data.recurrenceType === '') data.recurrenceType = null;

            if (data.tags && data.tags.length > 10) {
                const error = new Error('errors.maxTagsError');
                error.status = 400;
                throw error;
            }

            const taskId = await Task.create(data, userId);

            return await Task.findByPk(taskId, {
                include: TaskService.#getTaskDetailsInclude()
            });
        } catch (err) {
            console.error('Error creating task:', err);
            require('fs').writeFileSync('c:/dsv/antigravity/procrastinator/server/last_error.txt', err.stack || err.message);
            err.status = err.status || 500;
            throw err;
        }
    }

    static async getTasks(userId, includeBlocked) {
        try {
            const tasks = await Task.findAll({
                where: { userId, deleted: false },
                include: TaskService.#getTaskDetailsInclude(),
                order: [['createDate', 'DESC']]
            });

            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const filteredTasks = tasks.filter(task => {
                try {
                    task.injectExecutionStatus(todayStr);

                    if (!TaskService.#shouldShowRecurringTask(task)) return false;

                    if (String(includeBlocked) !== 'true') {
                        if (task.isBlockedByPrerequisites(todayStr)) {
                            return false;
                        }
                    }

                    return true;
                } catch (error) {
                    console.error('Error filtering task:', task.id, error);
                    return true;
                }
            });

            return filteredTasks;
        } catch (err) {
            console.error('Error in getTasks:', err);
            const error = new Error('errors.fetchTasksError');
            error.status = 500;
            throw error;
        }
    }

    static async getReminders(userId) {
        try {
            const user = await User.findByPk(userId);
            const leadTimeHours = (user && user.preferences && user.preferences.reminderLeadTimeHours) !== undefined 
                ? user.preferences.reminderLeadTimeHours 
                : 24;

            const thresholdDate = new Date();
            thresholdDate.setHours(thresholdDate.getHours() + leadTimeHours);

            const tasks = await Task.findAll({
                where: {
                    userId,
                    deleted: false,
                    active: true,
                    status: { [Op.ne]: 'Completed' },
                    dueDate: {
                        [Op.not]: null,
                        [Op.lte]: thresholdDate
                    }
                },
                include: TaskService.#getTaskDetailsInclude(),
                order: [['dueDate', 'ASC']]
            });

            return tasks;
        } catch (err) {
            console.error('Error in getReminders:', err);
            const error = new Error('errors.fetchRemindersError');
            error.status = 500;
            throw error;
        }
    }

    static async getTaskById(id, userId) {
        const task = await Task.findOne({
            where: { id, userId, deleted: false },
            include: TaskService.#getTaskDetailsInclude()
        });
        if (!task) {
            const error = new Error('errors.taskNotFound');
            error.status = 404;
            throw error;
        }
        return task;
    }

    static async updateTask(id, data, userId) {
        try {
            const task = await Task.findOne({ where: { id, userId, deleted: false } });
            if (!task) {
                const error = new Error('errors.taskNotFound');
                error.status = 404;
                throw error;
            }

            if (data.date === '' || data.date === 'Invalid date') data.date = null;
            if (data.dueDate === '' || data.dueDate === 'Invalid date') data.dueDate = null;
            if (data.recurrenceType === '') data.recurrenceType = null;

            if (data.tags && data.tags.length > 10) {
                const error = new Error('errors.maxTagsError');
                error.status = 400;
                throw error;
            }

            const taskId = await Task.update(task, data, userId);

            return await Task.findByPk(taskId, {
                include: TaskService.#getTaskDetailsInclude()
            });
        } catch (err) {
            console.error("Update Error", err);
            if(!err.status) {
                err.message = 'errors.updateTaskError';
                err.status = 500;
            }
            throw err;
        }
    }

    static async deleteTask(id, userId) {
        const task = await Task.findOne({ where: { id, userId, deleted: false } });
        if (!task) {
            const error = new Error('errors.taskNotFound');
            error.status = 404;
            throw error;
        }

        await task.update({ deleted: true });

        await Log.create({
            level: 'info',
            message: `Task deleted: ${task.title}`,
            meta: { userId, taskId: task.id }
        });

        return { message: 'success.taskDeleted' };
    }

    static async duplicateTask(id, title, userId) {
        try {
            const sourceTask = await Task.findOne({
                where: { id, userId, deleted: false },
                include: TaskService.#getTaskDetailsInclude()
            });

            if (!sourceTask) {
                const error = new Error('errors.taskNotFound');
                error.status = 404;
                throw error;
            }

            const existingTask = await Task.findOne({
                where: {
                    userId,
                    title: { [Op.iLike]: title },
                    deleted: false
                }
            });

            if (existingTask) {
                const error = new Error('errors.taskAlreadyExists');
                error.status = 400;
                throw error;
            }

            const newTaskId = await Task.duplicate(sourceTask, title, userId);

            return await Task.findByPk(newTaskId, {
                include: TaskService.#getTaskDetailsInclude()
            });
        } catch (err) {
            console.error('Error in duplicateTask:', err);
            if(!err.status) {
                err.message = 'errors.createTaskError';
                err.status = 500;
            }
            throw err;
        }
    }
    static async getTaskLogs(taskId, userId) {
        const task = await Task.findOne({ where: { id: taskId, userId, deleted: false } });
        if (!task) {
            const error = new Error('errors.taskNotFound');
            error.status = 404;
            throw error;
        }

        const logs = await TaskLog.findAll({
            where: { taskId },
            include: [{ model: User, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });

        return logs;
    }

    static async addTaskComment(taskId, comment, userId) {
        if (!comment || comment.trim() === '') {
            const error = new Error('O comentário não pode ser vazio.');
            error.status = 400;
            throw error;
        }

        const task = await Task.findOne({ where: { id: taskId, userId, deleted: false } });
        if (!task) {
            const error = new Error('errors.taskNotFound');
            error.status = 404;
            throw error;
        }

        const log = await TaskLog.create({
            taskId: taskId,
            userId: userId,
            actionType: 'COMMENT',
            comment: comment
        });

        const createdLog = await TaskLog.findByPk(log.id, {
            include: [{ model: User, attributes: ['name'] }]
        });

        return createdLog;
    }
}

module.exports = TaskService;
