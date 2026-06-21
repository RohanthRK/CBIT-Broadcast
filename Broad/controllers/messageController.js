const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");

const sendMessage = async (req, res) => {
  try {
    const recipientId = req.params.id;
    const { content, userId } = req.body;

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      throw new Error("Recipient not found");
    }

    let conversation = await Conversation.findOne({
      recipients: {
        $all: [userId, recipientId],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        recipients: [userId, recipientId],
      });
    }

    await Message.create({
      conversation: conversation._id,
      sender: userId,
      content,
    });

    conversation.lastMessageAt = Date.now();

    conversation.save();

    return res.json({ success: true, conversationId: conversation._id });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { userId } = req.body;

    let conversation;
    if (mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        // Fallback: check if conversationId is actually the recipient's user ID
        conversation = await Conversation.findOne({
          recipients: {
            $all: [userId, conversationId],
          },
        });
      }
    }

    if (!conversation) {
      // Return empty array for brand-new conversations
      return res.json([]);
    }

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "-password")
      .sort("-createdAt")
      .limit(12);

    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: userId }, read: false },
      { read: true }
    );

    return res.json(messages);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.body;

    const conversations = await Conversation.find({
      recipients: {
        $in: [userId],
      },
    })
      .populate("recipients", "-password")
      .sort("-updatedAt")
      .lean();

    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      for (let j = 0; j < 2; j++) {
        if (conversation.recipients[j]._id != userId) {
          conversation.recipient = conversation.recipients[j];
        }
      }
      conversation.unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: userId },
        read: false
      });
    }

    return res.json(conversations);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.body;
    const conversations = await Conversation.find({ recipients: { $in: [userId] } });
    const conversationIds = conversations.map(c => c._id);
    const count = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      read: false
    });
    return res.json({ count });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  getUnreadCount,
};
