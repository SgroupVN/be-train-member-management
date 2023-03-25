const express = require('express');
const crypto = require('crypto');
const jsonwebtoken = require('jsonwebtoken');

const db = require('../database/connection');
const canAccessBy = require('../middlewares/auth');
const { getOne, updateOne } = require('../database/query');
const { mailService } = require('../services/mail.service');
const { cacheService } = require('../services/cache.service');
const permissionCode = require('../constants/permission-code');

const router = express.Router();

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

router.post('/login', async function (req, res) {
  try {
    const { username } = req.body;

    const user = await getOne({
      db,
      query: 'SELECT * FROM user WHERE username = ?',
      params: [username],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const comparePassword = ({ encryptedPassword, password, salt }) => {
      const hashedRawPassword = crypto.pbkdf2Sync(password, salt, 10, 64, `sha512`).toString(`hex`);

      return encryptedPassword === hashedRawPassword;
    };

    const isPasswordValid = comparePassword({
      password: req.body.password,
      encryptedPassword: user.password,
      salt: user.salt,
    });

    if (isPasswordValid) {
      await cacheService.setOneUser(user.id);

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

router.get(
  '/authorization-test',
  canAccessBy(permissionCode.CanCreateUser, permissionCode.CanReadUser),
  async function (req, res) {
    return res.status(200).json({
      message: 'test authorization successfully',
    });
  }
);

router.post('/forgot-password', async function (req, res) {
  try {
    const { email } = req.body;

    const user = await getOne({
      db,
      query: 'SELECT * FROM user WHERE email = ?',
      params: [email],
    });

    if (!user) {
      return res.status(404).json({
        message: 'Email not found',
      });
    }

    const secretKey = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(secretKey).digest('hex');

    const passwordResetAt = new Date(Date.now() + 10 * 60 * 1000);
    const updateStatus = await updateOne({
      db,
      query: 'update user set passwordResetToken = ?, passwordResetAt = ? where email = ?',
      params: [passwordResetToken, passwordResetAt, email],
    });

    if (updateStatus) {
      mailService.sendEmail({
        emailFrom: 'admin@gmail.com',
        emailTo: email,
        emailSubject: 'Reset password',
        emailText: `Here is your reset password token: ${passwordResetToken}`,
      });

      return res.status(200).json({
        message: 'reset password email sent successfully',
      });
    }

    return res.status(400).json({
      message: "can't reset password!",
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
    const user = await getOne({
      db,
      query: 'SELECT * FROM user WHERE email = ? AND passwordResetToken = ? AND passwordResetAt > ?',
      params: [email, passwordResetToken, new Date()],
    });

    if (!user) {
      return res.status(403).json({
        message: 'invalid token or token has expired',
      });
    }

    const salt = crypto.randomBytes(32).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(newPassword, salt, 10, 64, `sha512`).toString(`hex`);

    const updateStatus = await updateOne({
      db,
      query: 'update user set password = ?, salt = ?, passwordResetToken = null, passwordResetAt = null where email = ?',
      params: [hashedPassword, salt, email],
    });

    if (updateStatus) {
      return res.status(200).json({
        message: 'reset password successfully',
      });
    }

    return res.status(400).json({
      message: 'reset password failed',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'error',
    });
  }
});

module.exports = router;
