import jwt from "jsonwebtoken";
import User from "../database/userSchema.js";

export const generateJWTtoken = (user) => {
  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
  const payload = {
    id: user._id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "24h" });
};

export const requireAuth = async (req, res, next) => {
  let token;

  // Check if the header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      //  Extract the token from the string "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      //  Decrypt/Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      // Find the user in DB 
      req.user = await User.findById(decoded.id).select("-password");

      next(); 
    } catch (error) {
      console.error("Token Verification Failed:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    console.log(token);
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
