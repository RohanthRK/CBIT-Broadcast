const express = require("express");
const router = express.Router();
const lostFoundControllers = require("../controllers/lostFoundControllers");
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

router.get("/", optionallyVerifyToken, lostFoundControllers.getLostFoundItems);
router.post("/", upload.single("image"), verifyToken, lostFoundControllers.createLostFoundItem);
router.patch("/:id", upload.single("image"), verifyToken, lostFoundControllers.updateLostFoundItem);
router.delete("/:id", verifyToken, lostFoundControllers.deleteLostFoundItem);

module.exports = router;
