const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    postId: {
      type: mongoose.Types.ObjectId,
      ref: "post",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxLength: [500, "Reason must be at most 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("report", ReportSchema);
