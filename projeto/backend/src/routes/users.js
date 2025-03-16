const express = require("express");
const router = express.Router();
const { getAllUsers, createUser, loginUser, changePassword } = require("../controllers/users_ctrl");

router.get("/users", getAllUsers);
router.post("/users/register", createUser);
router.post("/login", loginUser);
router.put("/users/change-password", changePassword);

module.exports = router;
