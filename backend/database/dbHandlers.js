import Document from "./document.js";
import HistoryModel from "./document.historySchema.js";
import * as Y from "yjs";

// Function to get the document from the db
export const getDocument = async (roomId) => {
  const docFromDb = await Document.findOne({ roomId });
  const ydoc = new Y.Doc();

  if (docFromDb) {
    Y.applyUpdate(ydoc, new Uint8Array(docFromDb.data));
  }
  return ydoc;
};

// Function to save the document in db
export const saveDocument = async (roomId, ydoc) => {
  const binaryState = Y.encodeStateAsUpdate(ydoc);

  if (binaryState.length === 0) return;

  await Document.findOneAndUpdate(
    { roomId },
    {
      data: Buffer.from(binaryState),
      lastUpdated: new Date(),
    },
    { upsert: true },
  );
  console.log(`Room ${roomId} saved to Database`);
};

// Function to save the document into the permanent History
export const saveToHistoryCollection = async (roomId, ydoc) => {
  const binaryState = Y.encodeStateAsUpdate(ydoc);

  if (binaryState.length === 0) return;

  const newSnapshot = await HistoryModel.create({
    roomId,
    data: Buffer.from(binaryState),
    timestamp: new Date(),
  });

  const newSnapshotId = newSnapshot._id;
  // console.log(` History Snapshot: Room ${roomId} , Id : ${newSnapshotId}`);
  return newSnapshotId;
};

// Function to get the document version when owner want the past document
export const getVersion = async (roomId, snapId) => {
  const binaryData = await HistoryModel.findOne({
    roomId: roomId,
    _id: snapId,
  });

  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, new Uint8Array(binaryData.data));

  const content = ydoc.getXmlFragment("default").toString();

  return ydoc;
};
