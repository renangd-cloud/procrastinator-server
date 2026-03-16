
const { sequelize, User, Task, Subtask } = require('../models');

async function runVerification() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Setup User
        const user = await User.findOne();
        if (!user) {
            console.error('No user found to run test.');
            return;
        }

        // 2. Create Task with Subtasks
        console.log('Creating task with subtasks...');
        const task = await Task.create({
            title: 'Test Subtask Order',
            userId: user.id
        });

        // Add 3 subtasks
        const sub1 = await Subtask.create({ title: 'Subtask 1', taskId: task.id, order: 0 });
        const sub2 = await Subtask.create({ title: 'Subtask 2', taskId: task.id, order: 1 });
        const sub3 = await Subtask.create({ title: 'Subtask 3', taskId: task.id, order: 2 });

        // 3. Verify Order
        let fetchedTask = await Task.findByPk(task.id, {
            include: [{ model: Subtask }]
        });

        // Sequelize inclusion order isn't guaranteed unless specified in model/query, but let's check values
        // Ideally controller handles sort, but we want to verify DB persistence.
        let subtasks = fetchedTask.Subtasks.sort((a, b) => a.order - b.order);

        console.log('Initial Order:');
        subtasks.forEach(s => console.log(`${s.order}: ${s.title}`));

        if (subtasks[0].title !== 'Subtask 1' || subtasks[2].title !== 'Subtask 3') {
            console.error('FAIL: Initial order is incorrect.');
        }

        // 4. Update Order (Simulate Controller Logic)
        console.log('\nReordering subtasks (1 -> 2, 2 -> 0, 3 -> 1)...');
        // New order: Subtask 2, Subtask 3, Subtask 1
        await sub2.update({ order: 0 });
        await sub3.update({ order: 1 });
        await sub1.update({ order: 2 });

        fetchedTask = await Task.findByPk(task.id, {
            include: [{ model: Subtask }]
        });
        subtasks = fetchedTask.Subtasks.sort((a, b) => a.order - b.order);

        console.log('New Order:');
        subtasks.forEach(s => console.log(`${s.order}: ${s.title}`));

        if (subtasks[0].title === 'Subtask 2' && subtasks[1].title === 'Subtask 3' && subtasks[2].title === 'Subtask 1') {
            console.log('PASS: Subtask order updated successfully.');
        } else {
            console.error('FAIL: Reorder failed.');
        }

        // 5. Cleanup
        await task.destroy(); // Should cascade subtasks
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
}

runVerification();
