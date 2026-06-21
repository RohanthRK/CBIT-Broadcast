const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: [100, "Title must be no more than 100 characters"],
    },
    description: {
      type: String,
      required: true,
      maxLength: [3000, "Description must be no more than 3000 characters"],
    },
    location: {
      type: String,
      required: true,
      maxLength: [200, "Location must be no more than 200 characters"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      default: "All",
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("event", EventSchema);
