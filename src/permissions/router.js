const express = require('express');
const db = require('../database/connection');
const { getMany, getOne, executeTransaction, create } = require('../database/query');

const router = express.Router();

// Read all permission
router.get('/', async function (req, res) {
  const permissions = await getMany({
    db,
    query:
      'SELECT p.id AS permissionId, p.code AS permissionCode, p.description AS permissionDescription, pg.description AS groupDescription \
      FROM permission p \
      LEFT JOIN permission_group pg ON p.groupId = pg.id',
    params: [],
  });

  const groupPermissions = permissions.reduce((acc, obj) => {
    let key = obj['groupDescription'];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  return res.status(200).json({
    data: groupPermissions,
    message: 'retrieve permissions successfully',
  });
});

// read permission from specific group
router.get('/group/:id', async function (req, res) {
  const groupId = parseInt(req.params.id, 10);

  const permissions = await getMany({
    db,
    query:
      'SELECT p.id AS permissionId, p.code AS permissionCode, p.description AS permissionDescription \
      FROM permission p \
      WHERE p.groupId = ?',
    params: [groupId],
  });

  return res.status(200).json({
    data: permissions,
    message: 'retrieve permissions successfully',
  });
});

// read all permission group
router.get('/groups', async function (req, res) {
  const permissions = await getMany({
    db,
    query: 'SELECT DISTINCT * FROM  permission_group',
    params: [],
  });

  return res.status(200).json({
    data: permissions,
    message: 'retrieve permissions successfully',
  });
});

module.exports = router;
