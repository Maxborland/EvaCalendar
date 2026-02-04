const express = require('express');
const familyService = require('../services/familyService.js');
const { sendEmail } = require('../services/emailService.js');
const { getEnvConfig } = require('../config/env.js');

const router = express.Router();

// GET /api/families/my
router.get('/my', async (req, res, next) => {
  try {
    const family = await familyService.getUserFamily(req.user.uuid);
    if (!family) {
      return res.status(200).json(null);
    }
    const full = await familyService.getFamilyWithMembers(family.uuid);
    res.status(200).json({ ...full, memberRole: family.memberRole });
  } catch (error) {
    next(error);
  }
});

// POST /api/families
router.post('/', async (req, res, next) => {
  try {
    const family = await familyService.createFamily(req.body.name, req.user.uuid);
    res.status(201).json(family);
  } catch (error) {
    next(error);
  }
});

// PUT /api/families/:uuid
router.put('/:uuid', async (req, res, next) => {
  try {
    const family = await familyService.updateFamily(req.params.uuid, req.body.name, req.user.uuid);
    res.status(200).json(family);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/families/:uuid
router.delete('/:uuid', async (req, res, next) => {
  try {
    await familyService.deleteFamily(req.params.uuid, req.user.uuid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/families/:uuid/members
router.get('/:uuid/members', async (req, res, next) => {
  try {
    const members = await familyService.getMembers(req.params.uuid, req.user.uuid);
    res.status(200).json(members);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/families/:uuid/members/:userUuid
router.delete('/:uuid/members/:userUuid', async (req, res, next) => {
  try {
    await familyService.removeMember(req.params.uuid, req.params.userUuid, req.user.uuid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/families/leave
router.post('/leave', async (req, res, next) => {
  try {
    await familyService.leaveFamily(req.user.uuid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/families/:uuid/invitations
router.post('/:uuid/invitations', async (req, res, next) => {
  try {
    const invitation = await familyService.createInvitation(
      req.params.uuid,
      req.body.email,
      req.user.uuid
    );

    try {
      const envConfig = getEnvConfig();
      const allOrigins = [...envConfig.cors.origins, ...envConfig.cors.defaultOrigins];
      const requestOrigin = req.get('origin');
      const frontendUrl = (allOrigins.includes(requestOrigin) && requestOrigin)
        || allOrigins.find(u => !u.includes('localhost'))
        || allOrigins[0];
      const inviteLink = `${frontendUrl}/settings/family?invite=${invitation.token}`;

      await sendEmail(
        invitation.email,
        `Приглашение в семью «${invitation.familyName}»`,
        `Вас пригласили в семью «${invitation.familyName}» в EvaCalendar.\n\nПерейдите по ссылке для принятия приглашения:\n${inviteLink}\n\nСсылка действительна 7 дней.`,
        `<h2>Приглашение в семью</h2><p>Вас пригласили в семью <strong>«${invitation.familyName}»</strong> в EvaCalendar.</p><p><a href="${inviteLink}">Принять приглашение</a></p><p>Ссылка действительна 7 дней.</p>`
      );
    } catch (emailError) {
      // Email не отправился, но приглашение создано — не блокируем
    }

    res.status(201).json(invitation);
  } catch (error) {
    next(error);
  }
});

// GET /api/families/:uuid/invitations
router.get('/:uuid/invitations', async (req, res, next) => {
  try {
    const invitations = await familyService.getPendingInvitations(req.params.uuid, req.user.uuid);
    res.status(200).json(invitations);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/families/invitations/:invitationUuid
router.delete('/invitations/:invitationUuid', async (req, res, next) => {
  try {
    await familyService.cancelInvitation(req.params.invitationUuid, req.user.uuid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/families/accept-invitation
router.post('/accept-invitation', async (req, res, next) => {
  try {
    const family = await familyService.acceptInvitation(req.body.token, req.user.uuid);
    res.status(200).json(family);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
