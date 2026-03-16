const sinon = require('sinon');
const assert = require('assert');
const tagController = require('../src/controllers/tagController');
const { Tag, sequelize } = require('../src/models');
const Log = require('../src/models/Log');

describe('Tag Controller', () => {
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

    describe('createTag', () => {
        it('should create a tag successfully', async () => {
            req.body = { name: 'Urgent', color: '#FF0000' };

            const createStub = sandbox.stub(Tag, 'create').resolves({
                id: 'tag-id',
                name: 'Urgent',
                color: '#FF0000'
            });

            await tagController.createTag(req, res);

            assert(createStub.calledOnce);
            assert(Log.create.calledOnce);
            assert(res.json.calledOnce);
        });
    });

    describe('getTags', () => {
        it('should return all tags', async () => {
            const findAllStub = sandbox.stub(Tag, 'findAll').resolves([]);

            await tagController.getTags(req, res);

            assert(findAllStub.calledOnce);
            assert(res.json.calledOnce);
        });
    });

    describe('updateTag', () => {
        it('should update a tag', async () => {
            req.params.id = 'tag-id';
            req.body = { name: 'New Name' };

            const tagMock = {
                id: 'tag-id',
                update: sandbox.stub().resolves()
            };

            sandbox.stub(Tag, 'findByPk').resolves(tagMock);

            await tagController.updateTag(req, res);

            assert(tagMock.update.calledOnce);
            assert(Log.create.calledOnce);
            assert(res.json.calledOnce);
        });
    });

    describe('deleteTag', () => {
        it('should delete a tag', async () => {
            req.params.id = 'tag-id';

            const tagMock = {
                id: 'tag-id',
                name: 'Tag to delete',
                update: sandbox.stub().resolves()
            };

            sandbox.stub(Tag, 'findByPk').resolves(tagMock);

            await tagController.deleteTag(req, res);

            assert(tagMock.update.calledWith({ deleted: true }));
            assert(Log.create.calledOnce);
            assert(res.json.calledWith({ message: 'Tag deleted' }));
        });
    });
});
