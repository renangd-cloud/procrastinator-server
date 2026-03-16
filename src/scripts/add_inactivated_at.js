const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Add 'inactivatedAt' column
        try {
            await sequelize.query(`ALTER TABLE "tasks" ADD COLUMN "inactivatedAt" TIMESTAMP WITH TIME ZONE;`);
            console.log('Added "inactivatedAt" column to "tasks" table.');
        } catch (err) {
            if (err.original && err.original.code === '42701') { // duplicate column
                console.log('"inactivatedAt" column already exists.');
            } else {
                console.error('Error adding "inactivatedAt" column:', err.message);
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
