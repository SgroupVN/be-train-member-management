const db = require('./knex-connection');

// Default pass: thinh12345

const creatSql = `CREATE TABLE user ( id INT NOT NULL AUTO_INCREMENT , username VARCHAR(50) , salt VARCHAR(255) , password VARCHAR(255) , name VARCHAR(255) NOT NULL , age INT unsigned, gender BOOLEAN , email VARCHAR(255) NOT NULL, passwordResetToken VARCHAR(255), passwordResetAt DATETIME, PRIMARY KEY (id), UNIQUE(username) )`;
const seedSql = `INSERT INTO user(username, password, salt, name, age, gender, email)
  values ('thinh12345', 'e96851d1194dd06a6e448e5f55d567dcf83648afefc8c4089ce20ee84321ddeb12bf1f15addb20c4b96b7b295b3437e39cd0327e34fa3aaf8e3d35b52cb7d1d0', '540c2378e1bea44d0b71af8fee3a1ead', 'Nguyen Van B', 20, false, 'thinhle@gmail.com'),
        ('phu12345', 'e96851d1194dd06a6e448e5f55d567dcf83648afefc8c4089ce20ee84321ddeb12bf1f15addb20c4b96b7b295b3437e39cd0327e34fa3aaf8e3d35b52cb7d1d0', '540c2378e1bea44d0b71af8fee3a1ead', 'Tran Thi C', 10, true, 'phudang@gmail.com')`;

(async () => {
  await db.raw(creatSql);
  await db.raw(seedSql);
})();

// For authorization feature

/*
CREATE TABLE role(id INT NOT NULL AUTO_INCREMENT, code NVARCHAR(255) NOT NULL, description NVARCHAR(500), PRIMARY KEY (id), UNIQUE(code))

CREATE TABLE user_role (roleId INT NOT NULL, userId INT NOT NULL, PRIMARY KEY (roleId, userId), FOREIGN KEY (roleId) REFERENCES role(id), FOREIGN KEY (userId) REFERENCES user(id))

CREATE TABLE permission_group (id INT NOT NULL AUTO_INCREMENT, description NVARCHAR(500) NOT NULL, PRIMARY KEY (id))

CREATE TABLE permission(id INT NOT NULL AUTO_INCREMENT, code NVARCHAR(255) NOT NULL, description NVARCHAR(500), groupId INT NOT NULL, PRIMARY KEY (id), UNIQUE(code), FOREIGN KEY (groupId) REFERENCES permission_group(id))

CREATE TABLE role_permission(roleId INT NOT NULL, permissionId INT NOT NULL, PRIMARY KEY (roleId, permissionId), FOREIGN KEY (permissionId) REFERENCES premission(id), FOREIGN KEY (roleId) REFERENCES role(id))


INSERT INTO role(code) VALUES('admin'), ('staff');
INSERT INTO user_role(roleId, userId) VALUES (1, 1);
INSERT INTO permission_group(description) VALUES ('UserManagement');
INSERT INTO permission_group(description) VALUES ('RoleManagement');
INSERT INTO permission(code, description, groupId) VALUES ('CanReadUser', 'User List Information Read', 1);
INSERT INTO permission(code, description, groupId) VALUES ('CanCreateUser', 'User Create', 1);
INSERT INTO permission(code, description, groupId) VALUES ('CanCreateRole', 'Role Create', 2);
INSERT INTO role_permission(roleId, permissionId) VALUES(1, 1);
INSERT INTO role_permission(roleId, permissionId) VALUES(1, 2);
*/
