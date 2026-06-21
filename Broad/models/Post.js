const mongoose = require("mongoose");
const filter = require("../util/filter");
const PostLike = require("./PostLike");

const PostSchema = new mongoose.Schema(
  {
    poster: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: [80, "Must be no more than 80 characters"],
    },
    content: {
      type: String,
      required: true,
      maxLength: [8000, "Must be no more than 8000 characters"],
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: [
        "General",
        "Academics",
        "Events",
        "Placements",
        "Sports",
        "Exam Cell",
        "Clubs",
      ],
      default: "General",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    poll: {
      question: { type: String },
      options: [
        { text: { type: String }, votes: { type: Number, default: 0 } }
      ],
      allowEditVote: { type: Boolean, default: false },
      showPercentages: { type: String, enum: ["always", "voted", "never"], default: "voted" },
      multipleChoice: { type: Boolean, default: false }
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    attachmentType: {
      type: String,
      enum: ["image", "document", "none"],
      default: "none",
    },
    attachments: [
      {
        url: { type: String },
        type: { type: String, enum: ["image", "document"] }
      }
    ],
    attachmentLayout: {
      type: String,
      enum: ["grid", "carousel"],
      default: "grid",
    },
    targetDepartment: {
      type: String,
      default: "All",
    },
  },
  { timestamps: true }
);

PostSchema.pre("save", function (next) {
  if (this.title.length > 0) {
    this.title = filter.clean(this.title);
  }

  if (this.content.length > 0) {
    this.content = filter.clean(this.content);
  }

  next();
});

PostSchema.pre("remove", async function (next) {
  console.log(this._id);
  await PostLike.deleteMany({ postId: this._id });
  next();
});

module.exports = mongoose.model("post", PostSchema);
