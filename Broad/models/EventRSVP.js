const mongoose = require("mongoose");

const EventRSVPSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "event",
      required: true,
    },
    status: {
      type: String,
      enum: ["attending", "interested"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee a unique RSVP state per user per event
EventRSVPSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("eventRSVP", EventRSVPSchema);
