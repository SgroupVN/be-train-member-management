const db = require('./connection.js')

const create_sql = `CREATE TABLE user ( id INT NOT NULL AUTO_INCREMENT , name VARCHAR(255) NOT NULL , age INT unsigned, gender BOOLEAN , PRIMARY KEY (id))`
const seed_sql = `INSERT INTO user(name, age, gender) values ('Nguyen Van A', 18, true), ('Nguyen Van B', 20, false), ('Tran Thi C', 10, true)`

db.query(create_sql, (err, result) => {
    if (err){
        console.log(err)
    } else {
        db.query(seed_sql, (err, result) => {
            if (err){
                console.log(err);
            } else {
                console.log("Success init database...")
            }
        })
    }
})