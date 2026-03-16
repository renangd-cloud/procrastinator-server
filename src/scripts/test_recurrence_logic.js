require('dotenv').config();
const { sequelize, User, Task, TaskExecution, SubtaskExecution } = require('../models');
const { connectMongo } = require('../config/db');
const { createTask, updateTask, getTasks } = require('../controllers/taskController');

// Mock Req/Res
const mockRes = () => {
    const res = {};
    res.json = (data) => { res.data = data; return res; };
    res.status = (code) => { res.statusCode = code; return res; };
    return res;
};

const runTest = async () => {
    try {
        await sequelize.authenticate();
        await connectMongo();
        console.log('Connected to DB');

        // user
        let user = await User.findOne();
        if (!user) {
            user = await User.create({ username: 'testuser', email: 'test@example.com', password: 'password' });
        }

        // 1. Create Recurring Task
        const reqCreate = {
            user: { id: user.id },
            body: {
                title: 'Recurring Test Task',
                recurencyType: 'Daily', // Typo in body? Controller uses recurrenceType
                recurrenceType: 'Daily',
                isRecurring: true,
                subtasks: [{ title: 'Sub 1', completed: false }]
            },
            t: (key) => key
        };
        const resCreate = mockRes();
        await createTask(reqCreate, resCreate);
        const task = resCreate.data;
        console.log('Created Task:', task.id, task.title);

        // 2. Update Execution (Complete Task on 2025-12-25)
        const reqUpdate1 = {
            params: { id: task.id },
            user: { id: user.id },
            body: {
                date: '2025-12-25',
                status: 'Completed',
                isRecurring: true // Frontend sends this
            },
            t: (key) => key
        };
        const resUpdate1 = mockRes();
        await updateTask(reqUpdate1, resUpdate1);
        console.log('Update 1 Response Status:', resUpdate1.statusCode || 200);

        // Verify Execution
        const execution1 = await TaskExecution.findOne({ where: { taskId: task.id, date: '2025-12-25' } });
        console.log('Execution 1 (2025-12-25):', execution1 ? execution1.status : 'NOT FOUND');

        // 3. Update Execution (Check Subtask on 2025-12-26)
        // Need subtask ID
        const subtaskId = task.Subtasks[0].id;
        const reqUpdate2 = {
            params: { id: task.id },
            user: { id: user.id },
            body: {
                date: '2025-12-26',
                isRecurring: true,
                subtasks: [{ id: subtaskId, title: 'Sub 1', completed: true }]
            },
            t: (key) => key
        };
        const resUpdate2 = mockRes();
        await updateTask(reqUpdate2, resUpdate2);

        // Verify Execution 2
        const execution2 = await TaskExecution.findOne({ where: { taskId: task.id, date: '2025-12-26' } });
        console.log('Execution 2 (2025-12-26):', execution2 ? 'Found' : 'NOT FOUND');

        if (execution2) {
            const subExec = await SubtaskExecution.findOne({ where: { taskExecutionId: execution2.id, subtaskId: subtaskId } });
            console.log('Subtask Execution (2025-12-26):', subExec ? subExec.completed : 'NOT FOUND');
        }

        // 4. Update Execution (UNCHECK Subtask on 2025-12-27)
        // Simulate scenario: Definition says "True" (let's assume, or just normal uncheck).
        // Even if definition is False, we want to ensure SubtaskExecution is created with False if we explicitly save.
        // Actually, if definition is False, saving False is redundant but harmless.
        // If definition was True, saving False is critical.
        // Let's just verify that an execution IS created even for "completed: false".

        const reqUpdate3 = {
            params: { id: task.id },
            user: { id: user.id },
            body: {
                date: '2025-12-27',
                isRecurring: true,
                subtasks: [{ id: subtaskId, title: 'Sub 1', completed: false }]
            },
            t: (key) => key
        };
        const resUpdate3 = mockRes();
        await updateTask(reqUpdate3, resUpdate3);

        const execution3 = await TaskExecution.findOne({ where: { taskId: task.id, date: '2025-12-27' } });
        console.log('Execution 3 (2025-12-27):', execution3 ? 'Found' : 'NOT FOUND'); // Should be Found now!
        if (execution3) {
            const subExec3 = await SubtaskExecution.findOne({ where: { taskExecutionId: execution3.id, subtaskId: subtaskId } });
            console.log('Subtask Execution (2025-12-27):', subExec3 ? subExec3.completed : 'NOT FOUND');
        }

        // Cleanup
        await Task.destroy({ where: { id: task.id }, force: true }); // force logical delete? No, destroy is logical usually if paranoid
        // actually existing delete logic in controller is just update deleted=true

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
};

runTest();
