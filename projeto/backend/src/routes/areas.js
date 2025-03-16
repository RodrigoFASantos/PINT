const express = require("express");
const router = express.Router();
const { getAllAreas, createArea } = require("../controllers/areas_ctrl");

router.get("/areas", getAllAreas);
router.post("/areas", createArea);

module.exports = router;
