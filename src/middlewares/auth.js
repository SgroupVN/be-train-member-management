const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (...allowedPermissions) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401);
    console.log(authHeader); // Bearer token
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(401); //invalid token
      if (!decoded.permissions) return res.sendStatus(403);
      const permissionArray = [...allowedPermissions];
      const result = decoded.permissions.map((item) => permissionArray.includes(item)).find((val) => val === true);
      if (!result) return res.sendStatus(403);
      req.user = decoded.username;
      next();
    });
  };
};

module.exports = auth;
