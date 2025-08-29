import express from "express";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controller/notes.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected with auth middleware
router.use(verifyToken);

// Create a new note
router.post("/", createNote);

// Get all notes for the authenticated user
router.get("/", getNotes);

// Update a note
router.put("/:id", updateNote);

// Delete a note
router.delete("/:id", deleteNote);

export default router;
