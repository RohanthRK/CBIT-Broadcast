const mongoose = require("mongoose");

const LostFoundItemSchema = new mongoose.Schema(
  {
    reporter: {
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
      maxLength: [2000, "Description must be no more than 2000 characters"],
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
    category: {
      type: String,
      enum: ["Electronics", "Documents", "Keys", "Wallets/Bags", "Clothing", "Other"],
      default: "Other",
    },
    location: {
      type: String,
      required: true,
      maxLength: [200, "Location must be no more than 200 characters"],
    },
    date: {
      type: Date,
      required: true,
    },
    contactInfo: {
      type: String,
      maxLength: [200, "Contact info must be no more than 200 characters"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("lostFoundItem", LostFoundItemSchema);
