const express = require("express");
const router = express.Router();
const bookmarkControllers = require("../controllers/bookmarkControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, bookmarkControllers.getBookmarkedPosts);
router.post("/:id", verifyToken, bookmarkControllers.bookmarkPost);
router.delete("/:id", verifyToken, bookmarkControllers.unbookmarkPost);

module.exports = router;
