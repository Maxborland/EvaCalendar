const ApiError = require('../utils/ApiError.js');

function createAccessScopeService({ familyService, apiError = ApiError } = {}) {
  async function getFamilyUuid(userId) {
    const resolvedFamilyService = familyService || require('./familyService.js');
    const membership = await resolvedFamilyService.getUserFamilyMembership(userId);
    return membership ? membership.family_uuid : null;
  }

  function addTaskAccessFilter(query, userId, familyUuid) {
    return query.where(function() {
      this.where('tasks.creator_uuid', userId).orWhere('tasks.user_uuid', userId);
      if (familyUuid) {
        this.orWhere('tasks.family_uuid', familyUuid);
      }
    });
  }

  function addFinancialScopeFilter(query, userId, familyUuid) {
    return query.andWhere(function() {
      this.where('tasks.user_uuid', userId);
      if (familyUuid) {
        this.orWhere('tasks.family_uuid', familyUuid);
      }
    });
  }

  async function assertTaskAccess(task, userId) {
    if (task.creator_uuid !== userId && task.user_uuid !== userId) {
      if (task.family_uuid) {
        const familyUuid = await getFamilyUuid(userId);
        if (!familyUuid || familyUuid !== task.family_uuid) {
          throw apiError.forbidden('Access denied');
        }
      } else {
        throw apiError.forbidden('Access denied');
      }
    }
  }

  return {
    addFinancialScopeFilter,
    addTaskAccessFilter,
    assertTaskAccess,
    getFamilyUuid,
  };
}

module.exports = {
  ...createAccessScopeService(),
  createAccessScopeService,
};
