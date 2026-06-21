const mongoose = require("mongoose");

const BookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    postId: {
      type: mongoose.Types.ObjectId,
      ref: "post",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("bookmark", BookmarkSchema);
