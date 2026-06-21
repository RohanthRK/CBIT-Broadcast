const express = require("express");
const router = express.Router();
const adminControllers = require("../controllers/adminControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/reports", verifyToken, adminControllers.getReports);
router.post("/reports", verifyToken, adminControllers.createReport);
router.patch("/reports/:id", verifyToken, adminControllers.resolveReport);

router.get("/verifications", verifyToken, adminControllers.getPendingVerifications);
router.patch("/verifications/:id", verifyToken, adminControllers.resolveVerification);

module.exports = router;
