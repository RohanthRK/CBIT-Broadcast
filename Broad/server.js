const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const app = express();
const { authSocket, socketServer, setIo } = require("./socketServer");
const posts = require("./routes/posts");
const users = require("./routes/users");
const comments = require("./routes/comments");
const messages = require("./routes/messages");
const notifications = require("./routes/notifications");
const bookmarks = require("./routes/bookmarks");
const admin = require("./routes/admin");
const lostFound = require("./routes/lostFound");
const resources = require("./routes/resources");
const events = require("./routes/events");
const PostLike = require("./models/PostLike");
const Post = require("./models/Post");

dotenv.config();

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: ["http://localhost:3000", ""],
  },
});

io.use(authSocket);
io.on("connection", (socket) => socketServer(socket));
setIo(io);

mongoose.set('strictQuery', false);
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  async () => {
    console.log("MongoDB connected");
    try {
      const User = require("./models/User");
      const adminExists = await User.findOne({ isAdmin: true });
      if (!adminExists) {
        await User.create({
          username: "cbitadmin",
          email: "admin@cbit.ac.in",
          password: "cbitadmin123",
          roll_no: "ADMIN0001",
          ph_no: "9999999999",
          department: "CSE",
          college: "CBIT",
          verificationStatus: "approved",
          isAdmin: true
        });
        console.log("Admin seeded successfully: username: cbitadmin, password: cbitadmin123");
      }

      // Migration: Automatically approve pre-existing users who don't have a verificationStatus field
      const migrationResult = await User.updateMany(
        { verificationStatus: { $exists: false } },
        { $set: { verificationStatus: "approved" } }
      );
      if (migrationResult.nModified > 0 || migrationResult.modifiedCount > 0) {
        console.log(`Migration: Approved ${migrationResult.nModified || migrationResult.modifiedCount} pre-existing users without verification status.`);
      }
    } catch (e) {
      console.error("Error seeding admin user:", e);
    }
  }
);

httpServer.listen(process.env.PORT || 4000, () => {
  console.log("Listening");
});

app.use(express.json());
app.use(cors());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/api/posts", posts);
app.use("/api/users", users);
app.use("/api/comments", comments);
app.use("/api/messages", messages);
app.use("/api/notifications", notifications);
app.use("/api/bookmarks", bookmarks);
app.use("/api/admin", admin);
app.use("/api/lost-found", lostFound);
app.use("/api/resources", resources);
app.use("/api/events", events);

if (process.env.NODE_ENV == "production") {
  app.use(express.static(path.join(__dirname, "/client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}
