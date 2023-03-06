const express = require('express');
const db = require('../database/connection');
const { getMany, getOne, executeTransaction, create } = require('../database/query');

const router = express.Router();

// Read role_permission
router.get('/:id', async function (req, res) {
  const roleId = parseInt(req.params.id, 10);

  const permissions = await getMany({
    db,
    query:
      'SELECT p.id AS permissionId, p.code AS permissionCode \
    FROM role_permission rp \
    JOIN permission p ON rp.permissionId = p.id \
    WHERE roleId = ?',
    params: roleId,
  });

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
      const result = await create({
        db,
        query: 'INSERT INTO role(code, description) VALUES(?, ?)',
        params: [code, description],
      });

      if (!result) {
        return res.status(400).json({
          message: 'error when creating role',
        });
      }

      return res.status(200).json({
        message: 'success',
      });
    } else {
      return res.status(400).json({
        message: 'Missing some stuffs bro',
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      message: 'error when creating role',
    });
  }
});

// assign permissions to role
router.post('/:id', async function (req, res) {
  try {
    const roleId = parseInt(req.params.id, 10);
    const { permissions } = req.body;

    const role = await getOne({
      db,
      query: 'SELECT * FROM role WHERE id = ?',
      params: [roleId],
    });

    if (!role) {
      return res.status(404).json({
        message: 'role not found',
      });
    }

    permissionsParams = permissions.map((x) => [role.id, x.id]);

    await executeTransaction({
      db: db,
      queries: [
        { query: 'delete from role_permission where roleId = ?', params: [role.id] },
        { query: 'insert into role_permission (roleId, permissionId) VALUES ?', params: [permissionsParams] },
      ],
    });

    return res.status(200).json({
      message: 'success',
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: 'Error when update data' });
  }
});

module.exports = router;
