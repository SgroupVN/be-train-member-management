const expireCache = require('expire-cache');
const db = require('../database/connection');
const { getMany } = require('../database/query');

const cacheService = {
  async setOneUser(userId) {
    const rolePermissions = await getMany({
      db,
      query:
        'SELECT r.code AS role, p.code AS permission \
            FROM role r JOIN user_role ur ON r.id = ur.RoleId LEFT JOIN role_permission rp ON r.id = rp.roleId LEFT JOIN permission p ON rp.permissionId = p.id \
            WHERE ur.userId = ?',
      params: userId,
    });

    const roles = Array.from(new Set(rolePermissions.map((item) => item.role)));
    const permissions = Array.from(
      new Set(rolePermissions.filter((item) => item.permission != null).map((item) => item.permission))
    );

    const userCache = expireCache.namespace('userCache');
    userCache(`${userId}`, { roles, permissions }, process.env.JWT_EXPIRE_TIME);
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
