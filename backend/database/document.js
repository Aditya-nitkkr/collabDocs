import mongoose from "mongoose";

export const documentSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, default: "Untitled Document" },

    data: { type: Buffer, required: true },
    
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    // 'public '-> owner wants anyone can edit and view
    // "private" -> owner wants a control access to anyone who want to join the room
    accessControl: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    // 'view' -> this is default to anyone who is joining the room
    //'edit' -> if the accessControl is 'public' then  the document is automatically update to 'edit' mode
    globalPermission: {
      type: String,
      enum: ["view", "edit"],
      default: "view",
    },

    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userPermission: {
          type: String,
          enum: ["view", "edit"],
          default: "view",
        },
        status: {
          type: String,
          //pending -> collab can send the request for access
          //accept -> collab request was already accepted  
          //denied ->collab request is denied
          enum: ["accept", "pending","denied"],
          default: "pending",
        },
      },
    ],

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
