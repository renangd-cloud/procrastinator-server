
const { sequelize, User, Task, TaskDependency } = require('../models');
const { getTasks } = require('../controllers/taskController');

// Mock Request and Response
const mockReq = (user) => ({
    user,
    t: (key) => key // Mock translation
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runVerification() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Setup User
        const user = await User.findOne(); // Grab first user
        if (!user) {
            console.error('No user found to run test.');
            return;
        }
        console.log(`Using user: ${user.email} (${user.id})`);

        // 2. Setup Tasks
        console.log('Creating test tasks...');
        const prereqTask = await Task.create({
            title: 'Test Prerequisite Task',
            userId: user.id,
            status: 'Pending'
        });

        const dependentTask = await Task.create({
            title: 'Test Dependent Task',
            userId: user.id,
            status: 'Pending'
        });

        // Add Dependency
        await dependentTask.addPrerequisite(prereqTask);
        console.log(`Created Prerequisite (${prereqTask.id}) and Dependent (${dependentTask.id})`);

        // 3. Test Case 1: Dependent Task should be HIDDEN (Prereq is Pending)
        console.log('\n--- Test Case 1: Prereq Pending ---');
        let req = mockReq(user);
        let res = mockRes();

        // We can't easily invoke the controller directly without mocking Express heavily or importing internal non-exported functions if we just use `getTasks`.
        // `getTasks` is exported. Let's use it.
        await getTasks(req, res);

        let tasks = res.data;
        let found = tasks.find(t => t.id === dependentTask.id);

        if (found) {
            console.error('FAIL: Dependent Task was found but should be hidden.');
        } else {
            console.log('PASS: Dependent Task is hidden.');
        }

        // 4. Test Case 2: Dependent Task should be VISIBLE (Prereq is Completed)
        console.log('\n--- Test Case 2: Prereq Completed ---');
        await prereqTask.update({ status: 'Completed' });

        req = mockReq(user);
        res = mockRes();
        await getTasks(req, res);

        tasks = res.data;
        found = tasks.find(t => t.id === dependentTask.id);

        if (found) {
            console.log('PASS: Dependent Task is visible.');
        } else {
            console.error('FAIL: Dependent Task is hidden but should be visible.');
        }

        // --- NEW TEST CASES FOR RECURRING ---

        // 5. Test Case 3: Recurring Prereq "Completed" should BLOCK (Needs "Finalizada")
        console.log('\n--- Test Case 3: Recurring Prereq Completed (Should Block) ---');
        await prereqTask.update({ isRecurring: true, status: 'Completed' });

        req = mockReq(user);
        res = mockRes();
        await getTasks(req, res);

        tasks = res.data;
        found = tasks.find(t => t.id === dependentTask.id);

        if (found) {
            console.error('FAIL: Dependent Task is visible but should be hidden (Recurring Prereq is only Completed).');
        } else {
            console.log('PASS: Dependent Task is hidden.');
        }

        // 6. Test Case 4: Recurring Prereq "Finalizada" should UNBLOCK
        console.log('\n--- Test Case 4: Recurring Prereq Finalizada (Should Unblock) ---');
        await prereqTask.update({ status: 'Finalizada' });

        req = mockReq(user);
        res = mockRes();
        await getTasks(req, res);

        tasks = res.data;
        found = tasks.find(t => t.id === dependentTask.id);

        if (found) {
            console.log('PASS: Dependent Task is visible.');
        } else {
            console.error('FAIL: Dependent Task is hidden but should be visible (Recurring Prereq is Finalizada).');
        }

        // 7. Cleanup
        console.log('\nCleaning up...');
        await dependentTask.destroy();
        await prereqTask.destroy();
        // Note: Dependencies in join table should cascade delete or we might leave orphans if not configured, 
        // but for this test it's fine.

        console.log('Verification finished.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
}

runVerification();
