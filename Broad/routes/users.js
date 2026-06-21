const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");
const { check } = require("express-validator");
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

router.get("/", optionallyVerifyToken, userControllers.getUsersByDepartment);
router.post("/register", upload.single("idProof"), userControllers.register);
router.post("/login", userControllers.login);
router.get("/random", userControllers.getRandomUsers);

router.get("/:username", optionallyVerifyToken, userControllers.getUser);
router.patch("/:id", verifyToken, userControllers.updateUser);

router.post("/follow/:id", verifyToken, userControllers.follow);
router.delete("/unfollow/:id", verifyToken, userControllers.unfollow);

router.get("/followers/:id", userControllers.getFollowers);
router.get("/following/:id", userControllers.getFollowing);

module.exports = router;
