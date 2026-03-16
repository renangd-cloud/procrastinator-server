require('dotenv').config();
const { sequelize, Task, Subtask } = require('../models');
const { connectMongo } = require('../config/db');

const fixInconsistency = async () => {
    try {
        await sequelize.authenticate();
        await connectMongo();
        console.log('Connected to DB');

        const tasks = await Task.findAll({
            where: { title: 'Treino de Rust', isRecurring: true },
            include: [Subtask]
        });

        for (const task of tasks) {
            console.log(`Fixing task: ${task.title} (${task.id})`);

            // Fix subtasks definition -> Set to false
            for (const sub of task.Subtasks) {
                if (sub.completed) {
                    console.log(`  Resetting subtask '${sub.title}' to false (was true)`);
                    await sub.update({ completed: false });
                }
            }
        }

        console.log('Fix complete.');

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
};

fixInconsistency();
