const expireCache = require('expire-cache');
const db = require('../database/connection');
const { getMany, getOne } = require('../database/query');

const cacheService = {
  async setOneUser(userId) {
    const userCache = expireCache.namespace('userCache');
    const existingUserCache = await this.getOneUser(userId);
    try {
      userCache.remove(userId);
      
      const rolePermissions = await getMany({
        db,
        query:
          'SELECT r.code AS role, p.code AS permission \
            FROM role r JOIN user_role ur ON r.id = ur.RoleId LEFT JOIN role_permission rp ON r.id = rp.roleId LEFT JOIN permission p ON rp.permissionId = p.id \
            WHERE ur.userId = ?',
        params: userId,
      });

      const user = await getOne({
        db,
        query: 'SELECT * FROM user WHERE id = ?',
        params: [userId],
      });

      const roles = Array.from(new Set(rolePermissions.map((item) => item.role)));
      const permissions = Array.from(
        new Set(rolePermissions.filter((item) => item.permission != null).map((item) => item.permission))
      );

      userCache(
        `${userId}`,
        { roles, permissions, passwordLastResetDate: user.passwordLastResetDate },
        process.env.JWT_EXPIRE_TIME
      );

    } catch (err) {
      if (existingUserCache) {
        userCache(
          `${userId}`,
          {
            roles: existingUserCache.roles,
            permissions: existingUserCache.permissions,
            passwordLastResetDate: existingUserCache.passwordLastResetDate,
          },
          process.env.JWT_EXPIRE_TIME
        );
      }
    }
  },
  async getOneUser(userId) {
    const userCache = expireCache.namespace('userCache');
    if (!userCache) {
      return null;
    }
    var data = userCache(`${userId}`);
    return data;
  },
  async getAllUser() {
    const userCache = expireCache.namespace('userCache');
    if (!userCache) {
      return null;
    }
    var data = userCache();
    return data;
  },
};

Object.freeze(cacheService);

module.exports = {
  cacheService,
};
