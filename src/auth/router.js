const express = require('express');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const crypto = require('crypto');

const db = require('../database/connection');
const sendEmail = require('../utils/emailhelper');

const router = express.Router();

const executeQuery = ({ query, params }) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, rows) => {
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
      query: 'SELECT * FROM user WHERE name = ?',
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

router.post('/forgot-password', async function (req, res) {
  try {
    const { email } = req.body;

    const user = await executeQuery({
      query: 'SELECT * FROM user WHERE email = ?',
      params: [email],
    });

    if (!user) {
      return res.status(404).json({
        message: 'Email not found',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const passwordResetAt = new Date(Date.now() + 10 * 60 * 1000);
    await executeQuery({
      query: 'update user set passwordResetToken = ?, passwordResetAt = ? where email = ?',
      params: [passwordResetToken, passwordResetAt, email],
    });

    sendEmail({
      emailFrom: 'admin@gmail.com',
      emailTo: email,
      emailSubject: 'Reset password',
      emailText: 'Here is your reset password token: ' + passwordResetToken,
    });

    return res.status(200).json({
      message: 'reset password email sent successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'error',
    });
  }
});

router.post('/reset-password', async function (req, res) {
  try {
    const { email, passwordResetToken, newPassword } = req.body;
    const user = await executeQuery({
      query: 'SELECT * FROM user WHERE email = ? AND passwordResetToken = ? AND passwordResetAt > ?',
      params: [email, passwordResetToken, new Date()],
    });

    if (!user) {
      return res.status(403).json({
        message: 'Invalid token or token has expired',
      });
    }

    const hashedPassword = await bcrypt.hashSync(newPassword, 12);

    await executeQuery({
      query: 'update user set password = ?, passwordResetToken = null, passwordResetAt = null where email = ?',
      params: [hashedPassword, email],
    });

    return res.status(200).json({
      message: 'reset password successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'error',
    });
  }
});

module.exports = router;
