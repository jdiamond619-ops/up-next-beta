const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/", asyncHandler(controller.getLeaderboard));

module.exports = router;
