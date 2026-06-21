const express = require("express");
const router = express.Router();
const eventControllers = require("../controllers/eventControllers");
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

router.get("/", optionallyVerifyToken, eventControllers.getEvents);
router.post("/", upload.single("banner"), verifyToken, eventControllers.createEvent);
router.post("/rsvp/:id", verifyToken, eventControllers.rsvpEvent);
router.patch("/:id", upload.single("banner"), verifyToken, eventControllers.updateEvent);
router.delete("/:id", verifyToken, eventControllers.deleteEvent);

module.exports = router;
