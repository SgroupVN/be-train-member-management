const express = require('express');
const db = require('../database/knex-connection');
const { cacheService } = require('../services/cache.service');

const router = express.Router();

// Read all users with query params
router.get('/', async (req, res) => {
  const nameQuery = req.query.name;
  const builder = nameQuery
    ? db('user')
        .whereLike('username', [`%${nameQuery}%`])
        .orWhereLike('email', [`%${nameQuery}%`])
        .orWhereLike('name', [`%${nameQuery}%`])
    : db('user');

  try {
    const users = await builder;
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: `Error when connect to mysql` });
  }
});

// Read one user
router.get('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const user = await db('user').where('user.id', userId).first();
    if (user.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Create one user
router.post('/', async (req, res) => {
  const { name, age, username, email } = req.body;
  const gender = Boolean(req.body.gender);
  const isValid = Boolean(name !== undefined && age !== undefined && gender !== undefined && email !== undefined);

  if (isValid) {
    try {
      const user = await db('user').insert({ name, age, username, gender, email });
      return res.json(user[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Error when connect to mysql' });
    }
  } else {
    return res.status(400).json({
      message: 'Missing some stuffs bro',
    });
  }

  // if (shouldAddUser) {
  //   const sql = 'INSERT INTO user(name, age, gender) VALUES(?, ?, ?)';
  //   db.query(sql, [name, age, gender], (err, results) => {
  //     if (err) {
  //       return res.status(400).json({ message: 'Error when insert data' });
  //     }
  //     return res.json(results);
  //   });
  // } else {
  //   return res.status(400).json({
  //     message: 'Missing some stuffs bro',
  //   });
  // }
});

// Update one user
router.patch('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, age, username, email } = req.body;
  const gender = Boolean(req.body.gender);

  const isValid = Boolean(name !== undefined && age !== undefined && gender !== undefined && email !== undefined);

  if (isValid) {
    try {
      const user = await db('user').where('user.id', userId).first();
      if (!user) {
        return res.status(404).json({
          message: 'User could not be found',
        });
      }
      await db('user')
        .where({ id: userId })
        .update({ name, age, username, gender, email }, ['id', 'name', 'age', 'username', 'email']);

      return res.status(200).json({ message: 'Update success' });
    } catch (error) {
      return res.status(500).json({ message: 'Error when connect to mysql' });
    }
  } else {
    return res.status(400).json({
      message: 'Missing some stuffs bro',
    });
  }
});

// Delete one user
router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const user = await db('user').where('user.id', userId).first();
    if (!user) {
      return res.status(404).json({
        message: 'User could not be found',
      });
    }
    const response = await db('user').where({ id: userId }).del();

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Assign role to user
router.post('/:id/assign-role', async function (req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { roles } = req.body;

    const user = await db.raw('SELECT * FROM user WHERE id = ?', [userId]).first();

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const roleParmas = roles.map((x) => [user.id, x.id]);

    await db.transaction(
      async (trx) => {
        await trx.raw('delete from user_role where userId = ?', [user.id]);
        await trx.raw('insert into user_role (userId, roleId) VALUES ?', [roleParmas]);
      },
      { autocommit: false }
    );

    const loginedUser = await cacheService.getOneUser(userId);

    if (loginedUser) {
      await cacheService.setOneUser(userId);
    }

    return res.status(200).json({
      message: 'login success',
    });
  } catch (err) {
    return res.status(400).json({ message: 'Error when update data' });
  }
});

// read user_role
router.get('/:id/roles', async function (req, res) {
  const userId = parseInt(req.params.id, 10);

  const roles = await db.raw(
    `SELECT ro.id, ro.description from role ro \
      JOIN user_role ur ON ro.id = ur.roleId \
      WHERE userId = ?`,
    [userId]
  );

  return res.status(200).json({
    data: roles,
    message: 'retrieve permissions successfully',
  });
});

// read user_permission in specific permissionGroup
router.get('/:userId/permission-group/:groupId/permissions', async function (req, res) {
  const userId = parseInt(req.params.userId, 10);
  const groupId = parseInt(req.params.groupId, 10);

  const roles = await db.raw(
    `SELECT DISTINCT p.code AS permission \
    FROM role r JOIN user_role ur ON r.id = ur.RoleId LEFT JOIN role_permission rp ON r.id = rp.roleId LEFT JOIN permission p ON rp.permissionId = p.id \
    WHERE ur.userId = ? AND p.groupId = ?`,
    [userId, groupId]
  );

  return res.status(200).json({
    data: roles,
    message: 'retrieve permissions successfully',
  });
});

module.exports = router;
