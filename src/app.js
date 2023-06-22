const express = require('express');
require('dotenv').config();

const app = express();
const port = 3000;

const userRouter = require('./users/router');
const authRouter = require('./auth/router');
const roleRouter = require('./roles/router');
const voteRouter = require('./vote/router');
const permissionRouter = require('./permissions/router');
const connection = require('./database/knex-connection');

async function testConnection() {
  try {
    console.log(connection.context.client.config);
    await connection.raw('select 1=1');
    console.log('Database connected successfully');
  } catch (e) {
    await connection.destroy();
    console.log(e);
    process.exit(1);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/roles', roleRouter);
app.use('/votes', voteRouter);
app.use('/permissions', permissionRouter);

app.listen(port, async () => {
  console.log('Setting up things ...');
  await testConnection();
  console.log(`Server is listening on port ${port}`);
});
