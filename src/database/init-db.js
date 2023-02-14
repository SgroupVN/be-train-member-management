const db = require('./connection');
require('dotenv/config')


const creatSql = `CREATE TABLE user ( id INT NOT NULL AUTO_INCREMENT, name VARCHAR(255) NOT NULL, age INT unsigned, gender BOOLEAN, password VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, passwordResetToken VARCHAR(255), passwordResetAt DATETIME,  PRIMARY KEY (id))`;
const seedSql = `INSERT INTO user(name, age, gender, password, email) values ('Nguyen Van A', 18, true, 'Admin123654!', 'anguyen@gmail.com'), ('Nguyen Van B', 20, false, 'Admin123654!', 'bnguyen@gmail.com'), ('Tran Thi C', 10, true, 'Admin123654!', 'ctran@gmail.com')`;

db.query(creatSql, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  db.query(seedSql, (seedErr) => {
    if (seedErr) {
      console.log(seedErr);
      return;
    }

    console.log('Success init database...');
  });
});
