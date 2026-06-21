const express = require("express");
const router = express.Router();
const notificationControllers = require("../controllers/notificationControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, notificationControllers.getNotifications);
router.patch("/read", verifyToken, notificationControllers.markAllRead);

module.exports = router;
