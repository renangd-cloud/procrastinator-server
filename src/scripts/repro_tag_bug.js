const { sequelize } = require('../config/db');
const { Tag } = require('../models');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const color = '#123456';

        // Ensure clean state for test
        await Tag.destroy({ where: { color } });

        console.log('Creating Tag1...');
        await Tag.create({ name: 'Tag1', color });
        console.log('Tag1 created.');

        console.log('Creating Tag2 with same color...');
        try {
            await Tag.create({ name: 'Tag2', color });
            console.log('Tag2 created (Unexpected if unique constraint exists).');
        } catch (e) {
            console.log('Tag2 creation failed as expected:', e.name, e.message);
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await sequelize.close();
    }
};

run();
