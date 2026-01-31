const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError.js');

class FamilyService {
  async _assertFamilyMember(familyUuid, userId) {
    const member = await knex('family_members')
      .where({ family_uuid: familyUuid, user_uuid: userId, status: 'active' })
      .first();
    if (!member) {
      throw ApiError.forbidden('Вы не являетесь членом этой семьи');
    }
    return member;
  }

  async _assertFamilyAdmin(familyUuid, userId) {
    const member = await this._assertFamilyMember(familyUuid, userId);
    if (member.role !== 'owner' && member.role !== 'admin') {
      throw ApiError.forbidden('Недостаточно прав');
    }
    return member;
  }

  async getUserFamilyMembership(userId) {
    return knex('family_members')
      .where({ user_uuid: userId, status: 'active' })
      .first();
  }

  async getUserFamily(userId) {
    const membership = await this.getUserFamilyMembership(userId);
    if (!membership) return null;

    const family = await knex('families')
      .where({ uuid: membership.family_uuid })
      .first();
    if (!family) return null;

    return { ...family, memberRole: membership.role };
  }

  async createFamily(name, userId) {
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Название семьи обязательно');
    }

    const existing = await this.getUserFamilyMembership(userId);
    if (existing) {
      throw ApiError.conflict('Вы уже состоите в семье');
    }

    const familyUuid = uuidv4();
    const memberUuid = uuidv4();

    await knex.transaction(async (trx) => {
      await trx('families').insert({
        uuid: familyUuid,
        name: name.trim(),
        owner_uuid: userId,
      });

      await trx('family_members').insert({
        uuid: memberUuid,
        family_uuid: familyUuid,
        user_uuid: userId,
        role: 'owner',
        status: 'active',
        accepted_at: knex.fn.now(),
      });
    });

