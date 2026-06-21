const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");

const getReports = async (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (!isAdmin) {
      throw new Error("Not authorized");
    }

    const reports = await Report.find({ status: "pending" })
      .populate("reporterId", "username")
      .populate("postId", "title content")
      .sort("-createdAt");

    return res.json(reports);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const createReport = async (req, res) => {
  try {
    const { userId, postId, reason } = req.body;

    if (!postId || !reason) {
      throw new Error("Post ID and reason are required");
    }

    const report = await Report.create({
      reporterId: userId,
      postId,
      reason,
    });

    return res.json(report);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { isAdmin, action } = req.body;
    const reportId = req.params.id;

    if (!isAdmin) {
      throw new Error("Not authorized");
    }

    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    if (action === "delete") {
      const post = await Post.findById(report.postId);
      if (post) {
        await post.remove(); // Triggers the pre-remove middleware to delete likes etc.
      }
    }

    report.status = "resolved";
    await report.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getPendingVerifications = async (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (!isAdmin) {
      throw new Error("Not authorized");
    }

    const pendingUsers = await User.find({ verificationStatus: "pending" })
      .select("-password")
      .sort("-createdAt");

    return res.json(pendingUsers);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const resolveVerification = async (req, res) => {
  try {
    const { isAdmin, action } = req.body;
    const userId = req.params.id;

    if (!isAdmin) {
      throw new Error("Not authorized");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (action === "approve") {
      user.verificationStatus = "approved";
    } else if (action === "reject") {
      user.verificationStatus = "rejected";
    } else {
      throw new Error("Invalid action");
    }

    await user.save();

    return res.json({ success: true, verificationStatus: user.verificationStatus });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = { 
  getReports, 
  createReport, 
  resolveReport,
  getPendingVerifications,
  resolveVerification
};
