const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();
const authLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

router.post("/signup", authLimiter, asyncHandler(controller.signup));
router.post("/login", authLimiter, asyncHandler(controller.login));
router.get("/me", requireAuth, asyncHandler(controller.me));

module.exports = router;
