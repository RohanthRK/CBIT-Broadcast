const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, messageController.getConversations);
router.get("/unread", verifyToken, messageController.getUnreadCount);
router.post("/:id", verifyToken, messageController.sendMessage);
router.get("/:id", verifyToken, messageController.getMessages);

module.exports = router;
