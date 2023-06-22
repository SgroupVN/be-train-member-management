const express = require('express');
const { cacheService } = require('../services/cache.service');
const db = require('../database/knex-connection');

const router = express.Router();

// Read role_permission
router.get('/:id', async function (req, res) {
  const roleId = parseInt(req.params.id, 10);

  const permissions = await db.raw(
    `SELECT p.id AS permissionId, p.code AS permissionCode \
    FROM role_permission rp \
    JOIN permission p ON rp.permissionId = p.id \
    WHERE roleId = ?`,
    [roleId]
  );

  return res.status(200).json({
    data: permissions,
    message: 'retrieve permissions successfully',
  });
});

// create role
router.post('/', async function (req, res) {
  try {
    const { code } = req.body;
    const { description } = req.body;
    const shouldAddRole = Boolean(code !== undefined && description !== undefined);

    if (shouldAddRole) {
      const result = await db.raw(`INSERT INTO role(code, description) VALUES(?, ?)`, [code, description]);

      if (!result) {
        return res.status(400).json({
          message: 'error when creating role',
        });
      }

      return res.status(200).json({
        message: 'success',
      });
    }
    return res.status(400).json({
      message: 'Missing some stuffs bro',
    });
  } catch (err) {
    return res.status(400).json({
      message: 'error when creating role',
    });
  }
});

// assign permissions to role
router.post('/:id/assign-permission', async function (req, res) {
  try {
    const roleId = parseInt(req.params.id, 10);
    const { permissions } = req.body;

    const role = await db.raw(`SELECT * FROM role WHERE id = ?`, [roleId]);

    if (!role) {
      return res.status(404).json({
        message: 'role not found',
      });
    }

    // eslint-disable-next-line no-undef
    const permissionsParams = permissions.map((x) => [role.id, x.id]);

    await db.transaction(async (trx) => {
      await trx.raw('delete from role_permission where roleId = ?', [role.id]);
      await trx.raw('insert into role_permission (roleId, permissionId) VALUES ?', [permissionsParams]);
    });

    const loginedUsers = await cacheService.getAllUser();

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(loginedUsers)) {
      if (value.roles.includes(role.code)) {
        // eslint-disable-next-line no-await-in-loop
        await cacheService.setOneUser(key);
      }
    }

    return res.status(200).json({
      message: 'success',
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: 'Error when update data' });
  }
});

module.exports = router;
