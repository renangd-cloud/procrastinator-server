const { sequelize } = require('../config/db');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const [results, metadata] = await sequelize.query(`
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'tags' AND indexname LIKE 'tags_color_key%';
        `);

        console.log('Found indexes to drop:', results.map(r => r.indexname));

        for (const row of results) {
            try {
                await sequelize.query(`ALTER TABLE tags DROP CONSTRAINT "${row.indexname}";`);
                console.log(`Constraint ${row.indexname} dropped.`);
            } catch (e) {
                console.log(`Error dropping constraint ${row.indexname}:`, e.message);
                try {
                    await sequelize.query(`DROP INDEX "${row.indexname}";`);
                    console.log(`Index ${row.indexname} dropped.`);
                } catch (e2) {
                    console.log(`Error dropping index ${row.indexname}:`, e2.message);
                }
            }
        }

    } catch (err) {
        console.error('Global Error:', err);
    } finally {
        await sequelize.close();
    }
};

run();
