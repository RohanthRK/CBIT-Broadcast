const Resource = require("../models/Resource");

const getResources = async (req, res) => {
  try {
    const { department, year, subject, search } = req.query;
    const filter = {};

    if (department && department !== "All") filter.department = department;
    if (year) filter.year = year;
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const resources = await Resource.find(filter)
      .populate("uploader", "username email")
      .sort("-createdAt");

    return res.status(200).json(resources);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const createResource = async (req, res) => {
  try {
    const { title, description, subject, department, year, userId } = req.body;

    if (!title || !subject || !department || !year) {
      throw new Error("Missing required inputs");
    }

    if (!req.file) {
      throw new Error("Please upload a file");
    }

    const fileUrl = "/public/uploads/" + req.file.filename;
    const fileType = req.file.mimetype;

    const resource = await Resource.create({
      uploader: userId,
      title,
      description,
      subject,
      department,
      year,
      fileUrl,
      fileType,
    });

    await resource.populate("uploader", "username email");

    return res.status(201).json(resource);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const upvoteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    const index = resource.upvotes.indexOf(userId);
    if (index === -1) {
      resource.upvotes.push(userId);
    } else {
      resource.upvotes.splice(index, 1);
    }

    await resource.save();
    await resource.populate("uploader", "username email");

    return res.status(200).json(resource);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, department, year, userId, isAdmin } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    if (resource.uploader.toString() !== userId && !isAdmin) {
      throw new Error("Unauthorized to modify this resource");
    }

    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (subject !== undefined) resource.subject = subject;
    if (department !== undefined) resource.department = department;
    if (year !== undefined) resource.year = year;

    if (req.file) {
      resource.fileUrl = "/public/uploads/" + req.file.filename;
      resource.fileType = req.file.mimetype;
    }

    await resource.save();
    await resource.populate("uploader", "username email");

    return res.status(200).json(resource);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    if (resource.uploader.toString() !== userId && !isAdmin) {
      throw new Error("Unauthorized to delete this resource");
    }

    await resource.remove();

    return res.status(200).json({ success: true, message: "Resource deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getResources,
  createResource,
  upvoteResource,
  updateResource,
  deleteResource,
};
