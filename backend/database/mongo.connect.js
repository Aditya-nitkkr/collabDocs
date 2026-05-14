import mongoose from "mongoose";

export const connectMongoDB = async (url) => {
  try {
    await mongoose.connect(url);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("mongoDb not connected ");
  }
};
