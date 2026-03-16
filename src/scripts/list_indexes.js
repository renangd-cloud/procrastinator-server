const { sequelize } = require('../config/db');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const [results, metadata] = await sequelize.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'tags';
        `);

        console.log('Indexes on tags table:');
        results.forEach(row => {
            console.log(`- ${row.indexname}: ${row.indexdef}`);
        });

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await sequelize.close();
    }
};

run();
