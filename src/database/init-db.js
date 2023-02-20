const db = require('./connection');

// Default pass: thinh12345

const creatSql = `CREATE TABLE user ( id INT NOT NULL AUTO_INCREMENT , username VARCHAR(50) , salt VARCHAR(255) , password VARCHAR(255) , name VARCHAR(255) NOT NULL , age INT unsigned, gender BOOLEAN , email VARCHAR(255) NOT NULL, passwordResetToken VARCHAR(255), passwordResetAt DATETIME, PRIMARY KEY (id), UNIQUE(username) )`;
const seedSql = `INSERT INTO user(username, password, salt, name, age, gender, email)
  values ('thinh12345', 'e96851d1194dd06a6e448e5f55d567dcf83648afefc8c4089ce20ee84321ddeb12bf1f15addb20c4b96b7b295b3437e39cd0327e34fa3aaf8e3d35b52cb7d1d0', '540c2378e1bea44d0b71af8fee3a1ead', 'Nguyen Van B', 20, false, 'thinhle@gmail.com'),
        ('phu12345', 'e96851d1194dd06a6e448e5f55d567dcf83648afefc8c4089ce20ee84321ddeb12bf1f15addb20c4b96b7b295b3437e39cd0327e34fa3aaf8e3d35b52cb7d1d0', '540c2378e1bea44d0b71af8fee3a1ead', 'Tran Thi C', 10, true, 'phudang@gmail.com')`;

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
