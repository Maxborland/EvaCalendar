const { createAccessScopeService } = require('../services/accessScopeService.js');

const createScope = (familyUuid = null) => {
  const familyService = {
    getUserFamilyMembership: jest.fn().mockResolvedValue(
      familyUuid ? { family_uuid: familyUuid } : null,
    ),
  };

  return {
    familyService,
    scope: createAccessScopeService({ familyService }),
  };
};

describe('accessScopeService', () => {
  it('allows direct creator and assignee access without family lookup', async () => {
    const { familyService, scope } = createScope('family-1');

    await expect(scope.assertTaskAccess({
      creator_uuid: 'user-1',
      user_uuid: 'user-2',
      family_uuid: null,
    }, 'user-1')).resolves.toBeUndefined();

    await expect(scope.assertTaskAccess({
      creator_uuid: 'user-1',
      user_uuid: 'user-2',
      family_uuid: null,
    }, 'user-2')).resolves.toBeUndefined();

    expect(familyService.getUserFamilyMembership).not.toHaveBeenCalled();
  });

  it('allows family member access when task belongs to the same family', async () => {
    const { familyService, scope } = createScope('family-1');

    await expect(scope.assertTaskAccess({
      creator_uuid: 'owner',
      user_uuid: 'assignee',
      family_uuid: 'family-1',
    }, 'member')).resolves.toBeUndefined();

    expect(familyService.getUserFamilyMembership).toHaveBeenCalledWith('member');
  });

  it('rejects outsiders and users without family membership', async () => {
    const outsider = createScope('family-2').scope;
    const noFamily = createScope(null).scope;
    const familyTask = {
      creator_uuid: 'owner',
      user_uuid: 'assignee',
      family_uuid: 'family-1',
    };

    await expect(outsider.assertTaskAccess(familyTask, 'outsider')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Access denied',
    });
    await expect(noFamily.assertTaskAccess(familyTask, 'solo')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Access denied',
    });
  });

  it('rejects private tasks for unrelated users', async () => {
    const { scope } = createScope('family-1');

    await expect(scope.assertTaskAccess({
      creator_uuid: 'owner',
      user_uuid: 'assignee',
      family_uuid: null,
    }, 'outsider')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Access denied',
    });
  });
});
