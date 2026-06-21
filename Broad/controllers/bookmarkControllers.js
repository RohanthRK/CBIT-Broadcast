const Bookmark = require("../models/Bookmark");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const paginate = require("../util/paginate");

const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    const existingBookmark = await Bookmark.findOne({ postId, userId });

    if (existingBookmark) {
      throw new Error("Post is already bookmarked");
    }

    await Bookmark.create({ postId, userId });

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unbookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const existingBookmark = await Bookmark.findOne({ postId, userId });

    if (!existingBookmark) {
      throw new Error("Post is not bookmarked");
    }

    await existingBookmark.remove();

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getBookmarkedPosts = async (req, res) => {
  try {
    const { userId } = req.body;
    let { page, sortBy } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let posts = await Bookmark.find({ userId })
      .sort(sortBy)
      .populate({ path: "postId", populate: { path: "poster" } })
      .lean();

    posts = paginate(posts, 10, page);

    const count = posts.length;

    let responsePosts = [];
    posts.forEach((post) => {
      if (post.postId) {
        post.postId.bookmarked = true;
        responsePosts.push(post.postId);
      }
    });

    if (userId && responsePosts.length > 0) {
      const userPostLikes = await PostLike.find({ userId });
      responsePosts.forEach((post) => {
        userPostLikes.forEach((userPostLike) => {
          if (userPostLike.postId.equals(post._id)) {
            post.liked = true;
          }
        });
      });
    }

    return res.json({ data: responsePosts, count });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = { bookmarkPost, unbookmarkPost, getBookmarkedPosts };
