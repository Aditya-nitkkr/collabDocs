import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import * as Y from "yjs";
import userRoutes from "../backend/routes/user.routes.js";
import authRoutes from "../backend/routes/auth.routes.js";
import cors from "cors";
import { connectMongoDB } from "./database/mongo.connect.js";
import {
  getDocument,
  saveDocument,
  saveToHistoryCollection,
  getVersion,
} from "./database/dbHandlers.js";
import Document from "./database/document.js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.MONGO_URL;
const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);

//connection with the mongodb
connectMongoDB(url);

app.use(express.json());
app.use("/api/user/auth", authRoutes);
app.use("/api/docs", userRoutes);
app.use("/api/admin", userRoutes);
app.use("/api/user", userRoutes);

const httpServer = createServer(app);

// creating  master Document in the server memory
// const serverDoc = new Y.Doc();

// instead of creating a single server as a whole we create a room which allow
// the user to access a particular room only

const rooms = new Map();
const roomUserCounts = new Map();
const dirtyFlag = new Set();
const dirtyFlagPermanent = new Set();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // when a new user joining to the room with a specific room id
  socket.on("join-room", async (roomId) => {
    // if room is not there then server create the room
    let ydoc = rooms.get(roomId);

    if (!ydoc) {
      ydoc = await getDocument(roomId);
      rooms.set(roomId, ydoc);
    }

    // if (!rooms.has(roomId)) {
    //   // fetch the document from the database
    //   rooms.set(roomId, ydoc);
    // }

    socket.join(roomId);

    //track the user count in the curren room
    const count = roomUserCounts.get(roomId) || 0;
    roomUserCounts.set(roomId, count + 1);

    // Send the current state to this specific room to the user
    const currState = Y.encodeStateAsUpdate(ydoc);

    socket.emit("init-state", currState);
  });

  // when the update is coming we have to know in which room we have to move
  socket.on("update-doc", ({ roomId, update }) => {
    const doc = rooms.get(roomId);
    if (doc) {
      // apply server's master copy first
      Y.applyUpdate(doc, new Uint8Array(update));

      // mark the roomid to avoid the unnessary db hits
      dirtyFlag.add(roomId);
      dirtyFlagPermanent.add(roomId);

      //  then Relay the binary update to only to people of specific room
      socket.to(roomId).emit("update-doc", update);
    }
  });

  // reverting to the certain version history
  socket.on("revert-to-snapshot", async ({ roomId, snapId }) => {
    const fetchVersionDoc = await getVersion(roomId, snapId);
    if (fetchVersionDoc) {
      const roomDoc = rooms.get(roomId);

      roomDoc.transact(() => {
        const currentFrag = roomDoc.getXmlFragment("default");
        const historyFrag = fetchVersionDoc.getXmlFragment("default");

        currentFrag.delete(0, currentFrag.length);
        const historyDoc = historyFrag.toJSON();

        historyFrag.forEach((child, i) => {
          currentFrag.insert(i, [child.clone()]);
        });
      }, "server-overwrite");

      const update = Y.encodeStateAsUpdate(roomDoc);
      const updateBuffer = Buffer.from(update);

      io.to(roomId).emit("force-sync", updateBuffer);

      dirtyFlag.add(roomId);
    }
  });

  // user access and permission awareness to all other user
  socket.on("settings-updated", (roomId) => {
    socket.to(roomId).emit("refresh-permissions");
  });

  //handling the user request for the edit mode
  socket.on(
    "request-edit-access",
    async ({ roomId, userId, userName, roomTitle }) => {
      const doc = await Document.findOne({ roomId });

      if (doc) {
        //  Send to everyone in the room
        // We include 'targetOwnerId' so other collaborators ignore it
        io.to(roomId).emit("receive-edit-request", {
          senderId: userId,
          senderName: userName,
          targetOwnerId: doc.owner, // The ID of the person who should see this
          roomId: roomId,
          roomTitle: roomTitle,
        });
      }
    },
  );
  socket.on("owner-decision", ({ roomId, targetUserId, decision }) => {
    socket.to(roomId).emit("decision-sent", { targetUserId, decision });
  });

  socket.on("disconnect", () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        const newCount = (roomUserCounts.get(roomId) || 1) - 1;

        if (newCount <= 0) {
          const finalState = Y.encodeStateAsUpdate(rooms.get(roomId));
          saveDocument(roomId, finalState).then(() => {
            rooms.delete(roomId);
            roomUserCounts.delete(roomId);
            // console.log(`Room ${roomId} cleaned up from memory.`);
          });
        } else {
          roomUserCounts.set(roomId, newCount);
        }
      }
    }
  });
});

//auto save
const INTERVAL = 6000;

setInterval(async () => {
  if (dirtyFlag.size === 0) return;

  const dirtyRooms = Array.from(dirtyFlag);
  dirtyFlag.clear();

  for (const roomId of dirtyRooms) {
    const ydoc = rooms.get(roomId);

    if (ydoc) {
      await saveDocument(roomId, ydoc);
    }
  }
}, INTERVAL);

const LONG_INTERVAL = 20 * 60 * 1000; // 20 min

//permanent save
setInterval(async () => {
  if (dirtyFlagPermanent.size === 0) return 0;

  for (const roomId of dirtyFlagPermanent) {
    const ydoc = rooms.get(roomId);
    if (ydoc) {
      const snapId = await saveToHistoryCollection(roomId, ydoc);

      if (snapId) {
        io.to(roomId).emit("new-snapshot-available", {
          snapId: snapId,
          timestamp: new Date(),
        });
      }
    }
  }
  dirtyFlagPermanent.clear();
}, LONG_INTERVAL);

httpServer.listen(PORT, () => {
  console.log("Server running on port 3000");
});
