import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  
  roomId: {
    type: String,
    required: true,
    index: true, 
  },

  // We store the FULL Y.Doc binary here every 20 minutes
  data: {
    type: Buffer,
    required: true,
  },

  // Useful for the Owner to identify who was editing at this time
  lastEditor: {
    type: String,
    default: "System",
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },


  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: '30d' 
  }
});

// We only need one index to quickly find all history for a specific room
historySchema.index({ roomId: 1, timestamp: -1 });

const HistoryModel = mongoose.model("DocumentHistory", historySchema);
export default HistoryModel;