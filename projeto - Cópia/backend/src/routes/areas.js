const express = require("express");
const router = express.Router();
const { getAllAreas, createArea } = require("../controllers/areas_ctrl");

router.get("/", getAllAreas);    // Isso vai para /api/areas
router.post("/", createArea);    // Isso vai para /api/areas

module.exports = router;