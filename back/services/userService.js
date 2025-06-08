const knex = require('../db.cjs');

const userService = {
    async getAssignableUsers(currentUserId) {
        // Returns all users except the current one.
        return knex('users')
            .whereNot('uuid', currentUserId)
            .select('uuid', 'username');
    }
};

module.exports = userService;