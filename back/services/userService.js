const knex = require('../db.cjs');

const userService = {
    async getAssignableUsers(currentUserId) {
        const familyService = require('./familyService.js');
        const membership = await familyService.getUserFamilyMembership(currentUserId);

        if (membership) {
            return knex('family_members')
                .select('users.uuid', 'users.username')
                .leftJoin('users', 'family_members.user_uuid', 'users.uuid')
                .where({ 'family_members.family_uuid': membership.family_uuid, 'family_members.status': 'active' })
                .whereNot('family_members.user_uuid', currentUserId);
        }

        return knex('users')
            .whereNot('uuid', currentUserId)
            .select('uuid', 'username');
    }
};

module.exports = userService;
