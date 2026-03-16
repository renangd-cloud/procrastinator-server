const sinon = require('sinon');
const assert = require('assert');
const taskController = require('../src/controllers/taskController');
const { Task, Tag, Subtask, sequelize } = require('../src/models');
const Log = require('../src/models/Log');

describe('Task Controller', () => {
    let req, res, sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        req = {
            body: {},
            user: { id: 'user-id' },
            params: {}
        };
        res = {
            json: sandbox.spy(),
            status: sandbox.stub().returnsThis()
        };

        // Mock transaction
        sandbox.stub(sequelize, 'transaction').resolves({
            commit: sandbox.stub(),
            rollback: sandbox.stub()
        });

        // Mock Log
        sandbox.stub(Log, 'create').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    after(async () => {
        await sequelize.close();
    });

    describe('createTask', () => {
        it('should create a task successfully with status and priority', async () => {
            req.body = {
                title: 'Test Task',
                date: new Date(),
                status: 'In Progress',
                priority: 'High'
            };

            const createStub = sandbox.stub(Task, 'create').resolves({
                id: 'task-id',
                title: 'Test Task',
                addTag: sandbox.stub(),
                addPrerequisites: sandbox.stub()
            });
            sandbox.stub(Task, 'findByPk').resolves({ id: 'task-id', title: 'Test Task' });

            await taskController.createTask(req, res);

            assert(createStub.calledOnce);
            const args = createStub.firstCall.args[0];
            assert.strictEqual(args.status, 'In Progress');
            assert.strictEqual(args.priority, 'High');
            assert(Log.create.calledOnce);
            assert(res.json.calledOnce);
        });

        it('should fail if more than 10 tags', async () => {
            req.body = {
                title: 'Test Task',
                tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
            };

            await taskController.createTask(req, res);

            assert(res.status.calledWith(400));
            assert(res.json.calledWith({ message: 'Max 10 tags per task' }));
        });
    });

    describe('updateTask', () => {
        it('should update a task successfully', async () => {
            req.params.id = 'task-id';
            req.body = { title: 'Updated Task' };

            const taskMock = {
                id: 'task-id',
                title: 'Old Task',
                update: sandbox.stub().resolves(),
                setTags: sandbox.stub().resolves(),
                setPrerequisites: sandbox.stub().resolves()
            };

            sandbox.stub(Task, 'findOne').resolves(taskMock);
            sandbox.stub(Task, 'findByPk').resolves(taskMock);

            await taskController.updateTask(req, res);

            assert(taskMock.update.calledOnce);
            assert(Log.create.calledOnce);
            assert(res.json.calledOnce);
        });
    });

    describe('deleteTask', () => {
        it('should logically delete a task', async () => {
            req.params.id = 'task-id';

            const taskMock = {
                id: 'task-id',
                title: 'Task to Delete',
                update: sandbox.stub().resolves()
            };

            sandbox.stub(Task, 'findOne').resolves(taskMock);

            await taskController.deleteTask(req, res);

            assert(taskMock.update.calledWith({ deleted: true }));
            assert(Log.create.calledOnce);
            assert(res.json.calledWith({ message: 'Task deleted' }));
        });
    });
});
