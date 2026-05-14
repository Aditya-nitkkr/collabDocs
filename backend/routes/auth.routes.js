import express, { Router } from "express";
import {
  handleSignUp,
  handleLogin,
  handleVerifyUser,
} from "../controllers/user-auth.controller.js";
import { requireAuth } from "../controllers/jwt.auth.js";

const router = Router();

router.post("/signup", handleSignUp);
router.post("/login", handleLogin);
router.get("/verify", requireAuth, handleVerifyUser);
export default router;
