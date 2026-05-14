import HistoryModel from "../database/document.historySchema.js";
import { v4 as uuidv4 } from "uuid";
import Document from "../database/document.js";
import * as Y from "yjs";
import { Request } from "../database/RequestSchema.js";
import User from "../database/userSchema.js";

//  Function to fetch the version from the history when revert request from the owner comes
export const handleFetchVersion = async (req, res) => {
  const { roomId } = req.params;
 
  try {
    const history = await HistoryModel.find({ roomId }).sort({
      timestamp: -1,
    });
 
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ error: "Database search failed" });
  }
};

//Function to  make the global unique room id
export const handleMakeDocRoom = async (req, res) => {
  try {
    const roomId = uuidv4();
    
    const ydoc = new Y.Doc();
    const initialState = Buffer.from(Y.encodeStateAsUpdate(ydoc));

    const newDoc = await Document.create({
      roomId: roomId,
      owner: req.user._id,
      title: "Untitled Document",
      data: initialState,
    });

    
    res.status(201).json({ roomId: newDoc.roomId });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Function to get the rooms from the db
export const handleGetRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const rooms = await Document.find({
      $or: [
        { owner: userId },
        {
          "collaborators.user": userId,
        },
      ],
    })
      .select("roomId owner title lastUpdated createdAt")
      .sort("-createdAt");
    return res.status(200).json({ rooms });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching rooms" });
  }
};

// Function to delete the room 
export const handleDeleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    let doc = await Document.findOne({ roomId });
    const isOwner = doc.owner.toString() === userId.toString();

    //  if the user is owner then only he can delete the document
    if (isOwner) {
      const deletedDoc = await Document.findOneAndDelete({
        roomId: roomId,
        owner: req.user._id,
      });

      if (!deletedDoc) {
        return res
          .status(404)
          .json({ message: "Room not found or unauthorized" });
      }

      return res.status(200).json({ message: "Room deleted successfully" });
    }

    //if the user is not a owner or the document is the public then it can only remove the
    //document from its editor dashboard
    else {
      await Document.updateOne(
        { roomId },
        { $pull: { collaborators: { user: userId } } },
      );

      res.status(200).json({ message: "Removed from dashboard" });
    }
  } catch (err) {
    console.error("Delete Error:", err.message);
    return res.status(500).json({ message: "Server error during deletion" });
  }
};

// Function to rename the title of the room
export const handleRename = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title cannot be empty" });
    }

    const updatedDoc = await Document.findOneAndUpdate(
      { roomId: roomId },
      { title: title },
      { new: true }, 
    );
    
    if (!updatedDoc) {
      return res
        .status(404)
        .json({ message: "Document not found or unauthorized" });
    }

    res.status(200).json(updatedDoc);
  } catch (error) {
    res.status(500).json({ message: "Error updating title" });
  }
};

// Function to get the room data according to the controls
export const handleGetRoomData = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  try {
    let doc = await Document.findOne({ roomId });

    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.owner.toString() === userId.toString();

    if (!isOwner) {
      const isAlreadyCollaborator = doc.collaborators.some(
        (c) => c?.user?.toString() === userId?.toString(),
      );

      if (!isAlreadyCollaborator) {
        doc.collaborators.push({
          user: userId,
          userPermission: "view",
          status: "pending",
        });
        doc = await doc.save();
      }
    }

    let permission = "view";
    let currStatus = "pending";

    if (isOwner) {
      permission = "edit";
      currStatus = "accept";
    } else {
      const collabRecord = doc.collaborators.find(
        (c) => c.user.toString() === userId.toString(),
      );

      if (collabRecord) {
        currStatus = collabRecord.status;
        permission = collabRecord.userPermission;
      }

      if (doc.accessControl === "public") {
        permission = doc.globalPermission;
      }
    }

    return res.status(200).json({
      userPermission: permission,
      currStatus,
    });
  } catch (err) {
    console.error("Room Data Error:", err);
    return res.status(500).json({ message: "Server error joining room" });
  }
};

