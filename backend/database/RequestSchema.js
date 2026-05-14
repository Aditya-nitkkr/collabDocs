import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      ref: 'Document',
      required: true,
      index: true, // Indexed for fast lookups when the owner opens the room
    },

    requestorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The state of the request
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Prevent duplicate pending requests from the same user for the same room
RequestSchema.index({ roomId: 1, requestorId: 1, status: 1 }, { unique: true });

export const Request = mongoose.model("Request", RequestSchema);
