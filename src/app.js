const express = require('express');
const logger = require('morgan');
require('dotenv').config();

const app = express();
const port = 3000;

const userRouter = require('./users/router');
const authRouter = require('./auth/router');
const roleRouter = require('./roles/router');
const voteRouter = require('./vote/router');
const permissionRouter = require('./permissions/router');
const orgHierarchyRouter = require('./org-chart/router');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/roles', roleRouter);
app.use('/votes', voteRouter);
app.use('/permissions', permissionRouter);
app.use('/org-chart', orgHierarchyRouter);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
