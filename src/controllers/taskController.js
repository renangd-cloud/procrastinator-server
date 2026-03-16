const { Task, Subtask, Tag, TaskDependency, TaskExecution, SubtaskExecution, sequelize } = require('../models');
const Log = require('../models/Log');
const { Op } = require('sequelize');
const { format } = require('date-fns');

const TaskHelper = require('../helpers/TaskHelper');

const getTaskDetailsInclude = () => [
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

const createTask = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        let { title, description, date, status, priority, tags, subtasks, dependencies, isRecurring, recurrenceType, recurrenceDays, active } = req.body;
        if (date === '' || date === 'Invalid date') date = null;
        const userId = req.user.id;


        if (tags && tags.length > 10) {
            await t.rollback();
            return res.status(400).json({ message: req.t('errors.maxTagsError') });
        }



        const task = await Task.create({
            title, description, date, status, priority, userId, isRecurring, recurrenceType, recurrenceDays, active
        }, { transaction: t });

        // Handle Tags
        if (tags && tags.length > 0) {
            for (const tagItem of tags) {
                const tagName = typeof tagItem === 'object' ? tagItem.name : tagItem;
                const tagColor = typeof tagItem === 'object' ? tagItem.color : null;

                let tag = await Tag.findOne({ where: { name: tagName } });
                if (!tag) {
                    let color = tagColor || TaskHelper.getRandomColor();
                    if (!tagColor) {
                        let colorExists = await Tag.findOne({ where: { color } });
                        let retries = 0;
                        while (colorExists && retries < 10) {
                            color = TaskHelper.getRandomColor();
                            colorExists = await Tag.findOne({ where: { color } });
                            retries++;
                        }
                    }
                    tag = await Tag.create({ name: tagName, color }, { transaction: t });
                }
                await task.addTag(tag, { transaction: t });
            }
        }

        // Handle Subtasks
        if (subtasks && subtasks.length > 0) {
            for (let i = 0; i < subtasks.length; i++) {
                const sub = subtasks[i];
                await Subtask.create({ title: sub.title, completed: sub.completed, taskId: task.id, order: i }, { transaction: t });
            }
        }

        // Handle Dependencies (Prerequisites)
        if (dependencies && dependencies.length > 0) {
            await task.addPrerequisites(dependencies, { transaction: t });
        }

        await t.commit();

        // Audit Log
        await Log.create({
            level: 'info',
            message: `Task created: ${title}`,
            meta: { userId, taskId: task.id }
        });

        console.log('Task created:', task.toJSON());

        const taskWithDetails = await Task.findByPk(task.id, {
            include: getTaskDetailsInclude()
        });
        res.json(taskWithDetails);
    } catch (err) {
        console.error('Error creating task:', err);
        await t.rollback();
        res.status(500).json({ message: req.t('errors.createTaskError') });
    }
};


// Helper to determine if a recurring task should be included in the response
const shouldShowRecurringTask = (task) => {
    // Always show non-recurring tasks
    if (!task.isRecurring) return true;

    // Validate recurrence fields
    if (!task.recurrenceType) return true;

    return true;
};


const getTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { userId: req.user.id, deleted: false },
            include: getTaskDetailsInclude(),
            order: [['createDate', 'DESC']]
        });

        // Filter tasks based on recurrence logic AND dependency status
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const filteredTasks = tasks.filter(task => {
            try {
                // 0. Inject Execution Status for Recurring Tasks (Context: Today)
                if (task.isRecurring && task.Executions) {
                    const todayExecution = task.Executions.find(ex => ex.date === todayStr);
                    if (todayExecution) {
                        task.status = todayExecution.status; // Override status for display/logic
                    }
                }



                // 2. Recurrence Logic
                const showRecurring = shouldShowRecurringTask(task);
                if (!showRecurring) return false;

                // 3. Dependency Logic
                // If the task has prerequisites, checks if ALL of them are "Completed".
                // If any prerequisite is NOT Completed, we verify if the task is blocked.
                // NOTE: 'Prerequisites' comes from `include: { model: Task, as: 'Prerequisites' }`
                if (req.query.includeBlocked === 'true') {
                    // Skip dependency checks if includeBlocked is requested
                } else if (task.Prerequisites && task.Prerequisites.length > 0) {
                    // Check if any prerequisite blocks this task
                    const isBlocked = task.Prerequisites.some(prereq => {
                        let prereqStatus = prereq.status;
                        // We also need to check if the prerequisite is recurring and has an execution for today
                        if (prereq.isRecurring && prereq.Executions) {
                            const prereqExecution = prereq.Executions.find(ex => ex.date === todayStr);
                            if (prereqExecution) {
                                prereqStatus = prereqExecution.status;
                            }
                        }

                        if (prereq.isRecurring) {
                            // Recurring tasks must be 'Finalizada' to satisfy dependency
                            return prereqStatus !== 'Completed';
                        } else {
                            // Non-recurring tasks must be 'Completed' to satisfy dependency
                            return prereqStatus !== 'Completed';
                        }
                    });

                    if (isBlocked) {
                        return false;
                    }
                }

                return true;
            } catch (error) {
                console.error('Error filtering task:', task.id, error);
                return true; // Fail safe: show task if error
            }
        });


        res.json(filteredTasks);
    } catch (err) {
        console.error('Error in getTasks:', err);
        res.status(500).json({ message: req.t('errors.fetchTasksError') });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({
            where: { id: req.params.id, userId: req.user.id, deleted: false },
            include: getTaskDetailsInclude()
        });
        if (!task) return res.status(404).json({ message: req.t('errors.taskNotFound') });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateTask = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id, deleted: false } });
        if (!task) {
            await t.rollback();
            return res.status(404).json({ message: req.t('errors.taskNotFound') });
        }

        let { title, description, date, status, priority, tags, subtasks, dependencies, isRecurring, recurrenceType, recurrenceDays, active } = req.body;
        if (date === '' || date === 'Invalid date') date = null;



        // --- Recurring Task Execution Logic ---
        // If it's a recurring task AND a date is provided, we treat this as a potentially specific execution update.
        // req.body.date should act as the specific Occurrence Date.

        let targetExecution = null;

        if (task.isRecurring || isRecurring) {
            // For recurring tasks, Definition Updates (Title, Description, Recurrence) go to Task table.
            // Execution Updates (Status, Subtask Check) go to TaskExecution table.

            // Check if we have a date context.
            if (date) {
                // Try to find an existing execution or prepare to create one

                // Create Execution if it doesn't exist.
                // We do this to ensure we can save "un-checked" states for subtasks or status.
                // Even if status is Pending and Subtasks false, we might be correcting a previous execution 
                // OR overriding a default "Completed" definition (though we froze definition status).

                targetExecution = await TaskExecution.findOne({
                    where: { taskId: task.id, date: date, userId: req.user.id },
                    transaction: t
                });

                if (!targetExecution) {
                    targetExecution = await TaskExecution.create({
                        taskId: task.id,
                        date: date,
                        status: status || 'Pending',
                        userId: req.user.id
                    }, { transaction: t });
                } else {
                    // Update existing execution status
                    if (status) {
                        await targetExecution.update({ status }, { transaction: t });
                    }
                }
            }
        }

        // --- Task Definition Update ---
        // Always update the definition for Title, Description, Priority, Tags.
        // Status: Only update Task definition status if NOT recurring (or if we decide to execute "Global" finish).
        // For now, Recurring Task Definition status is ignored/kept as Pending.

        // Prepare Definition Update Data
        let definitionUpdate = { title, description, priority, isRecurring, recurrenceType, recurrenceDays, active };

        // [NEW] Handle inactivatedAt logic
        if (active !== undefined) {
            if (active === false && task.active !== false) {
                // Transitioning to inactive
                definitionUpdate.inactivatedAt = new Date();
            } else if (active === true) {
                // Transitioning to active
                definitionUpdate.inactivatedAt = null;
            }
        }

        if (!task.isRecurring && !isRecurring) {
            // Non-recurring: Update status and date directly
            definitionUpdate.status = status;
            definitionUpdate.date = date;
        } else {
            // Recurring: Date in definition is the Start Date.
            // If the user CHANGED the start date (e.g. via modal date picker which sends 'date'), update it?
            // This is ambiguous. If I click on Dec 25th card and change title, 'date' is sent as Dec 25.
            // If I save that to 'date' of Definition, I move the start date to Dec 25, breaking history?
            // YES. 
            // FIX: If recurring, do NOT update `date` of definition based on occurrence edit, unless explicitly requested.
            // But we don't have explicit flag.
            // Compromise: Don't update date of definition for Recurring tasks in this path.
        }

        await task.update(definitionUpdate, { transaction: t });

        // Update Tags (Definition)
        if (tags) {
            if (tags.length > 10) {
                await t.rollback();
                return res.status(400).json({ message: req.t('errors.maxTagsError') });
            }
            const tagInstances = [];
            for (const tagItem of tags) {
                const tagName = typeof tagItem === 'object' ? tagItem.name : tagItem;
                const tagColor = typeof tagItem === 'object' ? tagItem.color : null;

                let tag = await Tag.findOne({ where: { name: tagName } });
                if (!tag) {
                    let color = tagColor || TaskHelper.getRandomColor();
                    if (!tagColor) {
                        let colorExists = await Tag.findOne({ where: { color } });
                        while (colorExists) {
                            color = TaskHelper.getRandomColor();
                            colorExists = await Tag.findOne({ where: { color } });
                        }
                    }
                    tag = await Tag.create({ name: tagName, color }, { transaction: t });
                }
                tagInstances.push(tag);
            }
            await task.setTags(tagInstances, { transaction: t });
        }

        // Update Subtasks
        // Logic: Sync Subtask Definitions. 
        // AND if targetExecution exists, update SubtaskExecutions.

        if (subtasks) {
            // 1. Sync Subtask Definitions (Titles, existence)
            const currentSubtasks = await Subtask.findAll({ where: { taskId: task.id } }, { transaction: t });
            const incomingIds = subtasks.filter(s => s.id).map(s => s.id);

            // Delete removed subtasks (Definition)
            // Note: This cascade deletes SubtaskExecution due to FK constraints usually, or we should check.
            await Subtask.destroy({ where: { taskId: task.id, id: { [Op.notIn]: incomingIds } }, transaction: t });

            const subtaskMap = {}; // Map definition ID to new state

            for (const sub of subtasks) {
                let subtaskDef;
                // Use index from loop for order
                const currentOrder = subtasks.indexOf(sub);

                if (sub.id) {
                    subtaskDef = await Subtask.findOne({ where: { id: sub.id }, transaction: t });
                    if (subtaskDef) await subtaskDef.update({ title: sub.title, order: currentOrder }, { transaction: t });
                } else {
                    subtaskDef = await Subtask.create({ title: sub.title, completed: false, taskId: task.id, order: currentOrder }, { transaction: t });
                }
                if (subtaskDef) {
                    subtaskMap[subtaskDef.id] = sub; // Store incoming data (with completed status)
                }
            }

            // 2. Update Subtask Executions (If we are in an execution context)
            if (targetExecution) {
                for (const defId in subtaskMap) {
                    const subData = subtaskMap[defId];
                    const isCompleted = subData.completed;

                    const [subExec, created] = await SubtaskExecution.findOrCreate({
                        where: { taskExecutionId: targetExecution.id, subtaskId: defId },
                        defaults: { completed: isCompleted },
                        transaction: t
                    });

                    if (!created) {
                        await subExec.update({ completed: isCompleted }, { transaction: t });
                    }
                }
            }
            // Legacy/Non-recurring: Update 'completed' on definition
            else if (!task.isRecurring && !isRecurring) {
                for (const sub of subtasks) {
                    if (sub.id) {
                        await Subtask.update({ completed: sub.completed }, { where: { id: sub.id }, transaction: t });
                    }
                }
            }
        }

        // Update Dependencies
        if (dependencies) {
            await task.setPrerequisites(dependencies, { transaction: t });
        }

        await t.commit();

        // Audit Log
        await Log.create({
            level: 'info',
            message: `Task updated: ${task.title}`,
            meta: { userId: req.user.id, taskId: task.id, updates: req.body }
        });

        const updatedTask = await Task.findByPk(task.id, {
            include: getTaskDetailsInclude()
        });
        res.json(updatedTask);
    } catch (err) {
        console.error("Update Error", err);
        await t.rollback();
        res.status(500).json({ message: req.t('errors.updateTaskError') });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id, deleted: false } });
        if (!task) return res.status(404).json({ message: req.t('errors.taskNotFound') });

        await task.update({ deleted: true });

        // Audit Log
        await Log.create({
            level: 'info',
            message: `Task deleted: ${task.title}`,
            meta: { userId: req.user.id, taskId: task.id }
        });

        res.json({ message: req.t('success.taskDeleted') });
    } catch (err) {
        res.status(500).json({ message: req.t('errors.deleteTaskError') });
    }
};

