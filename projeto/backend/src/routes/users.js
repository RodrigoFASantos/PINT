const express = require("express");
const router = express.Router();
const { getAllUsers, createUser, loginUser } = require("../controllers/users_ctrl");

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.post("/login", loginUser);

module.exports = router;
