const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    uploader: {
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
      maxLength: [1000, "Description must be no more than 1000 characters"],
    },
    subject: {
      type: String,
      required: true,
      maxLength: [100, "Subject must be no more than 100 characters"],
    },
    department: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "",
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("resource", ResourceSchema);
