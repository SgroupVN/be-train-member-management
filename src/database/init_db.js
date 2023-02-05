const db = require('./connection.js')

const creatSql = `CREATE TABLE user ( id INT NOT NULL AUTO_INCREMENT , name VARCHAR(255) NOT NULL , age INT unsigned, gender BOOLEAN , PRIMARY KEY (id))`
const seedSql = `INSERT INTO user(name, age, gender) values ('Nguyen Van A', 18, true), ('Nguyen Van B', 20, false), ('Tran Thi C', 10, true)`

db.query(creatSql, (err, result) => {
    if (err){
        console.log(err)
    } else {
        db.query(seedSql, (err, result) => {
            if (err){
                console.log(err);
                return;
            } 
            console.log("Success init database...")
        })
    }
})