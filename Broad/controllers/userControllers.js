const User = require("../models/User");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const { emitToUser } = require("../socketServer");
const { default: mongoose } = require("mongoose");

const getUserDict = (token, user) => {
  return {
    token,
    username: user.username,
    userId: user._id,
    isAdmin: user.isAdmin,
  };
};

const buildToken = (user) => {
  return {
    userId: user._id,
    isAdmin: user.isAdmin,
  };
};

const register = async (req, res) => {
  try {
    const { username, email, password, roll_no, ph_no, department, college, collegeEmail } = req.body;

    if (!(username && email && password && roll_no && ph_no && department && college)) {
      throw new Error("All inputs are required");
    }

    if (!collegeEmail && !req.file) {
      throw new Error("Please enter college email or upload ID card proof");
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });

    if (existingUser) {
      throw new Error("Email and username must be unique");
    }

    let idProofUrl = "";
    if (req.file) {
      idProofUrl = "/public/uploads/" + req.file.filename;
    }

    const user = await User.create({
      username,
      email: normalizedEmail,
      password,
      roll_no,
      ph_no,
      department,
      college,
      collegeEmail: collegeEmail || "",
      idProofUrl,
      verificationStatus: "pending",
    });

    return res.json({
      success: true,
      message: "Registration successful. Please wait for admin approval.",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      throw new Error("All input required");
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error("Email or password incorrect");
    }

    if (password != user.password) {
      throw new Error("Email or password incorrect");
    }

    if (user.verificationStatus === "pending") {
      throw new Error("Your account is pending verification by the admin. Please try again later.");
    }

    if (user.verificationStatus === "rejected") {
      throw new Error("Your registration has been rejected. Please contact support.");
    }

    const token = jwt.sign(buildToken(user), process.env.TOKEN_KEY);

    return res.json(getUserDict(token, user));
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const follow = async (req, res) => {
  try {
    const { userId } = req.body;
    const followingId = req.params.id;

    const existingFollow = await Follow.findOne({ userId, followingId });

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    const follow = await Follow.create({ userId, followingId });

    if (userId !== followingId) {
      const notification = await Notification.create({
        recipient: followingId,
        sender: userId,
        type: "follow",
      });
      await notification.populate("sender", "username");
      emitToUser(followingId, "receive-notification", notification);
    }

    return res.status(200).json({ data: follow });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, biography, skills, socialLinks, year, projects } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User does not exist");
    }

    if (typeof biography === "string") {
      user.biography = biography;
    }
    if (Array.isArray(skills)) {
      user.skills = skills;
    }
    if (socialLinks && typeof socialLinks === "object") {
      user.socialLinks = socialLinks;
    }
    if (year !== undefined) {
      user.year = year;
    }
    if (Array.isArray(projects)) {
      user.projects = projects;
    }

    await user.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unfollow = async (req, res) => {
  try {
    const { userId } = req.body;
    const followingId = req.params.id;

    const existingFollow = await Follow.findOne({ userId, followingId });

    if (!existingFollow) {
      throw new Error("Not already following user");
    }

    await existingFollow.remove();

    return res.status(200).json({ data: existingFollow });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;

    const followers = await Follow.find({ followingId: userId });

    return res.status(200).json({ data: followers });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    const following = await Follow.find({ userId });

    return res.status(200).json({ data: following });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    const username = req.params.username;
    const { userId: requesterId } = req.body;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      throw new Error("User does not exist");
    }

    const posts = await Post.find({ poster: user._id })
      .populate("poster")
      .sort("-createdAt");

    let likeCount = 0;
    posts.forEach((post) => {
      likeCount += post.likeCount;
    });

    const followerCount = await Follow.countDocuments({ followingId: user._id });
    const followingCount = await Follow.countDocuments({ userId: user._id });

    let isFollowing = false;
    if (requesterId) {
      const existingFollow = await Follow.findOne({
        userId: requesterId,
        followingId: user._id,
      });
      isFollowing = !!existingFollow;
    }

    const data = {
      user,
      posts: {
        count: posts.length,
        likeCount,
        data: posts,
      },
      followerCount,
      followingCount,
      isFollowing,
    };

    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getRandomUsers = async (req, res) => {
  try {
    let { size } = req.query;

    const users = await User.find().select("-password");

    const randomUsers = [];

    if (size > users.length) {
      size = users.length;
    }

    const randomIndices = getRandomIndices(size, users.length);

    for (let i = 0; i < randomIndices.length; i++) {
      const randomUser = users[randomIndices[i]];
      randomUsers.push(randomUser);
    }

    return res.status(200).json(randomUsers);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getRandomIndices = (size, sourceSize) => {
  const randomIndices = [];
  while (randomIndices.length < size) {
    const randomNumber = Math.floor(Math.random() * sourceSize);
    if (!randomIndices.includes(randomNumber)) {
      randomIndices.push(randomNumber);
    }
  }
  return randomIndices;
};

const getUsersByDepartment = async (req, res) => {
  try {
    const { department } = req.query;

    let users = await User.find().select("-password");

    if (department && department !== "All") {
      users = users.filter((u) => u.department === department);
    }

    return res.status(200).json(users);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getUser,
  getRandomUsers,
  getUsersByDepartment,
  updateUser,
};
