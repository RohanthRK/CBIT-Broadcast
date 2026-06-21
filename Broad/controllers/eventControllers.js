const Event = require("../models/Event");
const EventRSVP = require("../models/EventRSVP");

const getEvents = async (req, res) => {
  try {
    const { department, timeframe } = req.query;
    const { userId } = req.body; // Set by optionallyVerifyToken if logged in

    const filter = {};
    if (department && department !== "All") {
      filter.department = { $in: [department, "All"] };
    }

    const now = new Date();
    if (timeframe === "upcoming") {
      filter.endDate = { $gte: now };
    } else if (timeframe === "past") {
      filter.endDate = { $lt: now };
    }

    const events = await Event.find(filter)
      .populate("creator", "username email")
      .sort("startDate");

    // Fetch RSVP details for all events in parallel
    const eventIds = events.map((e) => e._id);
    const rsvps = await EventRSVP.find({ event: { $in: eventIds } });

    const results = events.map((event) => {
      const eventRSVPs = rsvps.filter((r) => r.event.toString() === event._id.toString());
      const attendingCount = eventRSVPs.filter((r) => r.status === "attending").length;
      const interestedCount = eventRSVPs.filter((r) => r.status === "interested").length;

      let userRSVPStatus = "";
      if (userId) {
        const userRSVP = eventRSVPs.find((r) => r.user.toString() === userId.toString());
        if (userRSVP) {
          userRSVPStatus = userRSVP.status;
        }
      }

      return {
        ...event.toObject(),
        attendingCount,
        interestedCount,
        userRSVPStatus,
      };
    });

    return res.status(200).json(results);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, department, userId } = req.body;

    if (!title || !description || !location || !startDate || !endDate) {
      throw new Error("Missing required inputs");
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = "/public/uploads/" + req.file.filename;
    }

    const event = await Event.create({
      creator: userId,
      title,
      description,
      location,
      startDate,
      endDate,
      department: department || "All",
      imageUrl,
    });

    await event.populate("creator", "username email");

    return res.status(201).json({
      ...event.toObject(),
      attendingCount: 0,
      interestedCount: 0,
      userRSVPStatus: "",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const rsvpEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body; // status is attending or interested, or empty/null to remove

    const event = await Event.findById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (!status) {
      // Remove RSVP
      await EventRSVP.deleteOne({ user: userId, event: id });
    } else {
      if (!["attending", "interested"].includes(status)) {
        throw new Error("Invalid RSVP status");
      }
      // Upsert RSVP
      await EventRSVP.findOneAndUpdate(
        { user: userId, event: id },
        { status },
        { upsert: true, new: true }
      );
    }

    // Get updated RSVP counts for this event
    const eventRSVPs = await EventRSVP.find({ event: id });
    const attendingCount = eventRSVPs.filter((r) => r.status === "attending").length;
    const interestedCount = eventRSVPs.filter((r) => r.status === "interested").length;

    return res.status(200).json({
      eventId: id,
      attendingCount,
      interestedCount,
      userRSVPStatus: status || "",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, startDate, endDate, department, userId, isAdmin } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.creator.toString() !== userId && !isAdmin) {
      throw new Error("Unauthorized to modify this event");
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (startDate !== undefined) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate;
    if (department !== undefined) event.department = department;

    if (req.file) {
      event.imageUrl = "/public/uploads/" + req.file.filename;
    }

    await event.save();
    await event.populate("creator", "username email");

    // Fetch RSVP details
    const eventRSVPs = await EventRSVP.find({ event: id });
    const attendingCount = eventRSVPs.filter((r) => r.status === "attending").length;
    const interestedCount = eventRSVPs.filter((r) => r.status === "interested").length;

    let userRSVPStatus = "";
    const userRSVP = eventRSVPs.find((r) => r.user.toString() === userId.toString());
    if (userRSVP) {
      userRSVPStatus = userRSVP.status;
    }

    return res.status(200).json({
      ...event.toObject(),
      attendingCount,
      interestedCount,
      userRSVPStatus,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.creator.toString() !== userId && !isAdmin) {
      throw new Error("Unauthorized to delete this event");
    }

    await event.remove();
    // Delete RSVPs associated with this event
    await EventRSVP.deleteMany({ event: id });

    return res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  rsvpEvent,
  updateEvent,
  deleteEvent,
};
