import User from "../database/userSchema.js";
import { generateJWTtoken } from "./jwt.auth.js";

export const handleSignUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    // check is the user is already present or not
    if (userExists) {
      return res.status(400).json({ message: "User already Exists" });
    }

    // if new user then create a user in the db
    const newUser = await User.create({
      name,
      email,
      password,
    });

    const token = generateJWTtoken(newUser);

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      token,
    });
  } catch (err) {
    console.log("Failed to signup");
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // finding the user in the database
    const user = await User.findOne({ email }).select("+password");

    // if user not exist
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // match the password given
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // auth successfull now generate the token
    const token = generateJWTtoken(user);
    

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const handleVerifyUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }

    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error during verification" });
  }
};
