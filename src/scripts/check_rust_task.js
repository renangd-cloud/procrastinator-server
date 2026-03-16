require('dotenv').config();
const { sequelize, User, Task, Subtask, TaskExecution, SubtaskExecution } = require('../models');
const { connectMongo } = require('../config/db');

const checkTask = async () => {
    try {
        await sequelize.authenticate();
        await connectMongo();
        console.log('Connected to DB');

        const tasks = await Task.findAll({
            where: { title: 'Treino de Rust' },
            include: [Subtask]
        });

        for (const task of tasks) {
            console.log(`Task: ${task.title} (ID: ${task.id})`);
            console.log(`  Recurring: ${task.isRecurring}`);
            console.log(`  LastCompleted: ${task.lastCompletedDate}`);
            console.log('  Subtasks (Definition):');
            task.Subtasks.forEach(s => {
                console.log(`    - ${s.title}: ${s.completed}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
};

checkTask();
