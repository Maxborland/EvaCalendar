const request = require('supertest');
const { app } = require('../index.js');
const knex = require('../db.cjs');

describe('Family API Endpoints', () => {
    let ownerToken, memberToken, outsiderToken;
    let ownerUserId, memberUserId, outsiderUserId;
    let memberEmail;

    beforeAll(async () => {
        const ts = Date.now();
        const ownerUser = { username: `owner_${ts}`, email: `owner_${ts}@test.com`, password: 'password123' };
        const memberUser = { username: `member_${ts}`, email: `member_${ts}@test.com`, password: 'password123' };
        const outsiderUser = { username: `outsider_${ts}`, email: `outsider_${ts}@test.com`, password: 'password123' };

        let res = await request(app).post('/api/auth/register').send(ownerUser);
        expect(res.statusCode).toBe(201);
        res = await request(app).post('/api/auth/login').send({ identifier: ownerUser.email, password: 'password123' });
        ownerToken = res.body.token;
        ownerUserId = res.body.user.uuid;

        res = await request(app).post('/api/auth/register').send(memberUser);
        expect(res.statusCode).toBe(201);
        res = await request(app).post('/api/auth/login').send({ identifier: memberUser.email, password: 'password123' });
        memberToken = res.body.token;
        memberUserId = res.body.user.uuid;
        memberEmail = memberUser.email;

        res = await request(app).post('/api/auth/register').send(outsiderUser);
        expect(res.statusCode).toBe(201);
        res = await request(app).post('/api/auth/login').send({ identifier: outsiderUser.email, password: 'password123' });
        outsiderToken = res.body.token;
        outsiderUserId = res.body.user.uuid;
    });

    afterAll(async () => {
        await knex('family_invitations').whereIn('family_uuid',
            knex('families').select('uuid').whereIn('owner_uuid', [ownerUserId, memberUserId, outsiderUserId])
        ).del();
        await knex('family_members').whereIn('family_uuid',
            knex('families').select('uuid').whereIn('owner_uuid', [ownerUserId, memberUserId, outsiderUserId])
        ).del();
        await knex('families').whereIn('owner_uuid', [ownerUserId, memberUserId, outsiderUserId]).del();
        await knex('tasks').whereIn('creator_uuid', [ownerUserId, memberUserId, outsiderUserId]).del();
        await knex('users').where('email', 'like', '%@test.com').del();
    });

    describe('GET /api/families/my', () => {
        it('should return null when user has no family', async () => {
            const res = await request(app)
                .get('/api/families/my')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeNull();
        });

        it('should require authentication', async () => {
            const res = await request(app).get('/api/families/my');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/families', () => {
        afterEach(async () => {
            // Очистка после каждого теста создания
            await knex('family_members').whereIn('family_uuid',
                knex('families').select('uuid').where('owner_uuid', ownerUserId)
            ).del();
            await knex('families').where('owner_uuid', ownerUserId).del();
        });

        it('should create a family', async () => {
            const res = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Тестовая семья' });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('uuid');
            expect(res.body.name).toBe('Тестовая семья');
            expect(res.body.owner_uuid).toBe(ownerUserId);
            expect(res.body.members).toHaveLength(1);
            expect(res.body.members[0].role).toBe('owner');
            expect(res.body.members[0].user_uuid).toBe(ownerUserId);
        });

        it('should reject empty name', async () => {
            const res = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: '   ' });
            expect(res.statusCode).toBe(400);
        });

        it('should reject creating second family', async () => {
            await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Первая' });

            const res = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Вторая' });
            expect(res.statusCode).toBe(409);
        });
    });

    describe('Family lifecycle (create → invite → accept → tasks → leave → delete)', () => {
        let familyUuid, invitationToken;

        it('Step 1: owner creates a family', async () => {
            const res = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Семья Тестовых' });
            expect(res.statusCode).toBe(201);
            familyUuid = res.body.uuid;
        });

        it('Step 2: GET /api/families/my returns family for owner', async () => {
            const res = await request(app)
                .get('/api/families/my')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.uuid).toBe(familyUuid);
            expect(res.body.memberRole).toBe('owner');
            expect(res.body.members).toHaveLength(1);
        });

        it('Step 3: owner updates family name', async () => {
            const res = await request(app)
                .put(`/api/families/${familyUuid}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Семья Обновлённых' });
            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Семья Обновлённых');
        });

        it('Step 4: outsider cannot update family', async () => {
            const res = await request(app)
                .put(`/api/families/${familyUuid}`)
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ name: 'Хакнутая семья' });
            expect(res.statusCode).toBe(403);
        });

        it('Step 5: owner creates invitation for member', async () => {
            const res = await request(app)
                .post(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ email: memberEmail });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.email).toBe(memberEmail);
            invitationToken = res.body.token;
        });

        it('Step 6: outsider cannot create invitations', async () => {
            const res = await request(app)
                .post(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ email: 'random@test.com' });
            expect(res.statusCode).toBe(403);
        });

        it('Step 7: duplicate invitation should be rejected', async () => {
            const res = await request(app)
                .post(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ email: memberEmail });
            expect(res.statusCode).toBe(409);
        });

        it('Step 8: owner sees pending invitations', async () => {
            const res = await request(app)
                .get(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].email).toBe(memberEmail);
        });

        it('Step 9: wrong user cannot accept invitation (email mismatch)', async () => {
            const res = await request(app)
                .post('/api/families/accept-invitation')
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ token: invitationToken });
            expect(res.statusCode).toBe(403);
        });

        it('Step 10: member accepts invitation', async () => {
            const res = await request(app)
                .post('/api/families/accept-invitation')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ token: invitationToken });
            expect(res.statusCode).toBe(200);
            expect(res.body.uuid).toBe(familyUuid);
            expect(res.body.members).toHaveLength(2);
        });

        it('Step 11: member who is already in family cannot accept another invite', async () => {
            // Создаём ещё одну семью от outsider и приглашение для member
            const family2 = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ name: 'Другая семья' });

            const inv = await request(app)
                .post(`/api/families/${family2.body.uuid}/invitations`)
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ email: memberEmail });

            const res = await request(app)
                .post('/api/families/accept-invitation')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ token: inv.body.token });
            expect(res.statusCode).toBe(409);

            // Очистка: удаляем вторую семью
            await knex('family_invitations').where({ family_uuid: family2.body.uuid }).del();
            await knex('family_members').where({ family_uuid: family2.body.uuid }).del();
            await knex('families').where({ uuid: family2.body.uuid }).del();
        });

        it('Step 12: GET /api/families/:uuid/members returns both members', async () => {
            const res = await request(app)
                .get(`/api/families/${familyUuid}/members`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
            const userIds = res.body.map(m => m.user_uuid);
            expect(userIds).toContain(ownerUserId);
            expect(userIds).toContain(memberUserId);
        });

        it('Step 13: member can also see members list', async () => {
            const res = await request(app)
                .get(`/api/families/${familyUuid}/members`)
                .set('Authorization', `Bearer ${memberToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it('Step 14: outsider cannot see members list', async () => {
            const res = await request(app)
                .get(`/api/families/${familyUuid}/members`)
                .set('Authorization', `Bearer ${outsiderToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('Step 15: assignable users includes family members', async () => {
            const res = await request(app)
                .get('/api/users/assignable')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(200);
            const userIds = res.body.map(u => u.uuid);
            expect(userIds).toContain(memberUserId);
            expect(userIds).not.toContain(ownerUserId);
        });

        describe('Family task visibility', () => {
            let familyTaskId;

            it('Step 16: owner creates task assigned to member → gets family_uuid', async () => {
                const res = await request(app)
                    .post('/api/tasks')
                    .set('Authorization', `Bearer ${ownerToken}`)
                    .send({
                        type: 'task',
                        title: 'Семейная задача',
                        dueDate: '2026-06-15',
                        assigned_to_id: memberUserId,
                    });
                expect(res.statusCode).toBe(201);
                expect(res.body.user_uuid).toBe(memberUserId);
                expect(res.body.family_uuid).toBe(familyUuid);
                familyTaskId = res.body.uuid;
            });

            it('Step 17: member sees the family task', async () => {
                const res = await request(app)
                    .get(`/api/tasks/${familyTaskId}`)
                    .set('Authorization', `Bearer ${memberToken}`);
                expect(res.statusCode).toBe(200);
                expect(res.body.uuid).toBe(familyTaskId);
            });

            it('Step 18: owner sees the family task', async () => {
                const res = await request(app)
                    .get(`/api/tasks/${familyTaskId}`)
                    .set('Authorization', `Bearer ${ownerToken}`);
                expect(res.statusCode).toBe(200);
            });

            it('Step 19: outsider cannot see the family task', async () => {
                const res = await request(app)
                    .get(`/api/tasks/${familyTaskId}`)
                    .set('Authorization', `Bearer ${outsiderToken}`);
                expect(res.statusCode).toBe(403);
            });

            it('Step 20: family task appears in member task list by date', async () => {
                const res = await request(app)
                    .get('/api/tasks/for-day?date=2026-06-15')
                    .set('Authorization', `Bearer ${memberToken}`);
                expect(res.statusCode).toBe(200);
                const ids = res.body.map(t => t.uuid);
                expect(ids).toContain(familyTaskId);
            });

            it('Step 21: family task appears in owner task list', async () => {
                const res = await request(app)
                    .get('/api/tasks')
                    .set('Authorization', `Bearer ${ownerToken}`);
                expect(res.statusCode).toBe(200);
                const ids = res.body.map(t => t.uuid);
                expect(ids).toContain(familyTaskId);
            });
        });

        it('Step 22: member cannot remove owner', async () => {
            const res = await request(app)
                .delete(`/api/families/${familyUuid}/members/${ownerUserId}`)
                .set('Authorization', `Bearer ${memberToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('Step 23: owner cannot leave (must delete)', async () => {
            const res = await request(app)
                .post('/api/families/leave')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('Step 24: member leaves the family', async () => {
            const res = await request(app)
                .post('/api/families/leave')
                .set('Authorization', `Bearer ${memberToken}`);
            expect(res.statusCode).toBe(204);

            // Проверяем, что осталась только owner
            const membersRes = await request(app)
                .get(`/api/families/${familyUuid}/members`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(membersRes.body).toHaveLength(1);
            expect(membersRes.body[0].user_uuid).toBe(ownerUserId);
        });

        it('Step 25: member no longer has family', async () => {
            const res = await request(app)
                .get('/api/families/my')
                .set('Authorization', `Bearer ${memberToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeNull();
        });

        it('Step 26: outsider cannot delete family', async () => {
            const res = await request(app)
                .delete(`/api/families/${familyUuid}`)
                .set('Authorization', `Bearer ${outsiderToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('Step 27: owner deletes the family', async () => {
            const res = await request(app)
                .delete(`/api/families/${familyUuid}`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(204);

            const check = await request(app)
                .get('/api/families/my')
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(check.body).toBeNull();
        });
    });

    describe('Invitation cancellation', () => {
        let familyUuid, invitationUuid;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Семья для отмены' });
            familyUuid = res.body.uuid;

            const inv = await request(app)
                .post(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ email: 'cancel_target@test.com' });
            invitationUuid = inv.body.uuid;
        }, 15000);

        afterAll(async () => {
            await knex('family_invitations').where({ family_uuid: familyUuid }).del();
            await knex('family_members').where({ family_uuid: familyUuid }).del();
            await knex('families').where({ uuid: familyUuid }).del();
        });

        it('should cancel a pending invitation', async () => {
            const res = await request(app)
                .delete(`/api/families/invitations/${invitationUuid}`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(204);

            const list = await request(app)
                .get(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(list.body).toHaveLength(0);
        });

        it('should return 404 for already cancelled invitation', async () => {
            const res = await request(app)
                .delete(`/api/families/invitations/${invitationUuid}`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(404);
        });
    });

    describe('Member removal by owner', () => {
        let familyUuid, invToken;

        beforeAll(async () => {
            // Создаём семью и добавляем member через invitation flow
            const fam = await request(app)
                .post('/api/families')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Семья для удаления' });
            familyUuid = fam.body.uuid;

            const inv = await request(app)
                .post(`/api/families/${familyUuid}/invitations`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ email: memberEmail });
            invToken = inv.body.token;

            await request(app)
                .post('/api/families/accept-invitation')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ token: invToken });
        }, 15000);

        afterAll(async () => {
            await knex('family_invitations').where({ family_uuid: familyUuid }).del();
            await knex('family_members').where({ family_uuid: familyUuid }).del();
            await knex('families').where({ uuid: familyUuid }).del();
        });

        it('owner removes member from family', async () => {
            const res = await request(app)
                .delete(`/api/families/${familyUuid}/members/${memberUserId}`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(res.statusCode).toBe(204);

            const members = await request(app)
                .get(`/api/families/${familyUuid}/members`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(members.body).toHaveLength(1);
        });
    });
});
