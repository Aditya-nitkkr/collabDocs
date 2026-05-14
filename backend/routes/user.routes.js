import express, { Router } from "express";
import {
  handleFetchVersion,
  handleMakeDocRoom,
  handleGetRooms,
  handleDeleteRoom,
  handleRename,
  handleGetRoomData,
  handleCheckOwner,
  handleRoomShareSettings,
  handleGetAccessAndPermission,
  handleUserRequest,
  handleUserRequestSave,
  handlePendingRequests,
} from "../controllers/user-details.controller.js";
import { requireAuth } from "../controllers/jwt.auth.js";
const router = Router();

router.get("/history/:roomId", requireAuth, handleFetchVersion);
router.get("/check/:roomId", requireAuth, handleCheckOwner);
router.get("/my-rooms", requireAuth, handleGetRooms);
router.get("/fetch-room/:roomId", requireAuth, handleGetRoomData);
router.get(
  "/check/permissions/:roomId",
  requireAuth,
  handleGetAccessAndPermission,
);
router.get("/pending-requests/:roomId", requireAuth, handlePendingRequests);

router.post("/create", requireAuth, handleMakeDocRoom);
router.post("/handle-request", requireAuth, handleUserRequest);
router.post("/requests/access", requireAuth, handleUserRequestSave);

router.patch("/rename/:roomId", requireAuth, handleRename);
router.patch(
  "/docs/share-settings/:roomId",
  requireAuth,
  handleRoomShareSettings,
);

router.delete("/delete-room/:roomId", requireAuth, handleDeleteRoom);

export default router;
