const express = require('express');
const app = express();
const port = 3000;

const userRouter = require("./users/router");

app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use('/users', userRouter);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
