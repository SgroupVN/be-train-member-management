const express = require('express');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const db = require('../database/connection');

const router = express.Router();

const executeQuery = ({ query, params }) => {
  return new Promise((resolve, reject) => {
    db.query(query, [params], (err, rows) => {
      if (err) {
        reject(err);
      }

      if (rows.length === 0) {
        resolve(null);
      }

      resolve(rows[0]);
    });
  });
};

const getUserCredentials = ({ id, username }) => {
  const jwtData = {
    id,
    username,
  };

  const jwtSecret = process.env.JWT_SECRET;

  return jsonwebtoken.sign(jwtData, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};

// Read all users with query params
router.post('/login', async function (req, res) {
  try {
    const { username, password } = req.body;

    const user = await executeQuery({
      query: 'SELECT * FROM user WHERE username = ?',
      params: username,
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const token = getUserCredentials({
        id: user.id,
        username,
      });

      return res.status(200).json({
        data: {
          token,
        },
        message: 'login success',
      });
    }

    return res.status(401).json({
      message: 'invalid credentials',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'error',
    });
  }
});

module.exports = router;
