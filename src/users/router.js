const express = require("express");

const router = express.Router();

const allUsers = [
  { id: 1, name: "Nguyen Van A", age: 20, gender: true },
  { id: 2, name: "Nguyen Van B", age: 23, gender: false },
  { id: 3, name: "Nguyen Van C", age: 30, gender: true },
]

// Read all users with query params
router.get("/", function (req, res, next) {
  const nameQuery = req.query.name;

  if (nameQuery) {
    const filteredUser = allUsers.filter((user) => user.name.includes(nameQuery));
    return res.json(filteredUser);
  }

  return res.json(allUsers);
});

// Read one user
router.get("/:id", function (req, res, next) {
  const userId = parseInt(req.params.id, 10);
  const user = allUsers.find((user) => user.id === userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.json(user);
});

module.exports = router;
