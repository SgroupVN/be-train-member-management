const db = require('./connection');

const creatSql = `CREATE TABLE user ( id INT NOT NULL AUTO_INCREMENT , name VARCHAR(255) NOT NULL , age INT unsigned, gender BOOLEAN , PRIMARY KEY (id))`;
const seedSql = `INSERT INTO user(name, age, gender) values ('Nguyen Van A', 18, true), ('Nguyen Van B', 20, false), ('Tran Thi C', 10, true)`;

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
