const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const PostLike = require("../models/PostLike");
const Bookmark = require("../models/Bookmark");
const PollVote = require("../models/PollVote");
const Notification = require("../models/Notification");
const { emitToUser } = require("../socketServer");
const paginate = require("../util/paginate");
const cooldown = new Set();

const createPost = async (req, res) => {
  try {
    const { title, content, userId, category, targetDepartment, attachmentLayout } = req.body;
    let poll = req.body.poll;
    if (typeof poll === 'string' && poll.trim() !== "") {
      try { poll = JSON.parse(poll); } catch(e) {}
    }

    if (!(title && content)) {
      throw new Error("All input required");
    }

    if (cooldown.has(userId)) {
      throw new Error(
        "You are posting too frequently. Please try again shortly."
      );
    }

    cooldown.add(userId);
    setTimeout(() => {
      cooldown.delete(userId);
    }, 60000);

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        url: "/public/uploads/" + file.filename,
        type: file.mimetype.startsWith("image/") ? "image" : "document"
      }));
    }

    let attachmentUrl = "";
    let attachmentType = "none";
    if (attachments.length > 0) {
      attachmentUrl = attachments[0].url;
      attachmentType = attachments[0].type;
    }

    const post = await Post.create({
      title,
      content,
      poster: userId,
      category: category || "General",
      targetDepartment: targetDepartment || "All",
      poll: poll || undefined,
      attachmentUrl,
      attachmentType,
      attachments,
      attachmentLayout: attachmentLayout || "grid",
    });

    res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Post does not exist");
    }

    const post = await Post.findById(postId)
      .populate("poster", "-password")
      .lean();

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (userId) {
      await setLiked([post], userId);
      await setBookmarked([post], userId);
      await setVoted([post], userId);
    }

    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, userId, isAdmin, category } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to update post");
    }

    post.content = content;
    if (category) {
      post.category = category;
    }
    post.edited = true;

    await post.save();

    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to delete post");
    }

    await post.remove();

    await Comment.deleteMany({ post: post._id });

    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const setLiked = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };

  const userPostLikes = await PostLike.find(searchCondition);

  posts.forEach((post) => {
    userPostLikes.forEach((userPostLike) => {
      if (userPostLike.postId.equals(post._id)) {
        post.liked = true;
        return;
      }
    });
  });
};

const setBookmarked = async (posts, userId) => {
  const userBookmarks = await Bookmark.find({ userId });

  posts.forEach((post) => {
    userBookmarks.forEach((bookmark) => {
      if (bookmark.postId.equals(post._id)) {
        post.bookmarked = true;
        return;
      }
    });
  });
};

const setVoted = async (posts, userId) => {
  const userVotes = await PollVote.find({ userId });
  posts.forEach((post) => {
    if (post.poll && post.poll.options) {
      userVotes.forEach((vote) => {
        if (vote.postId.equals(post._id)) {
          post.poll.votedOptions = vote.optionIds;
        }
      });
    }
  });
};

const getUserLikedPosts = async (req, res) => {
  try {
    const likerId = req.params.id;
    const { userId } = req.body;
    let { page, sortBy } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let posts = await PostLike.find({ userId: likerId })
      .sort(sortBy)
      .populate({ path: "postId", populate: { path: "poster" } })
      .lean();

    posts = paginate(posts, 10, page);

    const count = posts.length;

    let responsePosts = [];
    posts.forEach((post) => {
      responsePosts.push(post.postId);
    });

    if (userId) {
      await setLiked(responsePosts, userId);
    }

    return res.json({ data: responsePosts, count });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { userId } = req.body;

    let { page, sortBy, author, search, liked, category, feedScope } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let posts = await Post.find()
      .populate("poster", "-password")
      .sort(sortBy)
      .lean();

    if (author) {
      posts = posts.filter((post) => post.poster.username == author);
    }

    if (search) {
      posts = posts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      posts = posts.filter((post) => post.category === category);
    }

    if (feedScope && feedScope !== "All") {
      posts = posts.filter((post) => post.targetDepartment === "All" || post.targetDepartment === feedScope);
    }

    const count = posts.length;

    posts = paginate(posts, 10, page);

    if (userId) {
      await setLiked(posts, userId);
      await setBookmarked(posts, userId);
      await setVoted(posts, userId);
    }

    return res.json({ data: posts, count });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    const existingPostLike = await PostLike.findOne({ postId, userId });

    if (existingPostLike) {
      throw new Error("Post is already liked");
    }

    await PostLike.create({
      postId,
      userId,
    });

    post.likeCount = (await PostLike.find({ postId })).length;

    await post.save();

    if (post.poster.toString() !== userId) {
      const notification = await Notification.create({
        recipient: post.poster,
        sender: userId,
        type: "like",
        postId: post._id,
      });
      await notification.populate("sender", "username");
      emitToUser(post.poster.toString(), "receive-notification", notification);
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    const existingPostLike = await PostLike.findOne({ postId, userId });

    if (!existingPostLike) {
      throw new Error("Post is already not liked");
    }

    await existingPostLike.remove();

    post.likeCount = (await PostLike.find({ postId })).length;

    await post.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, optionIds } = req.body;

    const post = await Post.findById(postId);
    if (!post || !post.poll) {
      throw new Error("Poll does not exist");
    }

    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      throw new Error("Invalid options");
    }

    if (!post.poll.multipleChoice && optionIds.length > 1) {
      throw new Error("Multiple choice is not enabled for this poll");
    }

    let existingVote = await PollVote.findOne({ postId, userId });
    
    if (existingVote) {
      if (!post.poll.allowEditVote) {
        throw new Error("Changing votes is not allowed for this poll");
      }
      
      existingVote.optionIds.forEach(oldOptId => {
        const option = post.poll.options.id(oldOptId);
        if (option && option.votes > 0) option.votes -= 1;
      });

      optionIds.forEach(newOptId => {
        const option = post.poll.options.id(newOptId);
        if (option) option.votes += 1;
      });

      existingVote.optionIds = optionIds;
      await existingVote.save();
      await post.save();
    } else {
      optionIds.forEach(optId => {
        const option = post.poll.options.id(optId);
        if (option) option.votes += 1;
      });

      await post.save();
      await PollVote.create({ userId, postId, optionIds });
    }

    return res.json({ success: true, optionIds });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getPost,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserLikedPosts,
  votePoll,
};
