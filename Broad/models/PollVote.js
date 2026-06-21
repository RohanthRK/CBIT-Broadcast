const mongoose = require("mongoose");

const PollVoteSchema = new mongoose.Schema(
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
    optionIds: [
      {
        type: mongoose.Types.ObjectId,
        required: true,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("pollvote", PollVoteSchema);