    return this.getFamilyWithMembers(familyUuid);
  }

  async getFamilyWithMembers(familyUuid) {
    const family = await knex('families')
      .where({ uuid: familyUuid })
      .first();
    if (!family) return null;

    const members = await knex('family_members')
      .select(
        'family_members.uuid',
        'family_members.user_uuid',
        'family_members.role',
        'family_members.status',
        'family_members.accepted_at',
        'users.username',
        'users.email'
      )
      .leftJoin('users', 'family_members.user_uuid', 'users.uuid')
      .where({ 'family_members.family_uuid': familyUuid, 'family_members.status': 'active' });

    return { ...family, members };
  }

  async updateFamily(familyUuid, name, userId) {
    await this._assertFamilyAdmin(familyUuid, userId);

    if (!name || !name.trim()) {
      throw ApiError.badRequest('Название семьи обязательно');
    }

    await knex('families')
      .where({ uuid: familyUuid })
      .update({ name: name.trim() });

    return this.getFamilyWithMembers(familyUuid);
  }

  async deleteFamily(familyUuid, userId) {
    const family = await knex('families').where({ uuid: familyUuid }).first();
    if (!family) {
      throw ApiError.notFound('Семья не найдена');
    }
    if (family.owner_uuid !== userId) {
      throw ApiError.forbidden('Только владелец может удалить семью');
    }

    await knex.transaction(async (trx) => {
      await trx('tasks').where({ family_uuid: familyUuid }).update({ family_uuid: null });
      await trx('family_invitations').where({ family_uuid: familyUuid }).del();
      await trx('family_members').where({ family_uuid: familyUuid }).del();
      await trx('families').where({ uuid: familyUuid }).del();
    });
  }

  async getMembers(familyUuid, userId) {
    await this._assertFamilyMember(familyUuid, userId);

    return knex('family_members')
      .select(
        'family_members.uuid',
        'family_members.user_uuid',
        'family_members.role',
        'family_members.status',
        'family_members.accepted_at',
        'users.username',
        'users.email'
      )
      .leftJoin('users', 'family_members.user_uuid', 'users.uuid')
      .where({ 'family_members.family_uuid': familyUuid, 'family_members.status': 'active' });
  }

  async removeMember(familyUuid, memberUserUuid, requestingUserId) {
    const requester = await this._assertFamilyAdmin(familyUuid, requestingUserId);
    const target = await knex('family_members')
      .where({ family_uuid: familyUuid, user_uuid: memberUserUuid, status: 'active' })
      .first();

    if (!target) {
      throw ApiError.notFound('Член семьи не найден');
    }
    if (target.role === 'owner') {
      throw ApiError.forbidden('Нельзя удалить владельца семьи');
    }
    if (target.role === 'admin' && requester.role !== 'owner') {
      throw ApiError.forbidden('Только владелец может удалить администратора');
    }

    await knex('family_members')
      .where({ family_uuid: familyUuid, user_uuid: memberUserUuid })
      .del();
  }

  async leaveFamily(userId) {
    const membership = await this.getUserFamilyMembership(userId);
    if (!membership) {
      throw ApiError.notFound('Вы не состоите в семье');
    }
    if (membership.role === 'owner') {
      throw ApiError.forbidden('Владелец не может покинуть семью. Удалите семью или передайте права');
    }

    await knex('family_members')
      .where({ family_uuid: membership.family_uuid, user_uuid: userId })
      .del();
  }

  async createInvitation(familyUuid, email, invitedByUserId) {
    await this._assertFamilyAdmin(familyUuid, invitedByUserId);

    if (!email || !email.trim()) {
      throw ApiError.badRequest('Email обязателен');
    }

    const existingMember = await knex('family_members')
      .leftJoin('users', 'family_members.user_uuid', 'users.uuid')
      .where({ 'users.email': email.trim(), 'family_members.family_uuid': familyUuid, 'family_members.status': 'active' })
      .first();

    if (existingMember) {
      throw ApiError.conflict('Пользователь уже является членом семьи');
    }

    const existingInvite = await knex('family_invitations')
      .where({ family_uuid: familyUuid, email: email.trim(), status: 'pending' })
      .where('expires_at', '>', knex.fn.now())
      .first();

    if (existingInvite) {
      throw ApiError.conflict('Приглашение для этого email уже существует');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitationUuid = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await knex('family_invitations').insert({
      uuid: invitationUuid,
      family_uuid: familyUuid,
      email: email.trim(),
      token,
      status: 'pending',
      expires_at: expiresAt,
    });

    const family = await knex('families').where({ uuid: familyUuid }).first();

    return {
      uuid: invitationUuid,
      email: email.trim(),
      token,
      familyName: family?.name,
      expires_at: expiresAt,
    };
  }

  async acceptInvitation(token, userId) {
    const invitation = await knex('family_invitations')
      .where({ token, status: 'pending' })
      .first();

    if (!invitation) {
      throw ApiError.notFound('Приглашение не найдено или уже использовано');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await knex('family_invitations')
        .where({ uuid: invitation.uuid })
        .update({ status: 'expired' });
      throw ApiError.badRequest('Приглашение истекло');
    }

    const user = await knex('users').where({ uuid: userId }).first();
    if (user.email !== invitation.email) {
      throw ApiError.forbidden('Приглашение адресовано другому email');
    }

    const existingMembership = await this.getUserFamilyMembership(userId);
    if (existingMembership) {
      throw ApiError.conflict('Вы уже состоите в семье');
    }

    const memberUuid = uuidv4();

    await knex.transaction(async (trx) => {
      await trx('family_members').insert({
        uuid: memberUuid,
        family_uuid: invitation.family_uuid,
        user_uuid: userId,
        role: 'member',
        status: 'active',
        invited_by: null,
        invited_at: invitation.created_at,
        accepted_at: knex.fn.now(),
      });

      await trx('family_invitations')
        .where({ uuid: invitation.uuid })
        .update({ status: 'accepted' });
    });

    return this.getFamilyWithMembers(invitation.family_uuid);
  }

  async getPendingInvitations(familyUuid, userId) {
    await this._assertFamilyAdmin(familyUuid, userId);

    return knex('family_invitations')
      .where({ family_uuid: familyUuid, status: 'pending' })
      .where('expires_at', '>', knex.fn.now())
      .select('uuid', 'email', 'status', 'expires_at', 'created_at');
  }

  async cancelInvitation(invitationUuid, userId) {
    const invitation = await knex('family_invitations')
      .where({ uuid: invitationUuid, status: 'pending' })
      .first();

    if (!invitation) {
      throw ApiError.notFound('Приглашение не найдено');
    }

    await this._assertFamilyAdmin(invitation.family_uuid, userId);

    await knex('family_invitations')
      .where({ uuid: invitationUuid })
      .del();
  }

  async getFamilyMembers(userId) {
    const membership = await this.getUserFamilyMembership(userId);
    if (!membership) return [];

    return knex('family_members')
      .select('users.uuid', 'users.username', 'users.email', 'family_members.role')
      .leftJoin('users', 'family_members.user_uuid', 'users.uuid')
      .where({ 'family_members.family_uuid': membership.family_uuid, 'family_members.status': 'active' })
      .whereNot('family_members.user_uuid', userId);
  }
}

module.exports = new FamilyService();
