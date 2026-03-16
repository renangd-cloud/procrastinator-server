const { sequelize } = require('../config/db');
const { Task, User } = require('../models');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const user = await User.findOne();
        if (!user) {
            console.error('No user found');
            process.exit(1);
        }
        console.log('Using user:', user.id);

        // Test 1: "escritorio"
        try {
            const task1 = await Task.create({
                title: 'escritorio',
                userId: user.id,
                status: 'Pending'
            });
            console.log('Test 1 (escritorio): Success', task1.id);
        } catch (e) {
            console.error('Test 1 (escritorio): Failed', e.message);
        }

        // Test 2: "Escritório"
        try {
            const task2 = await Task.create({
                title: 'Escritório',
                userId: user.id,
                status: 'Pending'
            });
            console.log('Test 2 (Escritório): Success', task2.id);
        } catch (e) {
            console.error('Test 2 (Escritório): Failed', e.message);
        }

        // Test 3: Long title
        try {
            const longTitle = 'a'.repeat(300);
            const task3 = await Task.create({
                title: longTitle,
                userId: user.id,
                status: 'Pending'
            });
            console.log('Test 3 (Long Title): Success', task3.id);
        } catch (e) {
            console.error('Test 3 (Long Title): Failed', e.message);
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await sequelize.close();
    }
};

run();
