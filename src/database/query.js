const { promisify } = require('util');

const executeQuery = ({ db, query, params }) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, rows) => {
      if (err) {
        reject(err);
      }

      resolve(rows);
    });
  });
};

const executeTransaction = ({ db, queries }) => {
  return new Promise((resolve, reject) => {
    db.getConnection(async function (err, conn) {
      conn.beginTransaction();
      try {
        const promiseQuery = promisify(conn.query).bind(conn);
        await Promise.all(
          queries.map(async (item) => {
            await promiseQuery(item.query, item.params);
          })
        );
        // await promiseQuery('delete from user_role where roleId = ?', [2]);
        // await promiseQuery('insert into role (code) VALUES ("admin")');
        // await promiseQuery(queries[0].query, queries[0].params);
        conn.commit();
        resolve();
      } catch (error) {
        conn.rollback();
        reject(error)
      } finally {
        conn.release();
      }
    });
  });
};

const createMany = async ({ db, query, params }) => {
  const result = await executeQuery({ db, query, params });
  if (result.affectedRows == params.length) {
    return true;
  }

  return false;
};

const updateOne = async ({ db, query, params }) => {
  const result = await executeQuery({ db, query, params });
  if (result.affectedRows > 0) {
    return true;
  }

  return false;
};

const getOne = async ({ db, query, params }) => {
  const records = await executeQuery({ db, query, params });

  if (records.length > 0) {
    return records[0];
  }

  return null;
};

const getMany = async ({ db, query, params }) => {
  const records = await executeQuery({ db, query, params });

  return records;
};

module.exports = {
  getOne,
  getMany,
  updateOne,
  executeQuery,
  executeTransaction,
};
