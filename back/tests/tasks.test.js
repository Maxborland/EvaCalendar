const request = require('supertest');
const { app } = require('../index.js');
const knex = require('../db.cjs');

describe('Task API Endpoints', () => {
    let mainUserToken, otherUserToken;
    let mainUserId, otherUserId;
    let childUuid, categoryUuid;

    beforeAll(async () => {
        // Создаем двух пользователей для тестов
        const mainUser = { username: `mainuser_${Date.now()}`, email: `main_${Date.now()}@test.com`, password: 'password123' };
        const otherUser = { username: `otheruser_${Date.now()}`, email: `other_${Date.now()}@test.com`, password: 'password123' };

        let res = await request(app).post('/api/auth/register').send(mainUser);
        expect(res.statusCode).toBe(201);
        res = await request(app).post('/api/auth/login').send({ identifier: mainUser.email, password: 'password123' });
        mainUserToken = res.body.token;
        mainUserId = res.body.user.uuid;

        res = await request(app).post('/api/auth/register').send(otherUser);
        expect(res.statusCode).toBe(201);
        res = await request(app).post('/api/auth/login').send({ identifier: otherUser.email, password: 'password123' });
        otherUserToken = res.body.token;
        otherUserId = res.body.user.uuid;

        // Создаем дочерние сущности
        res = await request(app).post('/api/children').set('Authorization', `Bearer ${mainUserToken}`).send({
            childName: 'Test Child',
            parentName: 'Test Parent',
            parentPhone: '1234567890',
            address: 'Test Address',
            hourlyRate: 100
        });
        expect(res.statusCode).toBe(201);
        childUuid = res.body.uuid;

        res = await request(app).post('/api/expense-categories').set('Authorization', `Bearer ${mainUserToken}`).send({ categoryName: 'Test Category' });
        expect(res.statusCode).toBe(201);
        categoryUuid = res.body.uuid;
    });

    afterAll(async () => {
        await knex('users').where('email', 'like', '%@test.com').del();
        // Проверяем, что UUID существуют перед удалением
        if (childUuid) {
            await knex('children').where({ uuid: childUuid }).del();
        }
        if (categoryUuid) {
            await knex('expense_categories').where({ uuid: categoryUuid }).del();
        }
        await knex.destroy();
    });

    describe('POST /api/tasks', () => {
        it('should create a new task of type "task"', async () => {
            const taskData = {
                type: 'task',
                title: 'A simple task',
                dueDate: '2025-12-31',
            };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('uuid');
            expect(res.body.type).toBe('task');
            expect(res.body.title).toBe(taskData.title);
            expect(res.body.creator_uuid).toBe(mainUserId);
            expect(res.body.user_uuid).toBe(mainUserId); // По умолчанию назначен на создателя
        });

        it('should create a new task of type "income"', async () => {
            const taskData = {
                type: 'income',
                dueDate: '2025-12-31',
                amount: 100,
                child_uuid: childUuid,
            };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            expect(res.statusCode).toBe(201);
            expect(res.body.type).toBe('income');
            expect(res.body.amountEarned).toBe(100);
            expect(res.body.child_uuid).toBe(childUuid);
            expect(res.body.user_uuid).toBe(mainUserId);
        });

        it('should create a new task of type "expense"', async () => {
            const taskData = {
                type: 'expense',
                dueDate: '2025-12-31',
                amount: 50,
                expense_category_uuid: categoryUuid,
            };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            expect(res.statusCode).toBe(201);
            expect(res.body.type).toBe('expense');
            expect(res.body.amountSpent).toBe(50);
            expect(res.body.expense_category_uuid).toBe(categoryUuid);
            expect(res.body.user_uuid).toBe(mainUserId);
        });

        it('should correctly calculate reminder_at from reminder_offset', async () => {
            const taskData = {
                type: 'task',
                title: 'Task with reminder offset',
                dueDate: '2025-12-25',
                time: '10:00:00',
                reminder_offset: '1 day',
            };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            expect(res.statusCode).toBe(201);
            const expectedReminderAt = '2025-12-24T10:00:00.000Z';
            expect(new Date(res.body.reminder_at).toISOString()).toBe(expectedReminderAt);
        });

        it('should fail to create income/expense assigned to another user', async () => {
            const incomeData = { type: 'income', dueDate: '2025-01-01', assigned_to_id: otherUserId };
            const expenseData = { type: 'expense', dueDate: '2025-01-01', assigned_to_id: otherUserId };

            const incomeRes = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(incomeData);
            expect(incomeRes.statusCode).toBe(400);
            expect(incomeRes.body.message).toBe('Income/expense can only be assigned to the creator.');

            const expenseRes = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(expenseData);
            expect(expenseRes.statusCode).toBe(400);
            expect(expenseRes.body.message).toBe('Income/expense can only be assigned to the creator.');
        });

        it('should fail to create a task with monetary fields', async () => {
            const taskData = { type: 'task', title: 'Invalid Task', dueDate: '2025-01-01', amount: 100 };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Tasks cannot have amountEarned or amountSpent.');
        });
    });

    describe('Task Delegation', () => {
        let taskId;
        beforeEach(async () => {
            const taskData = { type: 'task', title: 'Delegatable Task', dueDate: '2025-11-11' };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            taskId = res.body.uuid;
        });

        it('should assign a task to another user', async () => {
            const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: otherUserId });
            expect(res.statusCode).toBe(200);
            expect(res.body.user_uuid).toBe(otherUserId);
            expect(res.body.assignee_username).toBe((await knex('users').where({uuid: otherUserId}).first()).username);
        });

        it('assignee should see the delegated task', async () => {
            await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: otherUserId });
            const res = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${otherUserToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.uuid).toBe(taskId);
        });

        it('creator should still see the delegated task', async () => {
            await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: otherUserId });
            const res = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.uuid).toBe(taskId);
        });

        it('should allow creator to reassign the task', async () => {
             await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: otherUserId });
             const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: mainUserId });
             expect(res.statusCode).toBe(200);
             expect(res.body.user_uuid).toBe(mainUserId);
        });

        it('should forbid assignee from reassigning the task', async () => {
            await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: otherUserId });
            const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${otherUserToken}`).send({ assigned_to_id: mainUserId });
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('Only the creator can reassign the task');
        });
    });

    describe('GET /api/users/assignable', () => {
        it('should return a list of users to whom a task can be assigned', async () => {
            const res = await request(app).get('/api/users/assignable').set('Authorization', `Bearer ${mainUserToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            // Проверяем, что в списке есть другие пользователи, но нет текущего
            const userIds = res.body.map(u => u.uuid);
            expect(userIds).toContain(otherUserId);
            expect(userIds).not.toContain(mainUserId);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        let taskId;
        beforeEach(async () => {
            const taskData = { type: 'task', title: 'Task to Delete', dueDate: '2025-10-10' };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            taskId = res.body.uuid;
        });

        it('should allow creator to delete a task', async () => {
            const res = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`);
            expect(res.statusCode).toBe(204);

            const checkRes = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`);
            expect(checkRes.statusCode).toBe(404);
        });

        it('should forbid assignee from deleting a task', async () => {
            await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send({ assigned_to_id: otherUserId });
            const res = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${otherUserToken}`);
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('Only the creator can delete the task');
        });
    });
describe('PUT /api/tasks/:id', () => {
        let taskId;
        let newCategoryUuid;

        beforeAll(async () => {
            // Создаем еще одну категорию для теста
            const res = await request(app).post('/api/expense-categories').set('Authorization', `Bearer ${mainUserToken}`).send({ categoryName: 'New Test Category' });
            expect(res.statusCode).toBe(201);
            newCategoryUuid = res.body.uuid;
        });

        afterAll(async () => {
            if (newCategoryUuid) {
                await knex('expense_categories').where({ uuid: newCategoryUuid }).del();
            }
        });

        beforeEach(async () => {
            // Создаем задачу типа "расход" для каждого теста
            const taskData = {
                type: 'expense',
                title: 'Expense to update',
                dueDate: '2025-07-07',
                amount: 150,
                expense_category_uuid: categoryUuid,
            };
            const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${mainUserToken}`).send(taskData);
            taskId = res.body.uuid;
        });

        it('should update the category of an expense task', async () => {
            const updateData = {
                expense_category_uuid: newCategoryUuid,
            };

            const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('uuid', taskId);
            expect(res.body).toHaveProperty('expense_category_uuid', newCategoryUuid);

            // Дополнительно проверим в базе
            const taskInDb = await knex('tasks').where({ uuid: taskId }).first();
            expect(taskInDb.expense_category_uuid).toBe(newCategoryUuid);
        });

        it('should successfully update a task even with extra fields in payload', async () => {
            const updateData = {
                title: 'Updated Title with Extra Stuff',
                someExtraField: 'this should be ignored',
                expenseCategoryName: 'also ignored'
            };

            const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${mainUserToken}`).send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('uuid', taskId);
            expect(res.body).toHaveProperty('title', 'Updated Title with Extra Stuff');
            expect(res.body).not.toHaveProperty('someExtraField');

            // Проверим в базе, что лишние поля не попали
            const taskInDb = await knex('tasks').where({ uuid: taskId }).first();
            expect(taskInDb.title).toBe('Updated Title with Extra Stuff');
            expect(taskInDb).not.toHaveProperty('someExtraField');
        });
    });
});