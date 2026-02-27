const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/portfolioController");

const router = express.Router();

router.get("/me", requireAuth, asyncHandler(controller.getPortfolio));

module.exports = router;
