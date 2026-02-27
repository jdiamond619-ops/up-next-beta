const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/videoController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/optionalAuth");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();
const tradeLimiter = createRateLimiter({ windowMs: 10_000, max: 5 });

router.get("/", asyncHandler(controller.listFeed));
router.get("/:id", optionalAuth, asyncHandler(controller.getVideoDetail));
router.post("/:id/buy", requireAuth, tradeLimiter, asyncHandler(controller.buy));
router.post("/:id/sell", requireAuth, tradeLimiter, asyncHandler(controller.sell));
router.post("/admin/upload", requireAuth, requireAdmin, asyncHandler(controller.adminCreateVideo));

module.exports = router;
