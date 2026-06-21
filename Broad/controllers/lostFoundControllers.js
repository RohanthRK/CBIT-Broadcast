const LostFoundItem = require("../models/LostFoundItem");

const getLostFoundItems = async (req, res) => {
  try {
    const { type, category, status, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const items = await LostFoundItem.find(filter)
      .populate("reporter", "username email")
      .sort("-createdAt");

    return res.status(200).json(items);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const createLostFoundItem = async (req, res) => {
  try {
    const { title, description, type, category, location, date, contactInfo, userId } = req.body;

    if (!title || !description || !type || !location || !date) {
      throw new Error("Missing required inputs");
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = "/public/uploads/" + req.file.filename;
    }

    const item = await LostFoundItem.create({
      reporter: userId,
      title,
      description,
      type,
      category,
      location,
      date,
      contactInfo,
      imageUrl,
    });

    await item.populate("reporter", "username email");

    return res.status(201).json(item);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, category, location, date, contactInfo, status, userId, isAdmin } = req.body;

    const item = await LostFoundItem.findById(id);
    if (!item) {
      throw new Error("Item not found");
    }

    if (item.reporter.toString() !== userId && !isAdmin) {
      throw new Error("Unauthorized to modify this item");
    }

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (type !== undefined) item.type = type;
    if (category !== undefined) item.category = category;
    if (location !== undefined) item.location = location;
    if (date !== undefined) item.date = date;
    if (contactInfo !== undefined) item.contactInfo = contactInfo;
    if (status !== undefined) item.status = status;

    if (req.file) {
      item.imageUrl = "/public/uploads/" + req.file.filename;
    }

    await item.save();

    await item.populate("reporter", "username email");

    return res.status(200).json(item);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deleteLostFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    const item = await LostFoundItem.findById(id);
    if (!item) {
      throw new Error("Item not found");
    }

    if (item.reporter.toString() !== userId && !isAdmin) {
      throw new Error("Unauthorized to delete this item");
    }

    await item.remove();

    return res.status(200).json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
};
