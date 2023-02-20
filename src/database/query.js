const executeQuery = ({ db, query, params }) => {
  return new Promise((resolve, reject) => {
    db.query(query, [params], (err, rows) => {
      if (err) {
        reject(err);
      }

      resolve(rows);
    });
  });
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
  executeQuery,
};