const duplicateTask = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = req.user.id;

        // 1. Fetch Source Task
        const sourceTask = await Task.findOne({
            where: { id, userId, deleted: false },
            include: getTaskDetailsInclude()
        });

        if (!sourceTask) {
            await t.rollback();
            return res.status(404).json({ message: req.t('errors.taskNotFound') });
        }

        // 2. Validate New Title
        const existingTask = await Task.findOne({
            where: {
                userId,
                title: { [Op.iLike]: title }, // Case insensitive check
                deleted: false
            }
        });

        if (existingTask) {
            await t.rollback();
            return res.status(400).json({ message: req.t('errors.taskAlreadyExists') });
        }

        // 3. Create New Task
        // Copy properties
        const { description, date, status, priority, isRecurring, recurrenceType, recurrenceDays, active } = sourceTask;

        const newTask = await Task.create({
            title,
            description,
            date,
            status,
            priority,
            userId,
            isRecurring,
            recurrenceType,
            recurrenceDays,
            active
        }, { transaction: t });

        // 4. Copy Associations

        // Tags
        if (sourceTask.Tags && sourceTask.Tags.length > 0) {
            await newTask.addTags(sourceTask.Tags, { transaction: t });
        }

        // Subtasks
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

        // Dependencies (Prerequisites)
        if (sourceTask.Prerequisites && sourceTask.Prerequisites.length > 0) {
            await newTask.addPrerequisites(sourceTask.Prerequisites, { transaction: t });
        }

        await t.commit();

        await Log.create({
            level: 'info',
            message: `Task duplicated: ${sourceTask.title} -> ${title}`,
            meta: { userId, originalTaskId: sourceTask.id, newTaskId: newTask.id }
        });

        const taskWithDetails = await Task.findByPk(newTask.id, {
            include: getTaskDetailsInclude()
        });

        res.status(201).json(taskWithDetails);

    } catch (err) {
        await t.rollback();
        console.error('Error in duplicateTask:', err);
        res.status(500).json({ message: req.t('errors.createTaskError') });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    duplicateTask
};


