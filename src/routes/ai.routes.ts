import express from "express";
import type { Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import aiController from "../controller/ai.controller.js";

const router = express.Router();

router.post("/generate-content", verifyToken, aiController.generateNoteContent);

export default router;
