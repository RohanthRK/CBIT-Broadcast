const express = require("express");
const router = express.Router();
const resourceControllers = require("../controllers/resourceControllers");
const { verifyToken, optionallyVerifyToken } = require("../middleware/auth");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

router.get("/", optionallyVerifyToken, resourceControllers.getResources);
router.post("/", upload.single("file"), verifyToken, resourceControllers.createResource);
router.post("/upvote/:id", verifyToken, resourceControllers.upvoteResource);
router.patch("/:id", upload.single("file"), verifyToken, resourceControllers.updateResource);
router.delete("/:id", verifyToken, resourceControllers.deleteResource);

module.exports = router;
