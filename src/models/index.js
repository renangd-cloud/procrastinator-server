const User = require('./User');
const Task = require('./Task');
const Subtask = require('./Subtask');
const Tag = require('./Tag');
const TaskDependency = require('./TaskDependency');

const TaskExecution = require('./TaskExecution');
const SubtaskExecution = require('./SubtaskExecution');

// User - Task Association
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

// Task - Subtask Association
Task.hasMany(Subtask, { foreignKey: 'taskId' });
Subtask.belongsTo(Task, { foreignKey: 'taskId' });

// Task - Tag Association (Many-to-Many)
Task.belongsToMany(Tag, { through: 'task_tags' });
Tag.belongsToMany(Task, { through: 'task_tags' });

// Task - Task Dependency (Self-referential Many-to-Many)
Task.belongsToMany(Task, {
    as: 'Prerequisites',
    through: TaskDependency,
    foreignKey: 'taskId',
    otherKey: 'dependencyId'
});
Task.belongsToMany(Task, {
    as: 'Dependents',
    through: TaskDependency,
    foreignKey: 'dependencyId',
    otherKey: 'taskId'
});

// Task - TaskExecution Association
Task.hasMany(TaskExecution, { foreignKey: 'taskId', as: 'Executions' });
TaskExecution.belongsTo(Task, { foreignKey: 'taskId' });

// User - TaskExecution Association
User.hasMany(TaskExecution, { foreignKey: 'userId' });
TaskExecution.belongsTo(User, { foreignKey: 'userId' });

// TaskExecution - SubtaskExecution Association
TaskExecution.hasMany(SubtaskExecution, { foreignKey: 'taskExecutionId', as: 'SubtaskExecutions' });
SubtaskExecution.belongsTo(TaskExecution, { foreignKey: 'taskExecutionId' });

// Subtask - SubtaskExecution Association
Subtask.hasMany(SubtaskExecution, { foreignKey: 'subtaskId' });
SubtaskExecution.belongsTo(Subtask, { foreignKey: 'subtaskId' });

const { sequelize } = require('../config/db');

module.exports = {
    sequelize,
    User,
    Task,
    Subtask,
    Tag,
    TaskDependency,
    TaskExecution,
    SubtaskExecution
};
