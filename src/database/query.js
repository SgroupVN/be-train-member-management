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
        conn.commit();
        resolve();
      } catch (error) {
        conn.rollback();
        reject(error);
      } finally {
        conn.release();
      }
    });
  });
};

const create = async ({ db, query, params }) => {
  const result = await executeQuery({ db, query, params });
  if (result.affectedRows > 0) {
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

const deleteOne = async ({ db, query, params }) => {
  const result = await executeQuery({ db, query, params });

  if (result.affectedRows > 0) {
    return true;
  }

  return false;
};

const updateMany = async ({ db, query, params }) => {
  const result = await executeQuery({ db, query, params });

  if (result.affectedRows > 0) {
    return true;
  }

  return false;
};

module.exports = {
  getOne,
  getMany,
  updateOne,
  executeQuery,
  executeTransaction,
  create,
  deleteOne,
  updateMany,
};
