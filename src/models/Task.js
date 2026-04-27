const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Log = require('./Log');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    date: {
        type: DataTypes.DATE, // For the planner date
        allowNull: true, // Date is now optional
    },
    dueDate: {
        type: DataTypes.DATE, // For the due date
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Completed'),
        defaultValue: 'Pending',
    },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High'),
        defaultValue: 'Medium',
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    inactivatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    recurrenceType: {
        type: DataTypes.ENUM('Daily', 'Weekly', 'Bi-weekly', 'Monthly'),
        allowNull: true,
    },
    recurrenceDays: {
        type: DataTypes.JSON, // Array of weekday numbers [0-6] for daily recurrence
        allowNull: true,
    },
    lastCompletedDate: {
        type: DataTypes.DATE, // Tracks when the recurring task was last completed
        allowNull: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'tasks',
    timestamps: true,
    createdAt: 'createDate',
    updatedAt: 'updateDate',
});

const TaskHelper = require('../helpers/TaskHelper');
const { Op } = require('sequelize');

Task.prototype.injectExecutionStatus = function(todayStr) {
    if (this.isRecurring && this.Executions) {
        const todayExecution = this.Executions.find(ex => ex.date === todayStr);
        if (todayExecution) {
            this.status = todayExecution.status;
        }
    }
};

Task.prototype.isBlockedByPrerequisites = function(todayStr) {
    if (!this.Prerequisites || this.Prerequisites.length === 0) return false;

    return this.Prerequisites.some(prereq => {
        let prereqStatus = prereq.status;
        if (prereq.isRecurring && prereq.Executions) {
            const prereqExecution = prereq.Executions.find(ex => ex.date === todayStr);
            if (prereqExecution) {
                prereqStatus = prereqExecution.status;
            }
        }
        return prereqStatus !== 'Completed';
    });
};

Task.prototype.syncTags = async function(tagsArray, transaction) {
    if (!tagsArray) return;
    const { Tag } = sequelize.models;
    const tagInstances = [];

    for (const tagItem of tagsArray) {
        const tagName = typeof tagItem === 'object' ? tagItem.name : tagItem;
        const tagColor = typeof tagItem === 'object' ? tagItem.color : null;

        let tag = await Tag.findOne({ where: { name: tagName }, transaction });
        if (!tag) {
            let color = tagColor || TaskHelper.getRandomColor();
            if (!tagColor) {
                let colorExists = await Tag.findOne({ where: { color }, transaction });
                let retries = 0;
                while (colorExists && retries < 10) {
                    color = TaskHelper.getRandomColor();
                    colorExists = await Tag.findOne({ where: { color }, transaction });
                    retries++;
                }
            }
            tag = await Tag.create({ name: tagName, color }, { transaction });
        }
        tagInstances.push(tag);
    }
    await this.setTags(tagInstances, { transaction });
};

Task.prototype.syncSubtasks = async function(subtasksArray, targetExecution, transaction) {
    if (!subtasksArray) return;
    const { Subtask, SubtaskExecution } = sequelize.models;

    const incomingIds = subtasksArray.filter(s => s.id).map(s => s.id);

    // Delete removed definitions
    await Subtask.destroy({
        where: { taskId: this.id, id: { [Op.notIn]: incomingIds } },
        transaction
    });

    const subtaskMap = {};

    for (const sub of subtasksArray) {
        let subtaskDef;
        const currentOrder = subtasksArray.indexOf(sub);

        if (sub.id) {
            subtaskDef = await Subtask.findOne({ where: { id: sub.id }, transaction });
            if (subtaskDef) await subtaskDef.update({ title: sub.title, order: currentOrder }, { transaction });
        } else {
            subtaskDef = await Subtask.create({
                title: sub.title,
                completed: false,
                taskId: this.id,
                order: currentOrder
            }, { transaction });
        }
        if (subtaskDef) {
            subtaskMap[subtaskDef.id] = sub;
        }
    }

    if (targetExecution) {
        for (const defId in subtaskMap) {
            const subData = subtaskMap[defId];
            const isCompleted = subData.completed;

            const [subExec, created] = await SubtaskExecution.findOrCreate({
                where: { taskExecutionId: targetExecution.id, subtaskId: defId },
                defaults: { completed: isCompleted },
                transaction
            });

            if (!created) {
                await subExec.update({ completed: isCompleted }, { transaction });
            }
        }
    } else if (!this.isRecurring) {
        for (const sub of subtasksArray) {
            if (sub.id) {
                await Subtask.update({ completed: sub.completed }, { where: { id: sub.id }, transaction });
            }
        }
    }
};

