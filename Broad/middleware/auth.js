const jwt = require("jsonwebtoken");
// Subsequent requests by the user will include the assigned JWT.
//This token tells the server what routes, services, and resources the user is allowed to access.
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    if (!token) {
      throw new Error("No token provided");
    }

    const { userId, isAdmin } = jwt.decode(token, process.env.TOKEN_KEY);

    req.body = {
      ...req.body,
      userId,
      isAdmin,
    };

    return next();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const optionallyVerifyToken = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];

    if (!token) return next();

    const decoded = jwt.decode(token, process.env.TOKEN_KEY);
    req.body.userId = decoded.userId;

    next();
  } catch (err) {
    return next();
  }
};

module.exports = { verifyToken, optionallyVerifyToken };