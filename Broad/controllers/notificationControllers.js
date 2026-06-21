const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username")
      .sort("-createdAt")
      .limit(20);

    return res.json(notifications);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const { userId } = req.body;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = { getNotifications, markAllRead };