Task.prototype.handleExecutionUpdate = async function(date, status, userId, transaction) {
    if (!this.isRecurring) return null;
    if (!date) return null;
    const { TaskExecution } = sequelize.models;

    let targetExecution = await TaskExecution.findOne({
        where: { taskId: this.id, date: date, userId },
        transaction
    });

    if (!targetExecution) {
        targetExecution = await TaskExecution.create({
            taskId: this.id,
            date: date,
            status: status || 'Pending',
            userId
        }, { transaction });
    } else if (status) {
        await targetExecution.update({ status }, { transaction });
    }

    return targetExecution;
};

Task.create = async function(data, userId) {
    const t = await sequelize.transaction();
    try {
        let { title, description, date, dueDate, status, priority, tags, subtasks, dependencies, isRecurring, recurrenceType, recurrenceDays, active } = data;
        const task = this.build({
            title, description, date, dueDate, status, priority, userId, isRecurring, recurrenceType, recurrenceDays, active
        });
        await task.save({ transaction: t });

        await task.syncTags(tags, t);
        await task.syncSubtasks(subtasks, null, t);

        if (dependencies && dependencies.length > 0) {
            await task.addPrerequisites(dependencies, { transaction: t });
        }

        await t.commit();
        
        try {
            await Log.create({
                level: 'info',
                message: `Task created: ${title}`,
                meta: { userId, taskId: task.id }
            });
        } catch (logErr) {
            console.error('Error creating log:', logErr);
        }

        return task.id;
    } catch (err) {
        if (!t.finished) await t.rollback();
        throw err;
    }
};

Task.update = async function(task, data, userId) {
    const t = await sequelize.transaction();
    try {
        let { title, description, date, dueDate, status, priority, tags, subtasks, dependencies, isRecurring, recurrenceType, recurrenceDays, active } = data;

        let targetExecution = await task.handleExecutionUpdate(date, status, userId, t);

        let definitionUpdate = { title, description, dueDate, priority, isRecurring, recurrenceType, recurrenceDays, active };

        if (active !== undefined) {
            if (active === false && task.active !== false) {
                definitionUpdate.inactivatedAt = new Date();
            } else if (active === true) {
                definitionUpdate.inactivatedAt = null;
            }
        }

        if (!task.isRecurring && !isRecurring) {
            definitionUpdate.status = status;
            definitionUpdate.date = date;
        }

        task.set(definitionUpdate);
        await task.save({ transaction: t });

        await task.syncTags(tags, t);
        await task.syncSubtasks(subtasks, targetExecution, t);

        if (dependencies) {
            await task.setPrerequisites(dependencies, { transaction: t });
        }

        await t.commit();
        
        try {
            await Log.create({
                level: 'info',
                message: `Task updated: ${task.title}`,
                meta: { userId, taskId: task.id, updates: data }
            });
        } catch (logErr) {
            console.error('Error creating log:', logErr);
        }

        return task.id;
    } catch (err) {
        if (!t.finished) await t.rollback();
        throw err;
    }
};

Task.duplicate = async function(sourceTask, title, userId) {
    const t = await sequelize.transaction();
    try {
        const { description, date, dueDate, status, priority, isRecurring, recurrenceType, recurrenceDays, active } = sourceTask;

        const newTask = this.build({
            title, description, date, dueDate, status, priority, userId, isRecurring, recurrenceType, recurrenceDays, active
        });
        await newTask.save({ transaction: t });

        if (sourceTask.Tags && sourceTask.Tags.length > 0) {
            await newTask.addTags(sourceTask.Tags, { transaction: t });
        }

        const { Subtask } = sequelize.models;
        if (sourceTask.Subtasks && sourceTask.Subtasks.length > 0) {
            for (const sub of sourceTask.Subtasks) {
                await Subtask.create({
                    title: sub.title,
                    completed: sub.completed,
                    order: sub.order,
                    taskId: newTask.id
                }, { transaction: t });
            }
        }

        if (sourceTask.Prerequisites && sourceTask.Prerequisites.length > 0) {
            await newTask.addPrerequisites(sourceTask.Prerequisites, { transaction: t });
        }

        await t.commit();

        try {
            await Log.create({
                level: 'info',
                message: `Task duplicated: ${sourceTask.title} -> ${title}`,
                meta: { userId, originalTaskId: sourceTask.id, newTaskId: newTask.id }
            });
        } catch (logErr) {
            console.error('Error creating log:', logErr);
        }

        return newTask.id;
    } catch (err) {
        if (!t.finished) await t.rollback();
        throw err;
    }
};

module.exports = Task;
