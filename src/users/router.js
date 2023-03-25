const express = require('express');
const db = require('../database/knex-connection');
const { getOne, executeTransaction, getMany } = require('../database/query');
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
  // if (nameQuery) {
  //   const sql = 'SELECT * FROM user WHERE name LIKE ?';

  //   db.query(sql, [`%${nameQuery}%`], (err, rows) => {
  //     if (err) {
  //       return res.status(500).json({ message: 'Error when connect to mysql' });
  //     }
  //     return res.json(rows);
  //   });
  //   return;
  // }
  // // Get all
  // const sql = 'SELECT * FROM user';
  // db.query(sql, [nameQuery], (err, rows) => {
  //   if (err) {
  //     return res.status(500).json({ message: 'Error when connect to mysql' });
  //   }

  //   res.json(rows);
  // });
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

  // const sql = 'SELECT * FROM user WHERE id = ?';

  // db.query(sql, [userId], (err, rows) => {
  //   if (err) {
  //     return res.status(500).json({ message: 'Error when connect to mysql' });
  //   }
  //   if (rows.length === 0) {
  //     return res.status(404).json({
  //       message: 'User not found',
  //     });
  //   }
  //   return res.json(rows[0]);
  // });
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

  // const user = allUsers.find((user) => user.id === userId);
  // const { name } = req.body;
  // const { age } = req.body;
  // const gender = Boolean(req.body.gender);

  // const sql = 'SELECT * FROM user WHERE id = ?';
  // db.query(sql, [userId], (err, rows) => {
  //   if (err) {
  //     return res.status(500).json({ message: 'Error when connect to mysql' });
  //   }
  //   if (rows.length === 0) {
  //     return res.status(404).json({
  //       message: 'User not found',
  //     });
  //   }
  //   const updateSql = 'UPDATE user SET name=?,age=?,gender=? where id=?';
  //   db.query(updateSql, [name, age, gender, userId], (updateErr, results) => {
  //     if (updateErr) {
  //       return res.status(400).json({ message: 'Error when update data' });
  //     }

  //     return res.json(results);
  //   });
  // });
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
  // const sql = 'DELETE from user WHERE id=?';
  // db.query(sql, [userId], (err, result) => {
  //   if (err) {
  //     return res.status(400).json({ message: 'Error when update data' });
  //   }
  //   return res.json(result);
  // });
});

// Assign role to user
router.post('/:id/assign-role', async function (req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { roles } = req.body;

    const user = await getOne({
      db,
      query: 'SELECT * FROM user WHERE id = ?',
      params: [userId],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const roleParmas = roles.map((x) => [user.id, x.id]);

    await executeTransaction({
      db,
      queries: [
        { query: 'delete from user_role where userId = ?', params: [user.id] },
        { query: 'insert into user_role (userId, roleId) VALUES ?', params: [roleParmas] },
      ],
    });

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

  const roles = await getMany({
    db,
    query:
      // eslint-disable-next-line no-multi-str
      'SELECT ro.id, ro.description from role ro \
      JOIN user_role ur ON ro.id = ur.roleId \
      WHERE userId = ?',
    params: userId,
  });

  return res.status(200).json({
    data: roles,
    message: 'retrieve permissions successfully',
  });
});

// read user_permission in specific permissionGroup
router.get('/:userId/permission-group/:groupId/permissions', async function (req, res) {
  const userId = parseInt(req.params.userId, 10);
  const groupId = parseInt(req.params.groupId, 10);

  const roles = await getMany({
    db,
    query:
      // eslint-disable-next-line no-multi-str
      'SELECT DISTINCT p.code AS permission \
    FROM role r JOIN user_role ur ON r.id = ur.RoleId LEFT JOIN role_permission rp ON r.id = rp.roleId LEFT JOIN permission p ON rp.permissionId = p.id \
    WHERE ur.userId = ? AND p.groupId = ?',
    params: [userId, groupId],
  });

  return res.status(200).json({
    data: roles,
    message: 'retrieve permissions successfully',
  });
});

module.exports = router;
