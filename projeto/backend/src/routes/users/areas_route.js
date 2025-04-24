const express = require("express");
const router = express.Router();
const { getAllAreas, createArea } = require("../../controllers/users/areas_ctrl");

router.get("/", getAllAreas);
router.post("/", createArea);

module.exports = router;