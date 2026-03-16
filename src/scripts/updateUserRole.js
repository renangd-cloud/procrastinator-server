const { sequelize } = require('../config/database');
const User = require('../models/User');

async function updateUserRole() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Find user by name
        const user = await User.findOne({
            where: {
                name: 'Renan Dantas'
            }
        });

        if (!user) {
            console.log('User "Renan Dantas" not found in database.');
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current role: ${user.role}`);

        // Update role to Admin
        user.role = 'Admin';
        await user.save();

        console.log(`Successfully updated role to: ${user.role}`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating user role:', error);
        process.exit(1);
    }
}

updateUserRole();