// Function to get the owner of the document
export const handleCheckOwner = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  try {
    const doc = await Document.findOne({ roomId }).select("roomId owner title");

    const isOwner = doc.owner.toString() === userId.toString();

    return res.status(200).json({ isowner: isOwner, title: doc.title });
  } catch (err) {
    console.log(`Error in finding the doc with the room id :${roomId} `, err);
  }
};

// Function to handle the share settings by the owner when the user directed to the room
export const handleRoomShareSettings = async (req, res) => {
  const { accessControl, globalPermission } = req.body;
  const userId = req.user._id;
  const { roomId } = req.params;

  try {
    const doc = await Document.findOne({ roomId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // check the documendt belong to the owner or document
    const isOwner = doc.owner.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "unauthorized" });
    }

    // if noting is send from the frontend
    if (accessControl !== undefined) doc.accessControl = accessControl;
    if (globalPermission !== undefined) doc.globalPermission = globalPermission;
    await doc.save();

    return res.status(200).json({ message: "Permission updated" });
  } catch (error) {
    console.log("Error in permission saving ", error);
  }
};

//Function to  get the  access controls and the permissions store in the db
export const handleGetAccessAndPermission = async (req, res) => {
  const { roomId } = req.params;
  try {
    const doc = await Document.findOne({ roomId });
    return res.status(200).json({
      accessControl: doc.accessControl,
      globalPermission: doc.globalPermission,
    });
  } catch (error) {
    console.log("Error in the fetching the access ", error);
  }
};

// Function to handle the user edit document request by the owner
export const handleUserRequest = async (req, res) => {
  const ownerId = req.user._id;
  const { roomId, targetUserId, decision } = req.body;

  try {
    const doc = await Document.findOne({ roomId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let collab = doc.collaborators.find(
      (c) => c.user.toString() === targetUserId.toString(),
    );

    if (decision === "allow") {
      if (collab) {
        collab.userPermission = "edit";
        collab.status = "accept";
      } else {
        doc.collaborators.push({
          user: targetUserId,
          userPermission: "edit",
          status: "accept",
        });
      }
    } else if (decision === "deny") {
      if (collab) {
        collab.status = "denied";
      }
    }

    doc.markModified("collaborators");
    await doc.save();

    const deleteResult = await Request.findOneAndDelete({
      roomId: roomId,
      requestorId: targetUserId,
    });

    if (deleteResult) {
      console.log("Successfully deleted request from DB");
    } else {
      console.log("Failed to delete: No matching request found for:", {
        roomId,
        targetUserId,
      });
    }

    return res.status(200).json({
      message: `Access ${decision}ed successfully`,
      deleted: !!deleteResult,
    });
  } catch (error) {
    console.error("Error in request handling:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Function to save the requests for a document edit into the db
export const handleUserRequestSave = async (req, res) => {
  try {
    const { roomId } = req.body;
    const requestorId = req.user._id;

    const doc = await Document.findOne({ roomId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const ownerId = doc.owner;

    const existing = await Request.findOne({
      roomId,
      requestorId,
      status: "pending",
    });
    if (existing)
      return res.status(400).json({ message: "Request already pending!" });

    let newRequest = await Request.create({
      roomId,
      requestorId,
      ownerId,
    });

    const userData = await User.findById(requestorId).select("name");


    const responseData = {
      ...newRequest._doc,
      requestorId: {
        _id: userData._id,
        name: userData.name,
      },
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "Server error saving request" });
  }
};

// Function to fetch the pending request from the request model
export const handlePendingRequests = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user._id;

    const doc = await Document.findOne({ roomId: req.params.roomId });
    if (!doc) return res.status(404).json({ message: "Room not found" });

    if (doc.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    const ownerId = doc.owner.toString();
    const pendingRequests = await Request.find({
      roomId,
      ownerId,
      status: "pending",
    })
      .populate({ path: "requestorId", model: User, select: "name" })
      .sort({ createdAt: -1 }); 

    const responseData = {
      roomTitle: doc.title,
      requests: pendingRequests,
    };
    return res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Detailed Error:", error);
    return res.status(500).json({
      message: "Internal server error."
    });
  }
};
